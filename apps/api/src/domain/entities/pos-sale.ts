export type PaymentMethod = 'cash' | 'card' | 'qr'

export type PosSale = {
  id: number
  saleCode: string
  totalAmount: number
  paymentMethod: PaymentMethod
  createdAt: Date | string
}

export type PosSaleItem = { productId: number; quantity: number }
export type CreatedPosSale = { saleCode: string; totalAmount: number }
