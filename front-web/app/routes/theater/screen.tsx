import { useParams, Link } from "react-router"
import { useScreen } from "~/features/theater/useScreen"

const descriptions: Record<"large" | "medium" | "small", string> = {
  large: "最大200席の大型スクリーン。最新の音響システムと大画面で、圧倒的な没入感と迫力ある映像体験をお楽しみいただけます。話題の超大作の鑑賞に最適です。",
  medium: "120席の快適な中型スクリーン。どの座席からでも見やすい設計となっており、バランスの良い鑑賞環境を提供します。幅広いジャンルの映画を快適にお楽しみください。",
  small: "70席のアットホームな小型スクリーン。プライベート感のある落ち着いた空間で、映画の世界にじっくりと浸ることができます。ミニシアター系作品やプレミアム上映に最適です。",
}

const sizeLabels: Record<"large" | "medium" | "small", string> = {
  large: "大型スクリーン",
  medium: "中型スクリーン",
  small: "小型スクリーン",
}

const sizeStyles: Record<"large" | "medium" | "small", string> = {
  large: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  medium: "bg-green-500/10 text-green-500 border-green-500/30",
  small: "bg-purple-500/10 text-purple-500 border-purple-500/30",
}

export default function ScreenDetailPage() {
  const { screenId } = useParams()
  const { screen, loading, error } = useScreen(Number(screenId))

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !screen) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-destructive">{error ?? "スクリーンが見つかりません"}</p>
        <Link to="/theater" className="text-primary hover:underline text-sm">
          劇場案内に戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Link
        to="/theater"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        劇場案内に戻る
      </Link>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <h1 className="text-4xl font-black tracking-tight">{screen.name}</h1>
        <span className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider ${sizeStyles[screen.size]}`}>
          {sizeLabels[screen.size]}
        </span>
        <span className="text-muted-foreground text-sm ml-auto">全 <span className="font-bold text-foreground">{screen.totalSeats}</span> 席</span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {screen.backgroundImageUrl ? (
          <div
            className="w-full bg-muted"
            style={{ aspectRatio: `${screen.aspectRatioWidth ?? 16} / ${screen.aspectRatioHeight ?? 9}` }}
          >
            <img
              src={screen.backgroundImageUrl}
              alt={screen.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="bg-muted/50 p-16 flex flex-col items-center justify-center border-b border-border">
            <svg className="w-12 h-12 text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Theater Image</p>
          </div>
        )}

        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">スクリーンの特徴</h2>
            <p className="text-foreground leading-relaxed">{descriptions[screen.size]}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">座席設備</h3>
              <ul className="space-y-2">
                {["全席カップホルダー付き", "ゆったりとした座席ピッチ"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">音響・映像</h3>
              <ul className="space-y-2">
                {["デジタル・サラウンド・サウンド", "高輝度4Kプロジェクター"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
