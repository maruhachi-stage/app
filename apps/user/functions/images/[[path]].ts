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
 * Calls the API Worker through a service binding. The API returns image URLs as
 * origin-relative paths, so serving them from the Access-protected Pages origin
 * keeps the browser on one host and lets the bytes be cached at the Pages edge.
 */
export const onRequest = async ({ request, env }: RequestContext): Promise<Response> => {
    const url = new URL(request.url)
    const target = new URL(url.pathname + url.search, 'https://api.internal')
    const headers = new Headers(request.headers)
    headers.set('host', target.host)

    const response = await env.API.fetch(target, {
        method: request.method,
        headers,
        redirect: 'manual',
    })

    const forwarded = new Headers(response.headers)
    forwarded.delete('set-cookie')
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: forwarded,
    })
}
