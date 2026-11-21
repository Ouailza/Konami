const http = require('http');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = "9195323787:AAHV95AHKtcnAPExfE6PhvtWAUUqiydpJwk";
const CHAT_ID = process. "6684879160";
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Please set BOT_TOKEN and CHAT_ID environment variables.');
  process.exit(1);
}

const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || [])
    .filter(t => now - t < 60000);

  recent.push(now);
  hits.set(ip, recent);

  return recent.length > 5;
}

function send(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8'
  });

  res.end(JSON.stringify(obj));
}

function readBody(req, maxLen = 2000) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (Buffer.byteLength(body, 'utf8') > maxLen) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function sendToTelegram(message) {
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    }
  );

  return response.ok;
}

function nowStr() {
  return new Date().toLocaleString('ar-DZ', {
    timeZone: 'Africa/Algiers',
    dateStyle: 'full',
    timeStyle: 'short'
  });
}

http.createServer(async (req, res) => {

  // الصفحة الرئيسية
  if (
    req.method === 'GET' &&
    (req.url === '/' || req.url === '/index.html')
  ) {
    try {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });

      return res.end(
        fs.readFileSync(
          path.join(__dirname, 'index.html')
        )
      );

    } catch {
      return send(res, 500, {
        error: 'تعذّر تحميل الصفحة'
      });
    }
  }

  const ip =
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress;

  // الحقل الأول فقط
  if (req.method === 'POST' && req.url === '/api/name') {

    if (limited(ip)) {
      return send(res, 429, {
        error: 'محاولات كثيرة، انتظر قليلاً'
      });
    }

    try {
      const body = await readBody(req);
      const data = JSON.parse(body);

      const name = String(data.name || '')
        .trim()
        .replace(/\s+/g, ' ');

      if (name.length < 3 || name.length > 60) {
        return send(res, 400, {
          error: 'الاسم غير صالح'
        });
      }

      const message =
        `🆕 تسجيل اسم\n` +
        `👤 ${name}\n` +
        `🕒 ${nowStr()}`;

      const ok = await sendToTelegram(message);

      if (!ok) {
        return send(res, 502, {
          error: 'تعذّر الإرسال إلى تيليغرام'
        });
      }

      return send(res, 200, {
        ok: true
      });

    } catch {
      return send(res, 400, {
        error: 'طلب غير صالح'
      });
    }
  }

  res.writeHead(404);
  res.end('Not found');

}).listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
