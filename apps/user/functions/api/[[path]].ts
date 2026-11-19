interface Env {
    API: {
        fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>
    }
}

type RequestContext = {
    request: Request
    env: Env
}

/**
 * Calls the API Worker through a service binding so the browser only talks to
 * this Access-protected Pages origin. Keeping the cookie on this same origin
 * prevents callers from bypassing Access through a public Worker URL.
 */
export const onRequest = async ({ request, env }: RequestContext): Promise<Response> => {
    const url = new URL(request.url)
    const target = new URL(url.pathname + url.search, 'https://api.internal')
    const headers = new Headers(request.headers)
    headers.set('host', target.host)
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

    return env.API.fetch(target, init)
}
