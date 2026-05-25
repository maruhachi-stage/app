import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("shared/ui/layouts/MainLayout.tsx", [
    index("routes/home.tsx"),

    // 映画情報
    route("/movies", "routes/movies/index.tsx"),
    route("/movies/:movieId", "routes/movies/detail.tsx"),

    // 劇場情報
    route("/theater", "routes/theater/index.tsx"),
    route("/theater/:screenId", "routes/theater/screen.tsx"),

    // 会員マイページ
    route("/member/reservations", "routes/member/reservations.tsx"),

    // その他
    route("/contact", "routes/contact.tsx"),
    route("/shop", "routes/shop.tsx"),
    route("/goods", "routes/goods.tsx"),
    route("/cart", "routes/cart.tsx"),

    // 予約詳細
    route("/reservations/lookup", "routes/reservations/lookup.tsx"),
    route("/reservations/r/:reservationCode", "routes/reservations/detail.tsx"),
  ]),

  // 認証 (動的にレイアウトを切り替える)
  layout("shared/ui/layouts/AuthLayout.tsx", [
    route("/login", "routes/auth/login.tsx"),
    route("/register", "routes/auth/register.tsx"),
    route("/auth/otp", "routes/auth/otp.tsx"),
  ]),

  // 予約フロー
  layout("shared/ui/layouts/ReservationLayout.tsx", [
    route("/reservations/booking/:movieId", "routes/reservations/booking.tsx"),
    route("/reservations/entry", "routes/reservations/entry.tsx"),
    route("/reservations/customer", "routes/reservations/customer.tsx"),
    route("/reservations/tickets", "routes/reservations/tickets.tsx"),
    route("/reservations/payment", "routes/reservations/payment.tsx"),
    route("/reservations/confirm", "routes/reservations/confirm.tsx"),
    route("/reservations/complete", "routes/reservations/complete.tsx"),
  ]),
] satisfies RouteConfig;
