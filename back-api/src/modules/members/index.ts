import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import { getProfile, getReservations } from '#modules/members/handlers.js'

const router = new Hono<AppEnv>()

router.get('/members/profile', getProfile)
router.get('/members/reservations', getReservations)

export default router
