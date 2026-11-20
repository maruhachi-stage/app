import type { Route } from './+types/shop.$productId'
import { ProductDetailPage } from '~/components/ProductDetailPage'

export function meta(_: Route.MetaArgs) {
    return [
        { title: '商品詳細 | 丸八ステージ' },
        { name: 'description', content: '丸八ステージのフード・ドリンク商品詳細' },
    ]
}

export default function ShopProductDetail() {
    return <ProductDetailPage scope="shop" />
}
