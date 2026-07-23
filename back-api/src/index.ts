import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import type { AppEnv } from '#types.js'
import { requestIdMiddleware } from '#middleware/requestId.js'
import { sessionMiddleware } from '#middleware/session.js'
import { errorHandler } from '#middleware/errorHandler.js'
import { auditLogMiddleware } from '#middleware/auditLog.js'
import { createMemberRouter } from '#presentation/routers/member-router.js'
import { createAuthRouter } from '#presentation/routers/auth-router.js'
import { createMovieRouter } from '#presentation/routers/movie-router.js'
import { createStageRouter } from '#presentation/controllers/stage-router.js'
import { createReservationRouter } from '#presentation/routers/reservation-router.js'
import { createScreenRouter } from '#presentation/controllers/screen-router.js'
import { createConfigRouter } from '#presentation/routers/config-router.js'
import { createProductRouter } from '#presentation/routers/product-router.js'
import { createPosRouter } from '#presentation/routers/pos-router.js'
import { createAdminRouter } from '#presentation/routers/admin-router.js'
import { seedSchedules } from '#db/seedSchedules.js'
import { initializeProductCatalog } from '#infrastructure/database/product-catalog-initializer.js'
import { initializePosSchema } from '#infrastructure/database/pos-initializer.js'
import { container } from '#di/container.js'

const app = new Hono<AppEnv>()
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

app.route('/api', createMemberRouter(container.memberController))
app.route('/api', createAuthRouter(container.authController))
app.route('/api', createMovieRouter(container.movieService))
app.route('/api', createStageRouter(container.stageQueryService))
app.route('/api', createReservationRouter(container.reservationController))
app.route('/api', createScreenRouter(container.screenQueryService))
app.route('/api', createConfigRouter(container.configService))
app.route('/api', createProductRouter(container.productService))
app.route('/api', createPosRouter(container.posService))
app.route('/api', createAdminRouter(container.adminOverviewService))

app.onError(errorHandler)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3000)

await seedSchedules()
await initializeProductCatalog()
await initializePosSchema()

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
