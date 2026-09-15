// Cloudflare Worker entry. Same-origin proxy for LLM APIs so the browser
// never talks to api.openai.com / api.anthropic.com directly (avoids CORS
// and hides upstream endpoints). All other requests fall through to the
// static assets binding (React SPA + PWA).

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/translate') {
      return handleDeepL(request)
    }

    if (url.pathname === '/api/llm/openai') {
      return handleLLM(request, {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        buildHeaders: (bearer) => ({
          Authorization: `Bearer ${bearer}`,
          'Content-Type': 'application/json',
        }),
      })
    }

    if (url.pathname === '/api/llm/anthropic') {
      return handleLLM(request, {
        endpoint: 'https://api.anthropic.com/v1/messages',
        buildHeaders: (bearer) => ({
          'x-api-key': bearer,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        }),
      })
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleDeepL(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('DeepL-Auth-Key ')) {
    return new Response('Missing DeepL-Auth-Key header', { status: 400 })
  }

  const key = auth.slice('DeepL-Auth-Key '.length)
  const endpoint = key.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'

  const body = await request.text()
  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const responseBody = await upstream.text()
  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      'Content-Type':
        upstream.headers.get('Content-Type') ?? 'application/json',
    },
  })
}

interface UpstreamConfig {
  endpoint: string
  buildHeaders: (bearer: string) => Record<string, string>
}

async function handleLLM(
  request: Request,
  config: UpstreamConfig,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Missing Bearer token', { status: 400 })
  }
  const bearer = auth.slice('Bearer '.length)

  const body = await request.text()
  const upstream = await fetch(config.endpoint, {
    method: 'POST',
    headers: config.buildHeaders(bearer),
    body,
  })

  const responseBody = await upstream.text()
  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      'Content-Type':
        upstream.headers.get('Content-Type') ?? 'application/json',
    },
  })
}
