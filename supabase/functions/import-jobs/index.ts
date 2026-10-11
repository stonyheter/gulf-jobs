import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const APIFY_ACTOR = "solidcode~bayt-scraper";

interface ImportResult {
  success: boolean;
  fetched: number;
  inserted: number;
  skipped: number;
  errors: string[];
  duration_ms: number;
}

function mapApifyToJob(job: any) {
  const now = new Date().toISOString();
  const datePosted = job.postedAt ? new Date(job.postedAt).toISOString() : now;

  const countryMap: Record<string, string> = {
    "saudi-arabia": "المملكة العربية السعودية",
    "uae": "الإمارات العربية المتحدة",
    "qatar": "قطر", "kuwait": "الكويت", "bahrain": "البحرين",
    "oman": "عمان", "egypt": "مصر", "jordan": "الأردن",
  };
  const country = countryMap[(job.country || "").toLowerCase()] || job.country || "السعودية";

  const legacyId = "bayt-" + (job.id || job.jobId || Date.now().toString(36) + Math.random().toString(36).slice(2,6));

  const slugBase = (job.title || "job")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const slug = slugBase + "-" + legacyId.slice(-6);

  // عنوان احتياطي عربي إذا كان العنوان إنجليزيًا (بدون ترجمة API)
  let title = job.title || "وظيفة";
  const company = job.company || "شركة";

  return {
    legacy_id: legacyId,
    title: title,
    company_name: company,
    company_logo: job.companyLogo || null,
    category: (job.category || "general").toLowerCase().replace(/\s+/g, "_"),
    country: country,
    region: null,
    city: job.city || job.location || "غير محدد",
    district: null, address: null,
    work_mode: job.remote ? "remote" : "on_site",
    employment_type: "full_time",
    experience_min: null, experience_max: null, education: null,
    salary_min: job.salaryMin || null,
    salary_max: job.salaryMax || null,
    salary_currency: job.salaryCurrency || "SAR",
    description: String(job.description || (title + " في " + company)).slice(0, 5000),
    responsibilities: [], requirements: [], skills: [],
    languages: ["ar", "en"], benefits: [],
    application_method: "external_url",
    application_url: job.url || job.applyUrl || null,
    source_name: "Bayt.com",
    source_url: job.url || job.applyUrl || null,
    original_job_url: job.url || job.applyUrl || null,
    date_posted: datePosted,
    valid_through: null,
    status: "published",
    slug: slug,
    imported_at: now,
    last_checked_at: now,
  };
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  const result: ImportResult = { success: false, fetched: 0, inserted: 0, skipped: 0, errors: [], duration_ms: 0 };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apifyToken = Deno.env.get("APIFY_API_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase credentials");
    if (!apifyToken) throw new Error("Missing APIFY_API_TOKEN");

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    console.log("Calling Bayt Arabic Scraper (FAST MODE)...");

    // Apify: use timeout to fail-fast if actor takes too long
    const apifyUrl = "https://api.apify.com/v2/acts/" + APIFY_ACTOR + "/run-sync-get-dataset-items?token=" + apifyToken + "&timeout=100";

    // FAST INPUT: startUrls with Arabic listing pages, no per-job fetch
    const apifyInput = {
      startUrls: [
        { url: "https://www.bayt.com/ar/saudi-arabia/jobs/" },
        { url: "https://www.bayt.com/ar/uae/jobs/" },
      ],
      language: "ar",
      maxResults: 20,
      fetchJobDetails: false,   // ← المفتاح! لا يزور كل صفحة
      proxyConfiguration: { useApifyProxy: true },
    };

    const apifyResponse = await fetch(apifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apifyInput),
    });

    if (!apifyResponse.ok) {
      const errText = await apifyResponse.text();
      throw new Error("Apify API returned " + apifyResponse.status + ": " + errText.slice(0, 500));
    }

    const jobs = await apifyResponse.json();
    result.fetched = Array.isArray(jobs) ? jobs.length : 0;
    console.log("Fetched " + result.fetched + " jobs in " + (Date.now() - startTime) + "ms");

    if (!Array.isArray(jobs) || jobs.length === 0) {
      result.success = true; result.duration_ms = Date.now() - startTime;
      return Response.json(result);
    }

    const sourceUrls = jobs.map((j: any) => j.url || j.applyUrl).filter((u: any): u is string => Boolean(u));
    const { data: existing } = await supabase.from("jobs").select("source_url").in("source_url", sourceUrls);
    const existingUrls = new Set((existing || []).map((r: any) => r.source_url));

    const toInsert = jobs.filter((job: any) => {
      const u = job.url || job.applyUrl;
      return u && !existingUrls.has(u);
    }).map(mapApifyToJob);

    result.skipped = jobs.length - toInsert.length;

    if (toInsert.length === 0) {
      result.success = true; result.duration_ms = Date.now() - startTime;
      return Response.json(result);
    }

    for (let i = 0; i < toInsert.length; i += 20) {
      const batch = toInsert.slice(i, i + 20);
      const { error } = await supabase.from("jobs").insert(batch);
      if (error) result.errors.push("Batch: " + error.message);
      else result.inserted += batch.length;
    }

    result.success = true; result.duration_ms = Date.now() - startTime;
    console.log("Done: " + result.inserted + " inserted in " + result.duration_ms + "ms");
    return Response.json(result);

  } catch (err) {
    console.error("Fatal:", err);
    result.errors.push(err instanceof Error ? err.message : String(err));
    result.duration_ms = Date.now() - startTime;
    return Response.json(result, { status: 500 });
  }
});