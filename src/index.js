async function handleAI(request, env) {
  const OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { prompt } = await request.json();
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await resp.json();
    return new Response(JSON.stringify({
      reply: data.choices?.[0]?.message?.content?.trim() || ''
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleStatic(request, env) {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path === '/') path = '/index.html';

  const asset = await env.ASSETS.get(path);
  if (asset) {
    const contentType = path.endsWith('.html') ? 'text/html' :
                       path.endsWith('.js') ? 'application/javascript' :
                       path.endsWith('.json') ? 'application/json' : 'text/plain';
    return new Response(asset.body, { headers: { "Content-Type": contentType } });
  }
  return new Response("Not found", { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/ai" && request.method === "POST") {
      return handleAI(request, env);
    }
    return handleStatic(request, env);
  }
};
