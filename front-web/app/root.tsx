import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";
import { useState, useEffect } from "react";

import type {Route} from "./+types/root";
import "~/app.css";
import {DebugTools} from "~/widgets/DebugTools";
import { AuthContext, getAuthState, type AuthState } from "~/shared/api/auth";
import { useTheme } from "~/shared/lib/theme";
import { ConfigProvider } from "~/shared/config";

export const links: Route.LinksFunction = () => [
    {rel: "preconnect", href: "https://fonts.googleapis.com"},
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
];

export function Layout({children}: { children: React.ReactNode }) {
    const [auth, setAuth] = useState<AuthState>({ authenticated: false })
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        getAuthState().then(setAuth)
    }, [])

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
        <ConfigProvider>
        <html lang="ja" data-theme={theme} suppressHydrationWarning>
        <head>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
            <Meta/>
            <Links/>
        </head>
        <body className="selection:bg-primary/30 selection:text-primary-foreground antialiased">
        <Outlet />
        <ScrollRestoration/>
        <Scripts/>
        <DebugTools theme={theme} toggleTheme={toggleTheme} />
        </body>
        </html>
        </ConfigProvider>
        </AuthContext.Provider>
    );
}

export default function App() {
    return <Outlet />
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
            )}
        </main>
    );
}
