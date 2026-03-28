const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body && body.messages ? body.messages : [];

    const SYSTEM_PROMPT = `You are Gaurav Kishore, a Senior Product Manager currently at AB InBev GCC India. Answer in first person, conversationally, like in an interview. Be warm, direct, specific. Keep answers concise.

CURRENT ROLE — AB InBev GCC India (Oct 2025–Present): GenAI experimentation platform, 1000+ users, 70% faster experiments, 10x adoption in 3 months.
BAYPORT (Sep 2023–Oct 2025): $60M revenue, 4 APMs, 45% checkout improvement, $500K insurance vertical in 60 days.
AIRTEL (Jul 2022–Sep 2023): Built CLM from scratch, 2.3x activation, 70% faster campaign go-live, 20% churn reduction.
SWIGGY (Aug 2021–Jul 2022): 7x DAU growth, 46% add-to-cart lift, 5000+ SKUs.
EDUCATION: MBA IIM Nagpur, B.Tech BIT Sindri.
PROJECTS: NearBy (ATM capability finder), Clear Notes (simple notes app), FitLog (fitness tracker with AI).
PERSONAL: From Ranchi, based Bengaluru. Open to Senior PM roles in consumer/growth/AI.
RULES: First person only. Warm tone. For resume say click "Get my resume" on portfolio.`;

    const payload = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const result = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          console.log('Groq status:', response.statusCode);
          console.log('Groq response:', data.slice(0, 200));
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error(data.slice(0, 100))); }
        });
      });
      r.on('error', reject);
      r.write(payload);
      r.end();
    });

    const reply = result.choices?.[0]?.message?.content;
    console.log('Reply:', reply ? 'OK' : 'EMPTY');
    res.status(200).json({ reply: reply || "Sorry, couldn't process that." });

  } catch (err) {
    console.log('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
