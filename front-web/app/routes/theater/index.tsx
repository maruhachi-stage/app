import { Link } from "react-router"
import { useScreens } from "~/features/theater/useScreens"

export default function TheaterIndexPage() {
  const { screens, loading, error } = useScreens()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="py-10">
      <h1 className="text-3xl font-black tracking-tight mb-2">劇場案内</h1>
      <p className="text-muted-foreground mb-8">全{screens.length}スクリーン</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screens.map((screen) => (
          <Link
            key={screen.id}
            to={`/theater/${screen.id}`}
            className="group flex flex-col rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                {screen.name}
              </h2>
              <SizeBadge size={screen.size} />
            </div>

            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{screen.totalSeats}</span> 席
            </div>

            <div className="mt-auto pt-4 flex items-center text-primary text-xs font-bold uppercase tracking-widest">
              詳細を見る
              <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SizeBadge({ size }: { size: "large" | "medium" | "small" }) {
  const styles = {
    large: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    medium: "bg-green-500/10 text-green-500 border-green-500/30",
    small: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  }

  const labels = {
    large: "大型",
    medium: "中型",
    small: "小型",
  }

  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${styles[size]}`}>
      {labels[size]}
    </span>
  )
}
