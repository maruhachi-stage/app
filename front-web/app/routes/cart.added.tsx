import { Link, useSearchParams } from 'react-router'
import { formatProductPrice, type Product } from '~/features/product/domain/product'
import { useCart } from '~/components/CartProvider'
import { useProducts } from '~/features/product/useProducts'
import { proxyImageUrl } from '~/lib/image'
import { Button } from '~/components/Button'
import { ProductCard } from '~/components/ProductCard'

const PICKUP_LOCATION = '劇場内 ショップ受け取りカウンター'

export function meta() {
    return [{ title: 'カートに追加しました | HALシネマ' }]
}

export default function CartAddedPage() {
    const [searchParams] = useSearchParams()
    const { items, totalCount, totalPrice } = useCart()
    const { products } = useProducts()
    const addedItemId = searchParams.get('item')
    const addedItem = items.find((item) => item.id === addedItemId) ?? items.at(-1)
    const sourceProduct = products.find((product) => product.id === addedItem?.productId)
    const recommendations = getRecommendations(products, sourceProduct?.id, sourceProduct?.category)

    return (
        <div className="container-center py-8 pb-20">
            <section className="mb-8 rounded-lg border border-border bg-card p-5">
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
                    <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                            ✓
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-black tracking-tight">
                                カートに入れました
                            </h1>
                            {addedItem ? (
                                <div className="mt-3 flex gap-3">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                        {addedItem.imageUrl && (
                                            <img
                                                src={proxyImageUrl(addedItem.imageUrl)}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold leading-tight">{addedItem.name}</p>
                                        {addedItem.options && addedItem.options.length > 0 && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {addedItem.options
                                                    .map(
                                                        (option) =>
                                                            `${option.groupName}: ${option.label}`,
                                                    )
                                                    .join(' / ')}
                                            </p>
                                        )}
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            数量 {addedItem.quantity}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    商品をカートに追加しました。
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-sm text-muted-foreground">
                            カートの小計 ({totalCount} 点)
                        </p>
                        <p className="mt-1 text-2xl font-black">{formatProductPrice(totalPrice)}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {PICKUP_LOCATION}で受け取る注文です。
                        </p>
                        <div className="mt-4 grid gap-2">
                            <Link to="/cart/checkout">
                                <Button type="button" className="w-full">
                                    レジに進む
                                </Button>
                            </Link>
                            <Link to="/cart">
                                <Button type="button" variant="secondary" className="w-full">
                                    カートを見る
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Recommended</p>
                    <h2 className="text-2xl font-black tracking-tight">一緒におすすめの商品</h2>
                </div>
                <Link to="/shop" className="text-sm font-bold text-primary hover:underline">
                    ショップ一覧へ
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
                {recommendations.map((product) => (
                    <ProductCard key={product.id} product={product} compact />
                ))}
            </div>
        </div>
    )
}

function getRecommendations(products: Product[], productId?: string, category?: string) {
    const shopProducts = products.filter((product) => product.category !== 'goods')
    const sameCategory = shopProducts.filter(
        (product) =>
            product.id !== productId && product.category === category && !product.isSoldOut,
    )
    const fallback = shopProducts.filter(
        (product) =>
            product.id !== productId && product.category !== category && !product.isSoldOut,
    )
    return [...sameCategory, ...fallback].slice(0, 4)
}
