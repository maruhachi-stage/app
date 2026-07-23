import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import type { ReservationController } from '#presentation/controllers/reservation-controller.js'
export function createReservationRouter(controller: ReservationController): Hono<AppEnv> { const router=new Hono<AppEnv>();router.post('/reservations/quote',controller.quote);router.get('/reservations/schedules/:scheduleId/seats',controller.seats);router.post('/reservations/hold',controller.hold);router.post('/reservations',controller.create);router.get('/reservations/:reservationCode',controller.get);router.post('/reservations/:reservationCode/cancel',controller.cancel);return router }
