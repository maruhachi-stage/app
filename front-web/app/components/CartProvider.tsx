// Presentation: カートのContext Provider
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  buildConfiguredProductId,
  getConfiguredPrice,
  type Product,
  type ProductCategory,
  type SelectedProductOption,
} from "~/features/product/domain/product"

const STORAGE_KEY = "hal_cinema_product_cart"

export type CartItem = {
  id: string
  productId: string
  name: string
  category: ProductCategory
  price: number
  quantity: number
  imageUrl?: string
  movieTitle?: string
  options?: SelectedProductOption[]
}

type CartContextValue = {
  items: CartItem[]
  addItem: (product: Product, options?: SelectedProductOption[], quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
  clearCart: () => void
  quantityFor: (id: string) => number
  totalPrice: number
  totalCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  function addItem(product: Product, options: SelectedProductOption[] = [], quantity = 1) {
    if (product.isSoldOut) return
    setItems((current) => {
      const configuredId = buildConfiguredProductId(product.id, options)
      const existing = current.find((item) => item.id === configuredId)
      if (existing) {
        return current.map((item) =>
          item.id === configuredId ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [
        ...current,
        {
          id: configuredId,
          productId: product.id,
          name: product.name,
          category: product.category,
          price: getConfiguredPrice(product, options),
          quantity,
          imageUrl: product.imageUrl,
          movieTitle: product.movieTitle,
          options,
        },
      ]
    })
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function updateQuantity(id: string, delta: number) {
    setItems((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item
          const quantity = item.quantity + delta
          return quantity > 0 ? { ...item, quantity } : null
        })
        .filter((item): item is CartItem => item !== null),
    )
  }

  function clearCart() {
    setItems([])
  }

  function quantityFor(id: string) {
    return items
      .filter((item) => item.productId === id || item.id === id)
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )
  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, quantityFor, totalPrice, totalCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
