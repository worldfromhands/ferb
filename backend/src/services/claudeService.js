const Anthropic = require('@anthropic-ai/sdk');
let client = null;
function getClient() {
  if (client) return client;
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY nao configurada no .env');
  client = new Anthropic({ apiKey });
  return client;
}
async function ask(systemPrompt, userPrompt) {
  const anthropic = getClient();
  const resp = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  return resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}
module.exports = { ask };
