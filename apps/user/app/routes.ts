import { type RouteConfig, index, route, layout } from '@react-router/dev/routes'

export default [
    layout('components/layouts/MainLayout.tsx', [
        index('routes/home.tsx'),

        route('/screenings', 'routes/screenings/index.tsx'),
        route('/screenings/:movieId', 'routes/screenings/detail.tsx'),

        route('/theater', 'routes/theater/index.tsx'),
        route('/theater/:screenId', 'routes/theater/screen.tsx'),

        route('/member/reservations', 'routes/member/reservations.tsx'),

        route('/contact', 'routes/contact.tsx'),
        route('/shop', 'routes/shop.tsx'),
        route('/shop/:productId', 'routes/shop.$productId.tsx'),
        route('/goods', 'routes/goods.tsx'),
        route('/goods/:productId', 'routes/goods.$productId.tsx'),
        route('/cart', 'routes/cart.tsx'),
        route('/cart/added', 'routes/cart.added.tsx'),
        route('/cart/checkout', 'routes/cart.checkout.tsx'),

        route('/reservations/lookup', 'routes/reservations/lookup.tsx'),
        route('/reservations/r/:reservationCode', 'routes/reservations/detail.tsx'),
    ]),

    layout('components/layouts/AuthLayout.tsx', [
        route('/login', 'routes/auth/login.tsx'),
        route('/register', 'routes/auth/register.tsx'),
        route('/auth/otp', 'routes/auth/otp.tsx'),
    ]),

    layout('components/layouts/ReservationLayout.tsx', [
        route('/reservations/booking/:movieId', 'routes/reservations/booking.tsx'),
        route('/reservations/entry', 'routes/reservations/entry.tsx'),
        route('/reservations/customer', 'routes/reservations/customer.tsx'),
        route('/reservations/tickets', 'routes/reservations/tickets.tsx'),
        route('/reservations/payment', 'routes/reservations/payment.tsx'),
        route('/reservations/confirm', 'routes/reservations/confirm.tsx'),
        route('/reservations/complete', 'routes/reservations/complete.tsx'),
    ]),
] satisfies RouteConfig
