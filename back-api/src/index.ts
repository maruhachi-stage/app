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
import reservationsRouter from '#modules/reservations/index.js'
import { createScreenRouter } from '#presentation/controllers/screen-router.js'
import configRouter from '#modules/config/index.js'
import productsRouter from '#modules/products/index.js'
import posRouter from '#modules/pos/index.js'
import adminRouter from '#modules/admin/index.js'
import { seedSchedules } from '#db/seedSchedules.js'
import { ensureProductCatalogSchema } from '#modules/products/service.js'
import { ensurePosSchema } from '#modules/pos/service.js'
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
app.route('/api', reservationsRouter)
app.route('/api', createScreenRouter(container.screenQueryService))
app.route('/api', configRouter)
app.route('/api', productsRouter)
app.route('/api', posRouter)
app.route('/api', adminRouter)

app.onError(errorHandler)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3000)

await seedSchedules()
await ensureProductCatalogSchema()
await ensurePosSchema()

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
