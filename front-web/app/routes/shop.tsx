import { useState } from 'react'
import type { Route } from './+types/shop'
import { PRODUCT_CATEGORY_LABELS, type ProductCategory } from '~/features/product/domain/product'
import { useProducts } from '~/features/product/useProducts'
import { proxyImageUrl } from '~/lib/image'
import { ProductCard } from '~/components/ProductCard'

type MenuFilter = ProductCategory | 'all'

const FILTERS: MenuFilter[] = ['all', 'food', 'drink', 'set']

export function meta(_: Route.MetaArgs) {
    return [
        { title: 'フード＆ドリンク | HALシネマ' },
        { name: 'description', content: 'シアター内で楽しめるフード＆ドリンクメニュー' },
    ]
}

export default function Shop() {
    const [filter, setFilter] = useState<MenuFilter>('all')
    const { products, loading, error } = useProducts()
    const shopProducts = products.filter((product) => product.category !== 'goods')
    const visibleProducts = shopProducts.filter(
        (product) => filter === 'all' || product.category === filter,
    )

    return (
        <div className="pb-16">
            <div className="relative mb-12 pt-8">
                <div className="flex items-center justify-center gap-4 overflow-hidden px-4">
                    <div className="flex gap-4 overflow-hidden">
                        {shopProducts.slice(0, 3).map((product, index) => (
                            <div
                                key={product.id}
                                className={`relative h-40 w-80 shrink-0 overflow-hidden rounded-lg border border-border bg-muted ${
                                    index === 1 ? '' : 'scale-90 opacity-60'
                                }`}
                            >
                                <img
                                    src={proxyImageUrl(product.imageUrl)}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                    <p className="text-[10px] font-bold text-white/70">
                                        Concession
                                    </p>
                                    <p className="text-sm font-black text-white">{product.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container-center">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setFilter(category)}
                                className={`rounded border px-4 py-1.5 text-xs font-bold transition ${
                                    filter === category
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border text-muted-foreground hover:bg-background'
                                }`}
                            >
                                {category === 'all' ? 'すべて' : PRODUCT_CATEGORY_LABELS[category]}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        商品カードから注文候補をカートにまとめられます。
                    </p>
                </div>

                {loading && (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                        商品を読み込み中です
                    </p>
                )}
                {error && (
                    <p className="py-12 text-center text-sm font-bold text-primary">{error}</p>
                )}
                {!loading && !error && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
                        {visibleProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
