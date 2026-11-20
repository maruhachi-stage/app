import type { Route } from './+types/goods.$productId'
import { ProductDetailPage } from '~/components/ProductDetailPage'

export function meta(_: Route.MetaArgs) {
    return [
        { title: 'グッズ詳細 | 丸八ステージ' },
        { name: 'description', content: '丸八ステージの映画グッズ詳細' },
    ]
}

export default function GoodsProductDetail() {
    return <ProductDetailPage scope="goods" />
}
