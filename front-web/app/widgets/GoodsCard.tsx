export type GoodsItem = {
  title: string
  movie: string
  price: string
  isSoldOut?: boolean
  isNew?: boolean
}

type Props = { item: GoodsItem; showNew?: boolean }

export function GoodsCard({ item, showNew = false }: Props) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-muted border border-border transition-all group-hover:border-primary/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground text-6xl">🖼️</span>
        </div>
        {item.isSoldOut && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <span className="text-sm font-black text-white tracking-widest -rotate-12 border-2 border-white px-2 py-1">SOLD OUT</span>
          </div>
        )}
        {item.isNew && showNew && (
          <span className="absolute bottom-2 right-2 z-20 text-[10px] font-black text-white tracking-tighter">NEW</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-bold text-muted-foreground">{item.movie}</div>
        <div className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{item.title}</div>
        <div className="pt-1">
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-[11px] font-black text-foreground">
            ¥{item.price}
          </span>
        </div>
      </div>
    </div>
  )
}
