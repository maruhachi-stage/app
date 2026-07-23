import { Hono } from 'hono'
import type { AuthController } from '#presentation/controllers/auth-controller.js'
import type { AppEnv } from '#types.js'

export function createAuthRouter(controller: AuthController): Hono<AppEnv> {
  const router = new Hono<AppEnv>()
  router.get('/auth/me', controller.getMe)
  router.post('/auth/otp/send', controller.sendOtp)
  router.post('/auth/otp/verify', controller.verifyOtp)
  router.post('/auth/logout', controller.logout)
  return router
}
