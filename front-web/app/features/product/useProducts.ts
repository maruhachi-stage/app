import { useEffect, useState } from "react"
import type { Product, ProductCategory } from "~/features/product/domain/product"
import { apiFetch, ApiError } from "~/lib/api-client"

export function useProducts(category?: ProductCategory) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    const query = params.toString()
    apiFetch<{ items: Product[] }>(`/products${query ? `?${query}` : ""}`)
      .then((data) => setProducts(data.items))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "商品情報の読み込みに失敗しました"),
      )
      .finally(() => setLoading(false))
  }, [category])

  return { products, loading, error }
}

export function useProduct(productId?: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!productId) {
      setProduct(null)
      setLoading(false)
      setError("商品が指定されていません")
      return
    }

    setLoading(true)
    setError("")
    apiFetch<Product>(`/products/${encodeURIComponent(productId)}`)
      .then(setProduct)
      .catch((err) => {
        setProduct(null)
        setError(err instanceof ApiError ? err.message : "商品情報の読み込みに失敗しました")
      })
      .finally(() => setLoading(false))
  }, [productId])

  return { product, loading, error }
}
