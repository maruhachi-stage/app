import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="container-center py-12">
        {/* 上部: ロゴ + リンク群 */}
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">

          {/* 左: ブランド情報 */}
          <div className="max-w-xs">
            {/* H ロゴバッジ + サイト名 */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-yellow-400 text-sm font-black text-black">H</div>
              <span className="text-lg font-black tracking-tight text-foreground">{AppConfig.name}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              HAL-cinema 新宿。8スクリーン・1,050席。映画と演劇のための、新しい劇場体験。
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              東京都新宿区新宿X-X-X　／　03-XXXX-XXXX
            </p>
          </div>

          {/* 右: リンク3カラム */}
          <div className="flex gap-10 sm:gap-16">
            {/* BOOKING */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking</p>
              <ul className="space-y-3">
                {["上映スケジュール","作品一覧","演劇公演"].map(label => (
                  <li key={label}>
                    <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* SHOP */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shop</p>
              <ul className="space-y-3">
                <li><Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors">フード・ドリンク</Link></li>
                <li><Link to="/goods" className="text-sm text-muted-foreground hover:text-foreground transition-colors">グッズ</Link></li>
              </ul>
            </div>
            {/* ABOUT */}
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">About</p>
              <ul className="space-y-3">
                <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">シアター案内</Link></li>
                <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">アクセス</Link></li>
                <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">会員プログラム</Link></li>
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">お問い合わせ</Link></li>
              </ul>
            </div>
          </div>

        </div>

        {/* 下部バー */}
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground/60">© 2026 HAL-cinema (架空のサイト)</p>
          <p className="text-xs text-muted-foreground/40 font-mono">v.0.9.2 — IMPROVED UX BUILD</p>
        </div>
      </div>
    </footer>
  )
}
