import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import type { AppEnv } from '#types.js'
import { requestIdMiddleware } from '#presentation/middleware/requestId.js'
import { sessionMiddleware } from '#presentation/middleware/session.js'
import { errorHandler } from '#presentation/middleware/errorHandler.js'
import { auditLogMiddleware } from '#presentation/middleware/auditLog.js'
import { requireAdminEditKey } from '#presentation/middleware/admin-edit-key.js'
import { seedSchedules } from '#infrastructure/database/seedSchedules.js'
import { ensureProductCatalogSchema } from '#infrastructure/database/product-catalog-initializer.js'
import { ensurePosSchema } from '#infrastructure/database/pos-initializer.js'
import { container } from '#di/container.js'

const app = new Hono<AppEnv>()
// Legacy API: keep this prefix stable for the existing frontend.
const api = new Hono<AppEnv>()
// Versioned API is currently reserved for health checks only.
const apiV1 = new Hono<AppEnv>()
const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  '/api/*',
  cors({
    origin: corsOrigins,
    credentials: true,
    allowHeaders: ['Content-Type', 'X-Admin-Edit-Key'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.use('/api/*', csrf({ origin: corsOrigins }))
app.use('/api/*', requestIdMiddleware)
app.use('/api/*', sessionMiddleware)
app.use('/api/*', auditLogMiddleware)

api.use('*', async (c, next) => {
  c.set('container', container)
  await next()
})

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

api.get('/pos/products', (c) => c.get('container').posController.listProducts(c))
api.get('/pos/sales', (c) => c.get('container').posController.listSales(c))
api.post('/pos/sales', (c) => c.get('container').posController.createSale(c))

api.get('/admin/overview', (c) => c.get('container').adminController.getOverview(c))
api.post('/admin/edit-key/verify', (c) => c.get('container').adminController.verifyEditKey(c))
api.get('/admin/edit-access', requireAdminEditKey, (c) =>
  c.get('container').adminController.getEditAccess(c),
)

apiV1.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/api/v1', apiV1)
app.route('/api', api)

app.onError(errorHandler)

const port = Number(process.env.PORT ?? 3000)

await seedSchedules()
await ensureProductCatalogSchema()
await ensurePosSchema()

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
