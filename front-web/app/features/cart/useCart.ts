import { useState, useMemo } from 'react';

export type CartItem = {
  id: string;
  name: string;
  category: '映画グッズ' | 'フード' | 'ドリンク';
  price: number;
  quantity: number;
  movie?: string;
};

const DUMMY_ITEMS: CartItem[] = [
  { id: '1', name: 'クリアファイルセット', category: '映画グッズ', price: 800, quantity: 2, movie: 'タイトルA' },
  { id: '2', name: 'アクリルスタンド', category: '映画グッズ', price: 1500, quantity: 1, movie: 'タイトルB' },
  { id: '3', name: 'ポップコーン（Lサイズ）', category: 'フード', price: 700, quantity: 1 },
  { id: '4', name: 'コーラ（Mサイズ）', category: 'ドリンク', price: 400, quantity: 2 },
];

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(DUMMY_ITEMS);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    totalCount,
  };
}
