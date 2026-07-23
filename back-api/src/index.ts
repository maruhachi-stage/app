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
// Keep the externally deployed `/api` prefix stable. A future version is replaced
// by swapping this app, without changing the frontend's API base URL.
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

apiV1.use('*', async (c, next) => {
  c.set('container', container)
  await next()
})

apiV1.post('/members', (c) => c.get('container').memberController.create(c))
apiV1.get('/members/profile', (c) => c.get('container').memberController.getProfile(c))
apiV1.get('/members/reservations', (c) => c.get('container').memberController.getReservations(c))

apiV1.get('/auth/me', (c) => c.get('container').authController.getMe(c))
apiV1.post('/auth/otp/send', (c) => c.get('container').authController.sendOtp(c))
apiV1.post('/auth/otp/verify', (c) => c.get('container').authController.verifyOtp(c))
apiV1.post('/auth/logout', (c) => c.get('container').authController.logout(c))

apiV1.get('/movies', (c) => c.get('container').movieController.listMovies(c))
apiV1.get('/movies/:movieId', (c) => c.get('container').movieController.getMovie(c))
apiV1.get('/movies/:movieId/schedules', (c) => c.get('container').movieController.getMovieSchedules(c))
apiV1.get('/schedules/:scheduleId', (c) => c.get('container').movieController.getSchedule(c))

apiV1.get('/stages', (c) => c.get('container').stageController.list(c))
apiV1.get('/stages/:stageId', (c) => c.get('container').stageController.get(c))
apiV1.get('/stages/:stageId/schedules', (c) => c.get('container').stageController.getSchedules(c))

apiV1.post('/reservations/quote', (c) => c.get('container').reservationController.quote(c))
apiV1.get('/reservations/schedules/:scheduleId/seats', (c) => c.get('container').reservationController.seats(c))
apiV1.post('/reservations/hold', (c) => c.get('container').reservationController.hold(c))
apiV1.post('/reservations', (c) => c.get('container').reservationController.create(c))
apiV1.get('/reservations/:reservationCode', (c) => c.get('container').reservationController.get(c))
apiV1.post('/reservations/:reservationCode/cancel', (c) => c.get('container').reservationController.cancel(c))

apiV1.get('/screens', (c) => c.get('container').screenController.list(c))
apiV1.get('/screens/:screenId', (c) => c.get('container').screenController.get(c))

apiV1.get('/config', (c) => c.get('container').configController.getConfig(c))

apiV1.get('/products', (c) => c.get('container').productController.listProducts(c))
apiV1.get('/products/:productId', (c) => c.get('container').productController.getProduct(c))

apiV1.get('/pos/products', (c) => c.get('container').posController.listProducts(c))
apiV1.get('/pos/sales', (c) => c.get('container').posController.listSales(c))
apiV1.post('/pos/sales', (c) => c.get('container').posController.createSale(c))

apiV1.get('/admin/overview', (c) => c.get('container').adminController.getOverview(c))
apiV1.post('/admin/edit-key/verify', (c) => c.get('container').adminController.verifyEditKey(c))
apiV1.get('/admin/edit-access', requireAdminEditKey, (c) => c.get('container').adminController.getEditAccess(c))

app.route('/api', apiV1)

app.onError(errorHandler)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3000)

await seedSchedules()
await ensureProductCatalogSchema()
await ensurePosSchema()

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
