import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import type { AppEnv, Env } from '#types.js'
import { requestIdMiddleware } from '#presentation/middleware/requestId.js'
import { sessionMiddleware } from '#presentation/middleware/session.js'
import { errorHandler } from '#presentation/middleware/errorHandler.js'
import { auditLogMiddleware } from '#presentation/middleware/auditLog.js'
import { staffSessionMiddleware } from '#presentation/middleware/staff-session.js'
import { requireStaffPermission } from '#presentation/middleware/require-staff-permission.js'
import { getContainer } from '#di/container.js'
import { swaggerUI } from '@hono/swagger-ui'
import { openApiDocument } from '#presentation/openapi/document.js'
import { imagesRoute } from '#presentation/routes/images.js'

const DEFAULT_CORS_ORIGIN = 'http://localhost:3030'

/**
 * Allowed browser origins come from the Worker environment, so they are
 * resolved per request instead of being frozen at module load.
 */
function allowedOrigins(env: Env | undefined): string[] {
  return (env?.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function matchesOrigin(pattern: string, origin: string): boolean {
  if (pattern === '*') return true
  if (!pattern.includes('*')) return pattern === origin

  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^.]+')
  return new RegExp(`^${escaped}$`).test(origin)
}

function isAllowedOrigin(env: Env | undefined, origin: string): boolean {
  return allowedOrigins(env).some((pattern) => matchesOrigin(pattern, origin))
}

export function createApp() {
  const app = new Hono<AppEnv>()
  // Legacy API: keep this prefix stable for the existing frontend.
  const api = new Hono<AppEnv>()
  // Versioned API hosts the staff endpoints. The customer API stays on /api for now.
  const apiV1 = new Hono<AppEnv>()

  app.use('/api/*', async (c, next) => {
    c.set('container', getContainer(c.env))
    await next()
  })

  app.use(
    '/api/*',
    cors({
      origin: (origin, c) => {
        if (isAllowedOrigin(c.env, origin)) return origin
        return null
      },
      credentials: true,
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )

  app.use(
    '/api/*',
    csrf({
      origin: (origin, c) => isAllowedOrigin(c.env, origin),
    }),
  )
  app.use('/api/*', requestIdMiddleware)
  app.use('/api/*', sessionMiddleware)
  app.use('/api/*', auditLogMiddleware)

  api.post('/members', (c) => c.get('container').memberController.create(c))
  api.get('/members/profile', (c) => c.get('container').memberController.getProfile(c))
  api.get('/members/reservations', (c) => c.get('container').memberController.getReservations(c))

  api.get('/auth/me', (c) => c.get('container').authController.getMe(c))
  api.post('/auth/otp/send', (c) => c.get('container').authController.sendOtp(c))
  api.post('/auth/otp/verify', (c) => c.get('container').authController.verifyOtp(c))
  api.post('/auth/logout', (c) => c.get('container').authController.logout(c))

  api.get('/movies', (c) => c.get('container').movieController.listMovies(c))
  api.get('/movies/:movieId', (c) => c.get('container').movieController.getMovie(c))
  api.get('/movies/:movieId/schedules', (c) =>
    c.get('container').movieController.getMovieSchedules(c),
  )
  api.get('/schedules/:scheduleId', (c) => c.get('container').movieController.getSchedule(c))

  api.get('/stages', (c) => c.get('container').stageController.list(c))
  api.get('/stages/:stageId', (c) => c.get('container').stageController.get(c))
  api.get('/stages/:stageId/schedules', (c) => c.get('container').stageController.getSchedules(c))

  api.post('/reservations/quote', (c) => c.get('container').reservationController.quote(c))
  api.get('/reservations/schedules/:scheduleId/seats', (c) =>
    c.get('container').reservationController.seats(c),
  )
  api.post('/reservations/hold', (c) => c.get('container').reservationController.hold(c))
  api.post('/reservations', (c) => c.get('container').reservationController.create(c))
  api.get('/reservations/:reservationCode', (c) => c.get('container').reservationController.get(c))
  api.post('/reservations/:reservationCode/cancel', (c) =>
    c.get('container').reservationController.cancel(c),
  )

  api.get('/screens', (c) => c.get('container').screenController.list(c))
  api.get('/screens/:screenId', (c) => c.get('container').screenController.get(c))

  api.get('/config', (c) => c.get('container').configController.getConfig(c))

  api.get('/products', (c) => c.get('container').productController.listProducts(c))
  api.get('/products/:productId', (c) => c.get('container').productController.getProduct(c))

  apiV1.get('/health', (c) => c.json({ status: 'ok' }))

  apiV1.use('/staff/*', staffSessionMiddleware)
  apiV1.post('/staff/auth/login', (c) => c.get('container').staffAuthController.login(c))
  apiV1.post('/staff/auth/otp/verify', (c) => c.get('container').staffAuthController.verifyOtp(c))
  apiV1.post('/staff/auth/otp/resend', (c) => c.get('container').staffAuthController.resendOtp(c))
  apiV1.get('/staff/auth/me', (c) => c.get('container').staffAuthController.me(c))
  apiV1.post('/staff/auth/logout', (c) => c.get('container').staffAuthController.logout(c))
  apiV1.post('/staff/auth/password', (c) =>
    c.get('container').staffAuthController.changePassword(c),
  )
  apiV1.get('/staff/overview', requireStaffPermission('staff.overview.read'), (c) =>
    c.get('container').staffOverviewController.getOverview(c),
  )
  apiV1.get('/staff/accounts', requireStaffPermission('staff.accounts.manage'), (c) =>
    c.get('container').staffAuthController.listAccounts(c),
  )
  apiV1.post('/staff/accounts', requireStaffPermission('staff.accounts.manage'), (c) =>
    c.get('container').staffAuthController.createAccount(c),
  )
  apiV1.patch('/staff/accounts/:staffId', requireStaffPermission('staff.accounts.manage'), (c) =>
    c.get('container').staffAuthController.updateAccount(c),
  )
  apiV1.post(
    '/staff/accounts/:staffId/otp/reset',
    requireStaffPermission('staff.accounts.manage'),
    (c) => c.get('container').staffAuthController.resetOtp(c),
  )
  apiV1.get('/staff/pos/products', requireStaffPermission('staff.content.write'), (c) =>
    c.get('container').posController.listProducts(c),
  )
  apiV1.get('/staff/pos/sales', requireStaffPermission('staff.content.write'), (c) =>
    c.get('container').posController.listSales(c),
  )
  apiV1.post('/staff/pos/sales', requireStaffPermission('staff.content.write'), (c) =>
    c.get('container').posController.createSale(c),
  )

  app.use('/images/*', async (c, next) => {
    c.set('container', getContainer(c.env))
    await next()
  })
  app.route('/images', imagesRoute)

  app.get('/api/openapi.json', (c) => c.json(openApiDocument))
  app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

  app.route('/api/v1', apiV1)
  app.route('/api', api)

  app.onError(errorHandler)

  return app
}
