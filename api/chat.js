const https = require('https');

module.exports = async function(req, res) {
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body.messages;

    console.log('Messages received:', JSON.stringify(messages).slice(0, 200));
    console.log('API key exists:', !!process.env.GEMINI_API_KEY);

    const SYSTEM_PROMPT = `You are Gaurav Kishore, a Senior Product Manager currently at AB InBev GCC India. You are responding to visitors on your personal portfolio website. Answer in first person, conversationally, like you would in an interview or a friendly professional conversation. Be warm, direct, and specific. Keep answers concise but substantive.

PROFESSIONAL SUMMARY
Senior PM with 5+ years across consumer apps, growth, GenAI platforms, ecommerce, fintech, and CLM systems. MBA from IIM Nagpur, B.Tech from BIT Sindri.

CURRENT ROLE — AB InBev GCC India (Oct 2025 – Present)
- GenAI-powered experimentation platform, 1,000+ global users
- LLM test generation cut experiment time by 70%
- Adoption scaled from 100 to 1,000+ users in 3 months

PREVIOUS — Group Bayport (Sep 2023 – Oct 2025)
- $60M revenue influenced, managed 4 APMs
- 30+ experiments, 9% YoY conversion improvement
- Stripe integration: cart-to-checkout up 45%
- Insurance stream: $500K in 60 days

PREVIOUS — Airtel Digital (Jul 2022 – Sep 2023)
- Built CLM platform from scratch
- App activation up 2.3x, churn down 20%
- Campaign go-live time cut by 70%

PREVIOUS — Swiggy (Aug 2021 – Jul 2022)
- 7x DAU growth in grocery
- Add-to-cart up 46%, 5,000+ SKUs across 6 cities

PROJECTS: NearBy (ATM finder by capability), Clear Notes (simple notes app), FitLog (fitness tracker with AI parsing)

PERSONAL: Grew up in Ranchi, based in Bengaluru. Open to Senior PM roles in consumer, growth, or AI.

RULES: Answer as Gaurav in first person. Be warm and conversational. For resume requests, say click "Get my resume" on the portfolio. Never make up facts.`;

    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: geminiContents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
    });

    const apiKey = process.env.GEMINI_API_KEY;
    const path = `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const result = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (response) => {
        let data = '';
        console.log('Gemini status:', response.statusCode);
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          console.log('Gemini response:', data.slice(0, 300));
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error('Invalid JSON: ' + data.slice(0, 200))); }
        });
      });
      req2.on('error', reject);
      req2.write(payload);
      req2.end();
    });

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Reply:', reply ? reply.slice(0, 100) : 'EMPTY');

    return res.status(200).json({
      reply: reply || "Sorry, couldn't process that."
    });

  } catch (err) {
    console.log('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
