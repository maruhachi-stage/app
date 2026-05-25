import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { useAuth } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"
import { Button } from "~/shared/ui/Button"
import { HoldTimer } from "./HoldTimer"

export function Header() {
  const { auth, setAuth } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const offsetRef = useRef(0)
  const lastYRef = useRef(0)

  // メニュー展開中はbodyスクロール禁止
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  // スクロール追従 (モバイルのみ・直接DOM操作でRAFなしでも滑らか)
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

  const NAV_LINKS = [
    { to: "/movies", label: "映画一覧" },
    { to: "/theater", label: "劇場案内" },
    { to: "/shop", label: "ショップ" },
    { to: "/goods", label: "グッズ" },
    { to: "/cart", label: "カート" },
    { to: "/reservations/lookup", label: "予約確認" },
  ]

  return (
    <>
      <header
        ref={headerRef}
        className="bg-background/80 backdrop-blur-md border-b border-border relative z-50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container-center flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-black tracking-tighter text-primary" onClick={() => setMenuOpen(false)}>
            {AppConfig.name}
          </Link>

          {/* デスクトップ nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                {label}
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

          {/* モバイル: ハンバーガーボタン */}
          <button
            className="md:hidden text-foreground p-1"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="メニュー"
          >
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

      {/* フルスクリーンメニュー（モバイル） */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col bg-background md:hidden overflow-y-auto"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary" onClick={() => setMenuOpen(false)}>
              {AppConfig.name}
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
                className="rounded-xl px-4 py-4 text-2xl font-black text-foreground hover:bg-muted hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="my-4 border-t border-border" />

            {auth.authenticated ? (
              <>
                <Link
                  to="/member/reservations"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-4 text-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  予約履歴
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-xl px-4 py-4 text-left text-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-xl bg-primary px-4 py-4 text-center text-xl font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
