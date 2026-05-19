export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { action, prompt } = body;

    // ── Claude: generate concepts or SEO ──────────────────
    if (action === 'concepts' || action === 'seo') {
      const systemPrompt = action === 'seo'
        ? 'You are a top Etsy SEO copywriter. Respond only with valid JSON, no markdown, no explanation.'
        : 'You are a creative POD design expert. Respond only with valid JSON, no markdown, no explanation.';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Netlify.env.get('ANTHROPIC_API_KEY'),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: data.error?.message || 'Claude error' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ text: data.content[0].text }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── DALL-E 3: generate image ───────────────────────────
    if (action === 'image') {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Netlify.env.get('OPENAI_API_KEY')}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI error' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ url: data.data[0].url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: '/api/generate-image'
};
