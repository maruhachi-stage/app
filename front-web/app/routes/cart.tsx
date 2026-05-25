import { useNavigate, Link } from 'react-router';
import { useCart } from '~/features/cart/useCart';
import { Button } from '~/shared/ui/Button';

export function meta() {
  return [{ title: 'カート | HALシネマ' }];
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalCount } = useCart();

  const categories = ['映画グッズ', 'フード', 'ドリンク'] as const;

  if (items.length === 0) {
    return (
      <div className="container-center py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">カートに商品がありません</h1>
        <Link to="/goods">
          <Button variant="primary">商品一覧へ戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-center pb-32 pt-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter">CART</h1>
        <Button variant="ghost" onClick={clearCart} className="text-muted-foreground">
          すべて削除
        </Button>
      </div>

      <div className="space-y-12">
        {categories.map((category) => {
          const categoryItems = items.filter((item) => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">{category}</h2>
              <div className="space-y-4">
                {categoryItems.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold">{item.name}</h3>
                      {item.movie && <p className="text-xs text-muted-foreground mt-1">作品: {item.movie}</p>}
                      <p className="text-sm font-bold mt-1 text-primary">¥{item.price.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background disabled:opacity-30 transition-colors"
                      >
                        －
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                      >
                        ＋
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40">
        <div className="container-center flex items-center justify-between gap-4 max-w-3xl">
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">合計 {totalCount}点</p>
            <p className="text-xl font-black">¥{totalPrice.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">(税込)</span></p>
          </div>
          <div className="flex-1 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/goods')}>
              続けて買い物する
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => window.alert('購入機能は現在準備中です')}>
              購入へ進む
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
