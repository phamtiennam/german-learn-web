// Cloudflare Worker entry. Handles /api/translate as a same-origin proxy
// to the DeepL API (bypasses browser CORS). All other requests fall through
// to the static assets binding (React SPA + PWA).

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/translate') {
      return handleTranslate(request)
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleTranslate(request: Request): Promise<Response> {
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
