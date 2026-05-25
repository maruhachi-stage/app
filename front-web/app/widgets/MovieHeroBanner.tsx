import type { ReactNode } from "react"
import { proxyImageUrl } from "~/shared/lib/image"

type Props = {
  title: string
  posterUrl?: string | null
  meta?: ReactNode
}

export function MovieHeroBanner({ title, posterUrl, meta }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-app border border-border bg-card shadow-sm p-4 mb-8">
      <div className="shrink-0 w-16 aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
        {posterUrl ? (
          <img
            src={proxyImageUrl(posterUrl)}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-2xl">🎬</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Now Playing</p>
        <h2 className="text-lg font-black text-foreground leading-tight line-clamp-2">{title}</h2>
        {meta && <div className="mt-1.5 text-xs text-muted-foreground">{meta}</div>}
      </div>
    </div>
  )
}
