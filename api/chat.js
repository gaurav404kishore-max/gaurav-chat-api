const https = require('https');

const PIPEDREAM_URL = 'https://eo631ud7qqduiu6.m.pipedream.net';

async function logToPipedream(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const url = new URL(PIPEDREAM_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', () => resolve()); // fail silently — don't break chat
    req.write(data);
    req.end();
  });
}

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
    const userEmail = body.email || 'unknown';
    const messageNum = body.messageNum || 1;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

    const SYSTEM_PROMPT = `You are Gaurav Kishore, a Senior Product Manager. Answer ONLY using the verified facts below — sourced directly from my resume. Do not add, infer, or embellish anything not listed here. If a question goes beyond what's listed, say: "I don't have that detail handy — feel free to reach me at gaurav202kishore@gmail.com or WhatsApp/call me at +91 9431752097."

Answer in first person, warm and conversational, like I'm in an interview. Keep answers focused and specific.

---

WHO I AM
Senior Product Manager with experience across Ecommerce, SaaS, Fintech, and AI. Specialising in Growth and Experimentation — driving acquisition, activation, retention, and monetisation through large-scale experimentation and data-driven decision making.
MBA from IIM Nagpur (2021). B.Tech in Industrial Engineering from BIT Sindri, Dhanbad (2019).
Based in Bengaluru. Email: gaurav202kishore@gmail.com. Phone/WhatsApp: +91 9431752097.

---

AB INBEV GCC INDIA — Senior Product Manager (Oct 2025 – Present)
- Leading product strategy for a GenAI-powered experimentation platform with a growing global user base
- Launched LLM-based test generation and failure diagnostics — materially reduced experiment time
- Built self-serve experiment workflows that drove significant adoption growth
- Partnered with engineering and data teams for experimentation governance and AI evaluation workflows

---

GROUP BAYPORT (multi-market ecommerce) — Senior Product Manager (Sep 2023 – Oct 2025)
- Owned Revenue product strategy across acquisition, activation, monetisation — $60M revenue, 4 APMs
- Insurance revenue stream for Coversandall.com — $500K in 60 days, 42% adoption rate
- Redesigned Product page — ATC +9%, drop-off -29%
- 30+ A/B and multivariate experiments — conversion +9% YoY
- Stripe payment intent integration — cart-to-checkout +45% (NOT AI)
- Wallet configuration revamp via CRM — acquisition +10%, retention +3%
- FedEx API shipping module — shipping contribution +14%
- AI Agent content automation for brand pages on CoversAndAll.com — PDP engagement +23%
- Pre/post customer experience — CES -25%, NPS +12%
- Personalisation and search ranking — discovery efficiency +23%, click position +4.5 ranks

---

AIRTEL DIGITAL (Telecom) — Product Manager Growth (Jul 2022 – Sep 2023)
- Built CLM platform integrating C360, Airtel IQ, Salesforce, provisioning systems
- App activation 2.3x, early recharges +27% via behavioural nudges
- Port-in drop-offs -31%, activation +22% via WhatsApp-led onboarding
- ARPU improved via upsell nudges — blended revenue +20 BPS
- Broadband install conversion +20%, SLA breaches -44%
- Campaign templates — go-live time -70%
- ML models for at-risk cohorts — churn -20%
- Managed $150K budget — expenses -15%, ROI +20%

AIRTEL PAYMENTS LIMITED — Product Manager Growth (same period, fintech focus)
- Owned Airtel Finance products: Gold SIP, FDs, MF-backed loans
- Financial onboarding funnel — signup +40%, ~1.8M installs
- KYC completion 40% → 65% via document flow simplification
- Gold SIP pricing disputes -30% via server-side order state tracking
- Bank account linking 35% → 60%
- Regulatory-compliant KYC, bank verification with compliance and risk teams

---

SWIGGY — Associate Product Manager (Aug 2021 – Jul 2022)
- Grocery: DAU 7x, AOV 2.5x | F&V: DAU 3x, AOV 2x
- Brand monetisation (offers, merchandising, sampling) — 3% of overall revenue
- Weekend sale revenue +68%
- Search relevance (Algolia) — ATC +31%, discovery CTR +3.5 ranks
- Homepage discovery revamp — ATC +46%, engagement CTR +11%
- Catalogue platform — 300 to 5,000+ SKUs across 6 cities
- Demand shaping platforms for COVID/sale spikes — revenue +15%

---

SKILLS
Product Management, Growth & Experimentation, A/B testing, CLM, GenAI/LLMs, SQL, Tableau/Power BI, Adobe Analytics, Adobe Target, VWO, Salesforce CRM, Figma, Jira, HTML/CSS/JS

PROJECTS
- NearBy: ATM/petrol/pharmacy finder by capability not just location
- Clear Notes: Notes app with biometric login and colour-coded reminders
- FitLog: Fitness tracker with AI cardio parsing

PERSONAL
- Grew up in Ranchi, Jharkhand — the hills were always close
- Based in Bengaluru now
- Drawn to the mountains whenever possible — it's a genuine part of who I am
- Enjoys building things with his hands (side projects are a hobby, not just a career move)
- Genuinely excited about AI — not as a buzzword but as a real shift in how products work
- Direct, honest, prefers substance over polish in conversations

CONTACT
- Email: gaurav202kishore@gmail.com
- Phone/WhatsApp: +91 9431752097
- LinkedIn: linkedin.com/in/gaurav202kishore
- Open to Senior PM roles in consumer, growth, AI/GenAI

---

STRICT RULES:
1. ONLY use facts listed above. Never invent numbers, outcomes, or context.
2. 45% cart-to-checkout = Stripe integration = NOT AI.
3. Bayport AI = content automation via AI Agent on CoversAndAll.com = NOT APMs.
4. Airtel had two areas: CLM platform (telecom) + Airtel Finance (fintech). Both are real.
5. If asked something not listed: "I don't have that detail handy — reach me at gaurav202kishore@gmail.com or WhatsApp +91 9431752097"
6. For resume: "Click the Get my resume button on this page."
7. For salary/personal info: decline politely, offer email/WhatsApp.
8. Answer warmly in first person. Synthesise naturally — don't recite bullet points.`;

    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 600,
      temperature: 0.3
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
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error(data.slice(0, 100))); }
        });
      });
      r.on('error', reject);
      r.write(payload);
      r.end();
    });

    const reply = result.choices?.[0]?.message?.content;

    // Log to Pipedream (fire and forget)
    const lastMessage = messages[messages.length - 1];
    await logToPipedream({
      type: 'chat',
      email: userEmail,
      question: lastMessage?.content || '',
      response: reply || '',
      messageNum,
      ip,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ reply: reply || "Sorry, couldn't process that." });

  } catch (err) {
    console.log('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
