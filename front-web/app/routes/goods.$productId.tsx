import type { Route } from "./+types/goods.$productId"
import { ProductDetailPage } from "~/components/ProductDetailPage"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "グッズ詳細 | HALシネマ" },
    { name: "description", content: "HALシネマの映画グッズ詳細" },
  ]
}

export default function GoodsProductDetail() {
  return <ProductDetailPage scope="goods" />
}
