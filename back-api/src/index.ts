import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import type { AppEnv } from '#types.js'
import { requestIdMiddleware } from '#middleware/requestId.js'
import { sessionMiddleware } from '#middleware/session.js'
import { errorHandler } from '#middleware/errorHandler.js'
import { auditLogMiddleware } from '#middleware/auditLog.js'
import membersRouter from '#modules/members/index.js'
import authRouter from '#modules/auth/index.js'
import moviesRouter from '#modules/movies/index.js'
import reservationsRouter from '#modules/reservations/index.js'
import screensRouter from '#modules/screens/index.js'
import configRouter from '#modules/config/index.js'

const app = new Hono<AppEnv>()

app.use(
  '/api/*',
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
)

app.use('/api/*', csrf())
app.use('/api/*', requestIdMiddleware)
app.use('/api/*', sessionMiddleware)
app.use('/api/*', auditLogMiddleware)

app.route('/api', membersRouter)
app.route('/api', authRouter)
app.route('/api', moviesRouter)
app.route('/api', reservationsRouter)
app.route('/api', screensRouter)
app.route('/api', configRouter)

app.onError(errorHandler)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
