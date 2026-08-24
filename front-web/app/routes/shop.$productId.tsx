import type { Route } from "./+types/shop.$productId"
import { ProductDetailPage } from "~/components/ProductDetailPage"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "商品詳細 | HALシネマ" },
    { name: "description", content: "HALシネマのフード・ドリンク商品詳細" },
  ]
}

export default function ShopProductDetail() {
  return <ProductDetailPage scope="shop" />
}
