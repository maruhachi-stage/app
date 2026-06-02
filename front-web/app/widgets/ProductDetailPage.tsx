import { Link, useNavigate, useParams } from "react-router"
import { useEffect, useMemo, useState } from "react"
import { allProducts } from "~/entities/product/sampleProducts"
import {
  PRODUCT_CATEGORY_LABELS,
  buildConfiguredProductId,
  formatProductPrice,
  getConfiguredPrice,
  type Product,
  type ProductOption,
  type ProductOptionGroup,
  type SelectedProductOption,
} from "~/entities/product/types"
import { useCart } from "~/features/cart/useCart"
import { Button } from "~/shared/ui/Button"

type Props = {
  scope: "shop" | "goods"
}

export function ProductDetailPage({ scope }: Props) {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const product = allProducts.find((item) => item.id === productId)
  const [selected, setSelected] = useState<Record<string, ProductOption>>(() =>
    getInitialSelections(product),
  )
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    setSelected(getInitialSelections(product))
    setQuantity(1)
  }, [productId, product])

  const selections = useMemo(() => {
    if (!product?.optionGroups) return []
    return product.optionGroups.flatMap((group) => {
      const option = selected[group.id]
      if (!option) return []
      return {
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        label: option.label,
        priceDelta: option.priceDelta ?? 0,
      } satisfies SelectedProductOption
    })
  }, [product, selected])

  if (
    !product ||
    (scope === "shop" && product.category === "goods") ||
    (scope === "goods" && product.category !== "goods")
  ) {
    return (
      <div className="container-center py-16">
        <p className="mb-4 text-sm text-muted-foreground">商品が見つかりませんでした。</p>
        <Link to={scope === "shop" ? "/shop" : "/goods"}>
          <Button variant="secondary">一覧へ戻る</Button>
        </Link>
      </div>
    )
  }

  const totalUnitPrice = getConfiguredPrice(product, selections)
  const canAdd = !product.isSoldOut && hasRequiredSelections(product.optionGroups ?? [], selected)

  function handleAddToCart() {
    if (!canAdd || !product) return
    addItem(product, selections, quantity)
    const configuredId = buildConfiguredProductId(product.id, selections)
    navigate(`/cart/added?item=${encodeURIComponent(configuredId)}`)
  }

  return (
    <div className="container-center py-8 pb-20">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-bold text-muted-foreground transition hover:text-foreground"
      >
        ← 一覧へ戻る
      </button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-muted-foreground">
              {PRODUCT_CATEGORY_LABELS[product.category]}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold text-primary">
              {product.movieTitle ?? PRODUCT_CATEGORY_LABELS[product.category]}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{product.name}</h1>
            {product.description && (
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{product.description}</p>
            )}
          </div>

          {product.notes && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs font-bold text-muted-foreground">受け取り・注意事項</p>
              <ul className="space-y-1 text-sm text-foreground">
                {product.notes.map((note) => (
                  <li key={note}>・{note}</li>
                ))}
              </ul>
            </div>
          )}

          {product.optionGroups?.map((group) => (
            <OptionGroup
              key={group.id}
              group={group}
              selected={selected[group.id]?.id}
              onSelect={(option) =>
                setSelected((current) => ({
                  ...current,
                  [group.id]: option,
                }))
              }
            />
          ))}

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold">数量</span>
              <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-background"
                  aria-label="数量を減らす"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(9, value + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-background"
                  aria-label="数量を増やす"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-4 flex items-end justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">小計</span>
              <span className="text-2xl font-black">
                {formatProductPrice(totalUnitPrice * quantity)}
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={!canAdd}
              onClick={handleAddToCart}
            >
              {product.isSoldOut ? "売り切れ" : "カートに追加"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OptionGroup({
  group,
  selected,
  onSelect,
}: {
  group: ProductOptionGroup
  selected?: string
  onSelect: (option: ProductOption) => void
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">{group.name}</h2>
        {group.required && <span className="text-[10px] font-bold text-primary">必須</span>}
      </div>
      <div className="grid gap-2">
        {group.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              selected === option.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background hover:border-primary"
            }`}
          >
            <span className="text-sm font-bold">{option.label}</span>
            <span className="text-xs text-muted-foreground">
              {option.priceDelta ? `+${formatProductPrice(option.priceDelta)}` : "追加料金なし"}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function getInitialSelections(product?: Product): Record<string, ProductOption> {
  if (!product?.optionGroups) return {}
  return Object.fromEntries(
    product.optionGroups
      .filter((group) => group.required)
      .map((group) => [group.id, group.options[0]]),
  )
}

function hasRequiredSelections(
  groups: ProductOptionGroup[],
  selected: Record<string, ProductOption>,
) {
  return groups.every((group) => !group.required || Boolean(selected[group.id]))
}
