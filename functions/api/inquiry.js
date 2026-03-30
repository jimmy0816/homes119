/**
 * Cloudflare Pages Function: POST /api/inquiry
 * Handles inquiry form submissions for homes119.com
 *
 * Required env vars (set in Cloudflare Pages dashboard):
 *   TELEGRAM_BOT_TOKEN  — Telegram bot token (from @BotFather)
 *   RESEND_API_KEY      — (optional) Resend API key for email notifications
 */

// Simple in-memory rate limiting (per worker instance)
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 3;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(ts => now - ts < windowMs);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  // Cleanup old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, ts] of rateLimitMap) {
      const valid = ts.filter(t => now - t < windowMs);
      if (valid.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, valid);
    }
  }

  return timestamps.length <= maxRequests;
}

function formatTelegramMessage(data) {
  const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  return `🏠 <b>新詢價通知 — homes119.com</b>

📍 <b>地區：</b>${escapeHtml(data.region)}
🏢 <b>房型：</b>${escapeHtml(data.houseType)}
📝 <b>問題描述：</b>${data.description ? escapeHtml(data.description) : '（未填寫）'}
📞 <b>聯絡方式：</b>${escapeHtml(data.contact)}
🕐 <b>提交時間：</b>${now}`;
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegram(botToken, chatId, message) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error('Telegram error:', JSON.stringify(json));
  }
  return json.ok;
}

async function sendResendEmail(apiKey, toEmail, data) {
  const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'homes119.com <noreply@homes119.com>',
      to: [toEmail],
      subject: `【新詢價】${data.region} ${data.houseType}`,
      html: `
        <h2>新詢價通知</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
          <tr><th>地區</th><td>${data.region}</td></tr>
          <tr><th>房型</th><td>${data.houseType}</td></tr>
          <tr><th>問題描述</th><td>${data.description || '（未填寫）'}</td></tr>
          <tr><th>聯絡方式</th><td>${data.contact}</td></tr>
          <tr><th>提交時間</th><td>${now}</td></tr>
        </table>
      `,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('Resend error:', JSON.stringify(json));
  }
  return res.ok;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://homes119.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Rate limiting
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ success: false, error: '提交過於頻繁，請稍後再試。' }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: '無效的請求格式。' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const { region, houseType, description, contact, _honeypot } = body;

  // Honeypot anti-spam check
  if (_honeypot) {
    // Silently accept but don't process
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Validate required fields
  if (!region || !houseType || !contact) {
    return new Response(
      JSON.stringify({ success: false, error: '請填寫必填欄位：地區、房型、聯絡方式。' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const data = { region, houseType, description: description || '', contact };

  // Send Telegram notification
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID || '7854440375';
  const debug = { hasBotToken: !!botToken, tokenPrefix: botToken ? botToken.slice(0,8) + '...' : 'NONE', chatId };
  
  let telegramResult = null;
  if (botToken) {
    const msg = formatTelegramMessage(data);
    telegramResult = await sendTelegram(botToken, chatId, msg);
    debug.telegramOk = telegramResult;
    debug.msgLength = msg.length;
  } else {
    debug.telegramSkipped = true;
  }

  // Send email via Resend (optional)
  const resendKey = env.RESEND_API_KEY;
  const notifyEmail = env.NOTIFY_EMAIL || 'g08163314@gmail.com';
  if (resendKey) {
    await sendResendEmail(resendKey, notifyEmail, data);
    debug.emailSent = true;
  } else {
    debug.emailSkipped = 'no RESEND_API_KEY';
  }

  return new Response(
    JSON.stringify({ success: true, debug }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://homes119.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
