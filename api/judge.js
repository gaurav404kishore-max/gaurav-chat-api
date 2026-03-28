const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { question, response, rubric } = body;

    const judgePrompt = `You are an evaluator judging a chatbot that answers questions about Gaurav Kishore's professional background.

Question asked: "${question}"

Chatbot response: "${response}"

Scoring rubric: ${rubric}

Score this response from 1-10 based on the rubric. Then classify as Pass (8-10), Partial (5-7), or Fail (1-4).

Respond in this exact JSON format with no other text:
{"score": <number>, "verdict": "<Pass|Partial|Fail>", "reasoning": "<one sentence explaining the score>"}`;

    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: judgePrompt }],
      max_tokens: 200,
      temperature: 0.1
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
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error(data.slice(0, 100))); }
        });
      });
      r.on('error', reject);
      r.write(payload);
      r.end();
    });

    const text = result.choices?.[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const judgment = JSON.parse(clean);

    res.status(200).json(judgment);

  } catch (err) {
    console.log('Judge error:', err.message);
    res.status(200).json({ score: 5, verdict: 'Partial', reasoning: 'Could not evaluate response.' });
  }
};
