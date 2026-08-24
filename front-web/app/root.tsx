import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useNavigation
} from "react-router";

import { useState, useEffect } from "react";

import Loading from "~/components/Loading";

import type {Route} from "./+types/root";
import "~/app.css";
import { getAuthState, type AuthState } from "~/lib/api/auth";
import { AuthContext } from "~/components/AuthProvider";
import { ThemeContext, useTheme } from "~/lib/theme";
import { ConfigProvider } from "~/config";
import { CartProvider } from "~/components/CartProvider";

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
    const { theme, setTheme } = useTheme();

    const navigation = useNavigation();
    const [showLoading, setShowLoading] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);


    useEffect(() => {
    if (navigation.state === "loading") {
        setStartTime(Date.now());
        setShowLoading(true);
    } else if (startTime !== null) {
        const elapsed = Date.now() - startTime;

        const minDuration = 500; // ←ここ変える
        const remaining = Math.max(minDuration - elapsed, 0);

        const timer = setTimeout(() => {
        setShowLoading(false);
        setStartTime(null);
        }, remaining);

        return () => clearTimeout(timer);
    }
    }, [navigation.state, startTime]);



    useEffect(() => {
        getAuthState().then(setAuth)
    }, [])

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
        <CartProvider>
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

        {/* 追加 */}
        {showLoading && <Loading />}

        <ThemeContext.Provider value={{ theme, setTheme }}>
        <Outlet />
        </ThemeContext.Provider>

        <ScrollRestoration/>
        <Scripts/>
        </body>
        </html>
        </ConfigProvider>
        </CartProvider>
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
