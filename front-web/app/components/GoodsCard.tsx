export type GoodsItem = {
    title: string
    movie: string
    price: string
    isNew?: boolean
    isSoldOut?: boolean
}

type Props = {
    item: GoodsItem
    showNew?: boolean
}

export function GoodsCard({ item, showNew = false }: Props) {
    return (
        <article className="group relative overflow-hidden rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-bold leading-tight text-foreground">
                    {item.title}
                </p>
                {showNew && (
                    <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-black text-primary-foreground">
                        NEW
                    </span>
                )}
            </div>
            {item.movie && <p className="text-xs text-muted-foreground">{item.movie}</p>}
            <div className="mt-3 flex items-center justify-between">
                <span className="rounded bg-secondary px-2 py-0.5 text-xs font-black text-secondary-foreground">
                    {`¥${item.price}`}
                </span>
                {item.isSoldOut && (
                    <span className="text-[10px] font-bold text-destructive">SOLD OUT</span>
                )}
            </div>
        </article>
    )
}
