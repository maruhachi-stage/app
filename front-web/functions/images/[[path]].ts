interface Env {
    API_ORIGIN: string
}

type RequestContext = {
    request: Request
    env: Env
}

/**
 * Forwards /images/* to the API Worker, which serves the R2 bucket. The API
 * returns image URLs as origin-relative paths, so serving them from this same
 * origin keeps the browser on one host and lets the bytes be cached at the
 * Pages edge.
 */
export const onRequest = async ({ request, env }: RequestContext): Promise<Response> => {
    const url = new URL(request.url)
    const apiOrigin = new URL(env.API_ORIGIN)

    const target = new URL(url.pathname + url.search, apiOrigin)
    const headers = new Headers(request.headers)
    headers.set('host', apiOrigin.host)

    const response = await fetch(target, {
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
