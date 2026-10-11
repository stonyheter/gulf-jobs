export function buildDigestEmail(user, jobs) {
  const jobCards = jobs.map((j, i) => {
    const pct = Math.round(j.similarity * 100);
    const tier = pct >= 75 ? '🏆' : pct >= 60 ? '⭐' : '✨';

    return `
      <tr>
        <td class="job-row" style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
          <!-- Badge + Title -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" class="job-header">
            <tr>
              <td class="job-title-cell" style="vertical-align: top; padding-bottom: 8px;">
                <div class="job-title" style="font-size: 15px; font-weight: 700; color: #065f46; line-height: 1.5; margin-bottom: 6px;">${j.title}</div>
                <div class="job-company" style="font-size: 13px; color: #059669; margin-bottom: 4px;">🏢 ${j.company_name}</div>
                <div class="job-location" style="font-size: 12px; color: #64748b;">📍 ${j.city || 'غير محدد'}، ${j.country || 'السعودية'}</div>
              </td>
              <td class="job-badge-cell" align="left" valign="top" style="width: 80px;">
                <div class="match-badge" style="display: inline-block; background: #d1fae5; color: #065f46; padding: 5px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700; white-space: nowrap;">${tier} ${pct}%</div>
              </td>
            </tr>
          </table>

          <!-- Actions -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" class="job-actions" style="margin-top: 12px;">
            <tr>
              <td class="action-cell">
                <a href="${j.applyUrl}" class="btn-primary" style="display: inline-block; background: #059669; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; text-align: center;">📄 أنشئ سيرتي</a>
              </td>
              <td class="action-cell" style="padding-right: 8px;">
                <a href="${j.originalUrl}" class="btn-secondary" style="display: inline-block; color: #059669; font-size: 12px; text-decoration: none; padding: 10px 8px;">عرض الوظيفة →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>وظائف جديدة تطابق مهاراتك</title>
<style>
  /* ═══ Base Reset ═══ */
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

  /* ═══ Container ═══ */
  .email-wrapper { width: 100%; background: #f1f5f9; padding: 20px 10px; }
  .email-container { max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(5,150,105,0.08); }

  /* ═══ Sections ═══ */
  .section-pad { padding: 25px 25px; }
  .section-pad-sm { padding: 15px 20px; }
  .section-pad-xs { padding: 12px 16px; }

  /* ═══ Stats grid ═══ */
  .stats-table { width: 100%; border-collapse: separate; border-spacing: 8px 0; }
  .stats-cell { padding: 12px 6px; background: #f0fdf4; border-radius: 8px; text-align: center; }
  .stats-num { font-size: 18px; font-weight: 700; color: #059669; line-height: 1.2; }
  .stats-label { font-size: 10.5px; color: #64748b; margin-top: 2px; }

  /* ═══ Mobile ═══ */
  @media only screen and (max-width: 480px) {
    .email-wrapper { padding: 10px 6px !important; }
    .email-container { border-radius: 10px !important; }
    .section-pad { padding: 18px 15px !important; }
    .section-pad-sm { padding: 12px 14px !important; }
    .section-pad-xs { padding: 10px 12px !important; }

    .hero-pad { padding: 25px 15px !important; }
    .hero h1 { font-size: 18px !important; }
    .hero p { font-size: 13px !important; }
    .hero-icon { font-size: 38px !important; }

    .stats-cell { padding: 10px 4px !important; }
    .stats-num { font-size: 16px !important; }
    .stats-label { font-size: 10px !important; }

    .job-row { padding: 14px 0 !important; }
    .job-title { font-size: 14px !important; }
    .job-company { font-size: 12.5px !important; }
    .job-location { font-size: 11.5px !important; }
    .match-badge { font-size: 10.5px !important; padding: 4px 8px !important; }
    .job-badge-cell { width: 70px !important; }

    .btn-primary { font-size: 12.5px !important; padding: 9px 14px !important; }
    .btn-secondary { font-size: 11.5px !important; padding: 9px 6px !important; }
    .action-cell { display: block !important; width: 100% !important; margin-bottom: 8px !important; padding: 0 !important; }
    .action-cell a { display: block !important; text-align: center !important; }

    .cta-btn { font-size: 14px !important; padding: 12px 20px !important; display: block !important; }
    .footer-text { font-size: 11px !important; }
    .footer-links a { font-size: 10.5px !important; }
  }

  @media only screen and (max-width: 360px) {
    .section-pad { padding: 15px 12px !important; }
    .job-title { font-size: 13px !important; }
    .stats-num { font-size: 14px !important; }
  }
</style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f1f5f9; direction: rtl;">

  <div class="email-wrapper">
    <div class="email-container">

      <!-- ═══ HEADER ═══ -->
      <div class="hero-pad" style="background: linear-gradient(135deg, #059669, #047857); padding: 30px 25px; text-align: center; color: white;">
        <div class="hero-icon" style="font-size: 44px; margin-bottom: 10px; line-height: 1;">🎯</div>
        <h1 style="margin: 0 0 8px; font-size: 21px; font-weight: 700; line-height: 1.4;">مرحباً ${user.full_name || 'بك'}!</h1>
        <p style="margin: 0; font-size: 14px; opacity: 0.95; line-height: 1.5;">وجدنا <strong>${jobs.length}</strong> وظيفة جديدة تطابق مهاراتك</p>
      </div>

      <!-- ═══ STATS ═══ -->
      <div class="section-pad-sm">
        <table class="stats-table" cellpadding="0" cellspacing="8" border="0" width="100%">
          <tr>
            <td class="stats-cell" width="33%">
              <div class="stats-num">${jobs.length}</div>
              <div class="stats-label">وظيفة جديدة</div>
            </td>
            <td class="stats-cell" width="33%">
              <div class="stats-num">${Math.round(jobs[0].similarity * 100)}%</div>
              <div class="stats-label">أعلى توافق</div>
            </td>
            <td class="stats-cell" width="33%">
              <div class="stats-num">${(user.digests_sent || 0) + 1}</div>
              <div class="stats-label">رسالة رقم</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- ═══ JOBS LIST ═══ -->
      <div class="section-pad">
        <h2 style="font-size: 15px; color: #065f46; margin: 0 0 12px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; font-weight: 700;">الوظائف المقترحة لك</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${jobCards}
        </table>
      </div>

      <!-- ═══ CTA ═══ -->
      <div class="section-pad-sm" style="text-align: center;">
        <a href="https://gulf-jobs.com/matches?u=${user.user_id}" class="cta-btn" style="display: inline-block; background: #065f46; color: white; padding: 14px 35px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700;">🔍 اعرض المزيد من الوظائف</a>
      </div>

      <!-- ═══ FOOTER ═══ -->
      <div class="section-pad-xs" style="background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
        <p class="footer-text" style="margin: 0 0 8px; font-size: 12px; color: #64748b; line-height: 1.5;">هذه الرسالة من <strong style="color: #059669;">منصة وظائف الخليج</strong></p>
        <p class="footer-links" style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
          <a href="https://gulf-jobs.com/unsubscribe?u=${user.user_id}" style="color: #94a3b8; text-decoration: underline;">إلغاء الاشتراك</a>
          &nbsp;•&nbsp;
          <a href="https://gulf-jobs.com/settings?u=${user.user_id}" style="color: #94a3b8; text-decoration: underline;">تعديل التفضيلات</a>
        </p>
      </div>

    </div>
  </div>

</body>
</html>`;
}