import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowser() {
  for (const p of CHROME_PATHS) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('No Chrome or Edge found. Install one or set CHROME_PATH.');
}

export function htmlToPdf(html, outputPath) {
  const browser = findBrowser();
  console.log('   🌐 Using browser:', browser);

  const tmpDir = path.join(process.cwd(), '.tmp-pdf');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const tmpHtml = path.join(tmpDir, 'input-' + Date.now() + '.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');

  const htmlUrl = 'file:///' + tmpHtml.replace(/\\/g, '/');
  const pdfAbs = path.resolve(outputPath);

  // Remove existing PDF to detect failure correctly
  if (fs.existsSync(pdfAbs)) fs.unlinkSync(pdfAbs);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--virtual-time-budget=5000',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf=${pdfAbs}`,
    '--no-pdf-header-footer',
    htmlUrl,
  ];

  console.log('   📋 Args:', args.join(' '));

  let stderr = '';
  try {
    const result = execFileSync(browser, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60000,
    });
    console.log('   stdout:', result.toString().slice(0, 200));
  } catch (err) {
    stderr = (err.stderr || '').toString();
    console.log('   ⚠️ Exit code:', err.status);
    if (stderr) console.log('   stderr:', stderr.slice(0, 500));
    
    // Fallback: try without --headless=new
    console.log('   🔄 محاولة احتياطية بـ --headless...');
    try {
      const args2 = args.map(a => a === '--headless=new' ? '--headless' : a);
      execFileSync(browser, args2, { stdio: 'pipe', timeout: 60000 });
    } catch (err2) {
      console.log('   ❌ Fallback failed:', (err2.stderr || '').toString().slice(0, 300));
    }
  }

  // Wait a moment for file system to sync
  const start = Date.now();
  while (!fs.existsSync(pdfAbs) && Date.now() - start < 5000) {
    // busy wait
  }

  if (!fs.existsSync(pdfAbs)) {
    throw new Error('PDF not generated. stderr: ' + stderr.slice(0, 300));
  }

  // cleanup
  try { fs.unlinkSync(tmpHtml); } catch {}

  return pdfAbs;
}