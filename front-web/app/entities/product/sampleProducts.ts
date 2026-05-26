import type { Product } from "./types"

export const goodsProducts: Product[] = [
  {
    id: "night-stand",
    name: "ナイトシティ アクリルスタンド",
    category: "goods",
    price: 1800,
    description: "作品ビジュアルを飾れる、透明感のある卓上アクリルスタンド。",
    imageUrl: "/images/products/night-stand.webp",
    movieTitle: "ナイトシティ・エコー",
    isNew: true,
    optionGroups: [
      {
        id: "design",
        name: "デザイン",
        required: true,
        options: [
          { id: "hero", label: "主人公" },
          { id: "poster", label: "ポスタービジュアル" },
        ],
      },
    ],
  },
  {
    id: "moon-file-set",
    name: "ムーンライト クリアファイルセット",
    category: "goods",
    price: 600,
    description: "ポスターアートをまとめた劇場限定の2枚組ファイル。",
    imageUrl: "/images/products/moon-file-set.webp",
    movieTitle: "ナイトシティ・エコー",
  },
  {
    id: "black-poster",
    name: "ティザーポスター B3",
    category: "goods",
    price: 900,
    description: "ロビー掲出を意識した、深い色味のB3ポスター。",
    imageUrl: "/images/products/black-poster.webp",
    movieTitle: "深夜上映コレクション",
  },
  {
    id: "premiere-ticket-holder",
    name: "プレミアチケットホルダー",
    category: "goods",
    price: 1200,
    description: "半券と特典カードを一緒に保管できるホルダー。",
    imageUrl: "/images/products/premiere-ticket-holder.webp",
    movieTitle: "HAL Cinema",
  },
  {
    id: "storyboard-book",
    name: "ミニアートブック",
    category: "goods",
    price: 2400,
    description: "キービジュアルとコンセプト案を収録した小冊子。",
    imageUrl: "/images/products/storyboard-book.webp",
    movieTitle: "ナイトシティ・エコー",
    isSoldOut: true,
  },
  {
    id: "screen-pin",
    name: "スクリーンピンズ",
    category: "goods",
    price: 750,
    description: "シネマロゴを型取った小ぶりなメタルピンズ。",
    imageUrl: "/images/products/screen-pin.webp",
    movieTitle: "HAL Cinema",
  },
]

export const shopProducts: Product[] = [
  {
    id: "salt-popcorn",
    name: "シアターポップコーン",
    category: "food",
    price: 700,
    description: "上映前の定番。香ばしい塩バター仕立て。",
    imageUrl: "/images/products/salt-popcorn.webp",
    isNew: true,
    optionGroups: [
      {
        id: "flavor",
        name: "味",
        required: true,
        options: [
          { id: "salt", label: "塩バター" },
          { id: "cheese", label: "チーズ", priceDelta: 80 },
          { id: "mix", label: "塩バター&キャラメル", priceDelta: 120 },
        ],
      },
      {
        id: "size",
        name: "サイズ",
        required: true,
        options: [
          { id: "m", label: "M" },
          { id: "l", label: "L", priceDelta: 180 },
        ],
      },
    ],
    notes: ["レジ受け取り", "アレルギー: 乳成分"],
  },
  {
    id: "caramel-popcorn",
    name: "キャラメルディップ ポップコーン",
    category: "food",
    price: 820,
    description: "別添えソースで食感を残した甘いポップコーン。",
    imageUrl: "/images/products/caramel-popcorn.webp",
    optionGroups: [
      {
        id: "size",
        name: "サイズ",
        required: true,
        options: [
          { id: "m", label: "M" },
          { id: "l", label: "L", priceDelta: 180 },
        ],
      },
      {
        id: "topping",
        name: "トッピング",
        options: [
          { id: "none", label: "なし" },
          { id: "almond", label: "クラッシュアーモンド", priceDelta: 120 },
        ],
      },
    ],
    notes: ["アレルギー: 乳成分・アーモンド"],
  },
  {
    id: "cola-duo",
    name: "クラフトコーラ",
    category: "drink",
    price: 420,
    description: "氷感を残した劇場サイズのコールドドリンク。",
    imageUrl: "/images/products/cola-duo.webp",
    optionGroups: [
      {
        id: "size",
        name: "サイズ",
        required: true,
        options: [
          { id: "m", label: "M" },
          { id: "l", label: "L", priceDelta: 120 },
        ],
      },
      {
        id: "ice",
        name: "氷",
        required: true,
        options: [
          { id: "normal", label: "通常" },
          { id: "less", label: "少なめ" },
          { id: "none", label: "なし" },
        ],
      },
    ],
  },
  {
    id: "berry-soda",
    name: "ベリーソーダ",
    category: "drink",
    price: 460,
    description: "赤い果実の香りが立つ炭酸ドリンク。",
    imageUrl: "/images/products/berry-soda.webp",
    optionGroups: [
      {
        id: "size",
        name: "サイズ",
        required: true,
        options: [
          { id: "m", label: "M" },
          { id: "l", label: "L", priceDelta: 120 },
        ],
      },
    ],
  },
  {
    id: "popcorn-drink-set",
    name: "ポップコーンセット",
    category: "set",
    price: 1080,
    description: "ポップコーンとドリンクをまとめた上映前セット。",
    imageUrl: "/images/products/popcorn-drink-set.webp",
    optionGroups: [
      {
        id: "popcorn",
        name: "ポップコーンの味",
        required: true,
        options: [
          { id: "salt", label: "塩バター" },
          { id: "caramel", label: "キャラメル", priceDelta: 80 },
        ],
      },
      {
        id: "drink",
        name: "ドリンク",
        required: true,
        options: [
          { id: "cola", label: "クラフトコーラ" },
          { id: "berry", label: "ベリーソーダ", priceDelta: 40 },
          { id: "tea", label: "アイスティー" },
        ],
      },
    ],
    notes: ["セットは映画開始15分前までの受け取りがおすすめです"],
  },
  {
    id: "pair-drink-set",
    name: "ペアドリンクセット",
    category: "set",
    price: 780,
    description: "2人で選べるドリンクのペアオーダー。",
    imageUrl: "/images/products/pair-drink-set.webp",
    isSoldOut: true,
  },
]

export const allProducts = [...shopProducts, ...goodsProducts]

export const movieRelatedProducts = goodsProducts.slice(0, 3)
