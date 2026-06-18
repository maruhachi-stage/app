import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { FiMoon, FiSun } from "react-icons/fi"
import { AppConfig } from "~/shared/config/app"
import { useAuth } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"
import { Button } from "~/shared/ui/Button"
import { useCart } from "~/features/cart/useCart"
import { useThemeContext } from "~/shared/lib/theme"
import { HoldTimer } from "./HoldTimer"

const NAV_LINKS = [
  { to: "/screenings", label: "上映スケジュール" },
  { to: "/theater", label: "劇場案内" },
  { to: "/shop", label: "ショップ" },
  { to: "/goods", label: "グッズ" },
  { to: "/cart", label: "カート" },
  { to: "/reservations/lookup", label: "予約確認" },
]

function getLogoSrc(theme: "dark" | "light") {
  if (theme === "dark") {
    return AppConfig.logoDarkUrl
  }
  return AppConfig.logoLightUrl
}

export function Header() {
  const { auth, setAuth } = useAuth()
  const { totalCount } = useCart()
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"
  })
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const offsetRef = useRef(0)
  const lastYRef = useRef(0)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme")
      setTheme(currentTheme === "light" ? "light" : "dark")
    }

    updateTheme()

    const observer = new MutationObserver(() => {
      updateTheme()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    if (menuOpen) {
      offsetRef.current = 0
      header.style.transform = ""
      document.documentElement.style.setProperty("--header-scroll-offset", "0px")
      return
    }

    lastYRef.current = window.scrollY

    const onScroll = () => {
      if (window.innerWidth >= 768) {
        header.style.transform = ""
        offsetRef.current = 0
        document.documentElement.style.setProperty("--header-scroll-offset", "0px")
        return
      }

      const currentY = window.scrollY
      const delta = currentY - lastYRef.current
      lastYRef.current = currentY

      if (currentY <= 0) {
        offsetRef.current = 0
        header.style.transform = ""
        document.documentElement.style.setProperty("--header-scroll-offset", "0px")
        return
      }

      const maxOffset = header.offsetHeight
      offsetRef.current = Math.max(-maxOffset, Math.min(0, offsetRef.current - delta))
      header.style.transform = `translateY(${offsetRef.current}px)`
      document.documentElement.style.setProperty("--header-scroll-offset", `${offsetRef.current}px`)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [menuOpen])

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" })
    } catch {
      // ignore
    }

    setAuth({ authenticated: false })
    navigate("/")
    setMenuOpen(false)
  }

  return (
    <>
      <header ref={headerRef} className="bg-background/80 backdrop-blur-md border-b border-border relative z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="container-center flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-black tracking-tighter text-primary" onClick={() => setMenuOpen(false)}>
            <img
              src={getLogoSrc(theme)}
              alt={AppConfig.name}
              className="h-10 w-auto md:h-14"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="relative text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                {label}
                {to === "/cart" && totalCount > 0 && (
                  <span className="absolute -right-4 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                    {totalCount}
                  </span>
                )}
              </Link>
            ))}

            <div className="h-4 w-px bg-border" />

            {auth.authenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/member/reservations" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                  予約履歴
                </Link>
                <div className="h-4 w-px bg-border" />
                <Button variant="ghost" size="sm" onClick={handleLogout} className="font-bold">
                  ログアウト
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" className="font-bold px-6">
                  ログイン
                </Button>
              </Link>
            )}

          </nav>

          <button className="md:hidden text-foreground p-1" onClick={() => setMenuOpen((v) => !v)} aria-label="メニュー">
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        <HoldTimer />
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background md:hidden overflow-y-auto" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary" onClick={() => setMenuOpen(false)}>
              <img
                src={getLogoSrc(theme)}
                alt={AppConfig.name}
                className="h-10 w-auto"
              />
            </Link>
            <button className="text-foreground p-1" onClick={() => setMenuOpen(false)} aria-label="閉じる">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col px-6 pt-8 gap-2">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="rounded-app px-4 py-4 text-2xl font-black text-foreground hover:bg-muted hover:text-primary transition-colors"
              >
                {label}
                {to === "/cart" && totalCount > 0 && (
                  <span className="ml-3 inline-flex min-w-7 items-center justify-center rounded-full bg-primary px-2 py-1 text-sm text-primary-foreground">
                    {totalCount}
                  </span>
                )}
              </Link>
            ))}

            <div className="my-4 border-t border-border" />

            {auth.authenticated ? (
              <>
                <Link
                  to="/member/reservations"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-app px-4 py-4 text-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  予約履歴
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-app px-4 py-4 text-left text-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-app bg-primary px-4 py-4 text-center text-xl font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                ログイン
              </Link>
            )}

            <div className="mt-auto flex justify-end border-t border-border pb-6 pt-5">
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all active:scale-95 ${
                  theme === "dark"
                    ? "border-zinc-600 bg-zinc-100 text-zinc-900 shadow-black/20 hover:bg-white"
                    : "border-zinc-300 bg-zinc-700 text-white shadow-black/15 hover:bg-zinc-800"
                }`}
                aria-label={theme === "dark" ? "ライトテーマに切り替える" : "ダークテーマに切り替える"}
                title={theme === "dark" ? "ライトテーマに切り替える" : "ダークテーマに切り替える"}
              >
                {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
