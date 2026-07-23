import { Hono } from 'hono'
import type { MemberController } from '#presentation/controllers/member-controller.js'
import type { AppEnv } from '#types.js'

export function createMemberRouter(controller: MemberController): Hono<AppEnv> {
  const router = new Hono<AppEnv>()
  router.post('/members', controller.create)
  router.get('/members/profile', controller.getProfile)
  router.get('/members/reservations', controller.getReservations)
  return router
}
