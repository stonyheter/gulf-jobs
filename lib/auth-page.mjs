export function buildAuthPage(returnUrl = '/') {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تسجيل الدخول — وظائف الخليج</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
  body { background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #ecfeff 100%); min-height: 100vh; padding: 30px 20px; color: #1e293b; display: flex; align-items: center; justify-content: center; }
  .container { max-width: 440px; width: 100%; }
  .card { background: white; border-radius: 18px; padding: 40px 32px; box-shadow: 0 10px 40px rgba(5,150,105,0.12); }
  .logo { text-align: center; margin-bottom: 25px; }
  .logo-icon { font-size: 40px; margin-bottom: 10px; }
  .logo h1 { color: #065f46; font-size: 22px; }
  .logo p { color: #64748b; font-size: 13px; margin-top: 4px; }

  .step { display: none; }
  .step.active { display: block; }

  .field { margin-bottom: 18px; }
  .field label { display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px; }
  .field input { width: 100%; padding: 13px 15px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 15px; background: #fafbfc; transition: border 0.15s; text-align: center; }
  .field input:focus { outline: none; border-color: #059669; background: white; }
  .field input[type="email"] { text-align: left; direction: ltr; }
  .field input.otp { font-size: 28px; letter-spacing: 12px; font-weight: 800; color: #065f46; font-family: 'Courier New', monospace; }

  .btn { width: 100%; background: #059669; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
  .btn:hover { background: #047857; transform: translateY(-1px); }
  .btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-link { background: transparent; color: #059669; border: none; padding: 10px; font-size: 13px; cursor: pointer; text-decoration: underline; width: 100%; }

  .status { padding: 12px 16px; border-radius: 10px; margin-bottom: 15px; font-size: 13.5px; display: none; text-align: center; line-height: 1.6; }
  .status.error { background: #fee2e2; color: #991b1b; display: block; }
  .status.success { background: #d1fae5; color: #065f46; display: block; }
  .status.info { background: #dbeafe; color: #1e40af; display: block; }

  .hint { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 12px; line-height: 1.6; }
  .divider { text-align: center; color: #94a3b8; font-size: 12px; margin: 20px 0; }

  .back { text-align: center; margin-top: 20px; }
  .back a { color: #059669; font-size: 13px; text-decoration: none; }
  .back a:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="logo">
      <div class="logo-icon">🎯</div>
      <h1>وظائف الخليج</h1>
      <p>سجّل دخولك لإكمال رحلتك</p>
    </div>

    <div id="status" class="status"></div>

    <!-- Step 1: Email -->
    <div id="step1" class="step active">
      <div class="field">
        <label>البريد الإلكتروني</label>
        <input type="email" id="email" placeholder="name@example.com" autocomplete="email">
      </div>
      <button class="btn" id="sendBtn" onclick="sendOtp()">📧 أرسل رمز الدخول</button>
      <p class="hint">سنرسل لك رمزًا مكوّنًا من 6 أرقام<br>صالح لمدة ساعة واحدة</p>
    </div>

    <!-- Step 2: OTP -->
    <div id="step2" class="step">
      <p style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 18px;">
        أرسلنا رمزًا إلى <strong id="sentTo" style="color: #059669;"></strong>
      </p>
      <div class="field">
        <input type="text" id="otp" class="otp" placeholder="──────" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
      </div>
      <button class="btn" id="verifyBtn" onclick="verifyOtp()">✅ تأكيد الدخول</button>
      <button class="btn-link" onclick="backToEmail()">↩️ تغيير البريد الإلكتروني</button>
      <button class="btn-link" onclick="sendOtp()">📨 إعادة إرسال الرمز</button>
    </div>

    <div class="back">
      <a href="${returnUrl}">← العودة للموقع</a>
    </div>
  </div>
</div>

<script>
  const RETURN_URL = ${JSON.stringify(returnUrl)};
  let currentEmail = '';

  const status = document.getElementById('status');
  function showStatus(type, msg) {
    status.className = 'status ' + type;
    status.textContent = msg;
  }
  function clearStatus() { status.className = 'status'; }

  async function sendOtp() {
    const email = document.getElementById('email').value.trim();
    if (!email || !email.includes('@')) {
      showStatus('error', '⚠️ الرجاء إدخال بريد إلكتروني صحيح');
      return;
    }

    const btn = document.getElementById('sendBtn');
    btn.disabled = true;
    btn.textContent = '⏳ جاري الإرسال...';
    clearStatus();

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');

      currentEmail = email;
      document.getElementById('sentTo').textContent = email;
      document.getElementById('step1').classList.remove('active');
      document.getElementById('step2').classList.add('active');
      document.getElementById('otp').focus();
      showStatus('success', '✅ تم إرسال الرمز! تحقق من بريدك');
    } catch (err) {
      showStatus('error', '❌ ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '📧 أرسل رمز الدخول';
    }
  }

  async function verifyOtp() {
    const token = document.getElementById('otp').value.trim();
    if (token.length !== 6) {
      showStatus('error', '⚠️ الرمز يجب أن يكون 6 أرقام');
      return;
    }

    const btn = document.getElementById('verifyBtn');
    btn.disabled = true;
    btn.textContent = '⏳ جاري التحقق...';
    clearStatus();

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحقق');

      showStatus('success', '✅ تم الدخول! جاري التحويل...');
      setTimeout(() => { window.location.href = RETURN_URL; }, 800);
    } catch (err) {
      showStatus('error', '❌ ' + err.message);
      btn.disabled = false;
      btn.textContent = '✅ تأكيد الدخول';
    }
  }

  function backToEmail() {
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
    document.getElementById('otp').value = '';
    clearStatus();
  }

  document.getElementById('email').addEventListener('keypress', e => {
    if (e.key === 'Enter') sendOtp();
  });
  document.getElementById('otp').addEventListener('keypress', e => {
    if (e.key === 'Enter') verifyOtp();
  });
  document.getElementById('otp').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
</script>
</body>
</html>`;
}