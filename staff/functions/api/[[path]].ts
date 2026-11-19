interface Env {
    API_ORIGIN: string
}

type RequestContext = {
    request: Request
    env: Env
}

/**
 * Forwards /api/* to the API Worker so the browser only ever talks to this
 * Pages origin. Keeping the request same-origin lets the staff session cookie
 * stay `SameSite=Lax` instead of needing a cross-site cookie exception.
 */
export const onRequest = async ({ request, env }: RequestContext): Promise<Response> => {
    const url = new URL(request.url)
    const apiOrigin = new URL(env.API_ORIGIN)

    const target = new URL(url.pathname + url.search, apiOrigin)
    const headers = new Headers(request.headers)
    headers.set('host', apiOrigin.host)
    headers.set('x-forwarded-host', url.host)
    headers.set('x-forwarded-proto', url.protocol.replace(':', ''))

    const init: RequestInit = {
        method: request.method,
        headers,
        redirect: 'manual',
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body
    }

    return fetch(target, init)
}
