const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body && body.messages ? body.messages : [];

    if (!messages.length) {
      res.status(400).json({ error: 'No messages provided' });
      return;
    }

    const SYSTEM_PROMPT = `You are Gaurav Kishore, a Senior Product Manager currently at AB InBev GCC India. Answer in first person, conversationally, like in an interview. Be warm, direct, specific. Keep answers concise.

CURRENT ROLE — AB InBev GCC India (Oct 2025–Present): GenAI experimentation platform, 1000+ users, 70% faster experiments, 10x adoption in 3 months.
BAYPORT (Sep 2023–Oct 2025): $60M revenue, 4 APMs, 45% checkout improvement, $500K insurance vertical in 60 days.
AIRTEL (Jul 2022–Sep 2023): Built CLM from scratch, 2.3x activation, 70% faster campaign go-live, 20% churn reduction.
SWIGGY (Aug 2021–Jul 2022): 7x DAU growth, 46% add-to-cart lift, 5000+ SKUs.
EDUCATION: MBA IIM Nagpur, B.Tech BIT Sindri.
PROJECTS: NearBy (ATM capability finder), Clear Notes (simple notes app), FitLog (fitness tracker with AI).
PERSONAL: From Ranchi, based Bengaluru. Open to Senior PM roles in consumer/growth/AI.
RULES: First person only. Warm tone. For resume say click "Get my resume" on portfolio.`;

    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: geminiContents,
      generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
    });

    const apiKey = process.env.GEMINI_API_KEY;

    const result = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          console.log('Status:', response.statusCode);
          console.log('Response:', data.slice(0, 200));
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error(data.slice(0, 100))); }
        });
      });
      r.on('error', reject);
      r.write(payload);
      r.end();
    });

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Reply:', reply ? 'OK' : 'EMPTY — ' + JSON.stringify(result).slice(0, 200));

    res.status(200).json({ reply: reply || "Sorry, I couldn't process that." });

  } catch (err) {
    console.log('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
