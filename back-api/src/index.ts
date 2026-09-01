import { serve } from '@hono/node-server'
import { seedSchedules } from '#infrastructure/database/seedSchedules.js'
import { ensureProductCatalogSchema } from '#infrastructure/database/product-catalog-initializer.js'
import { ensurePosSchema } from '#infrastructure/database/pos-initializer.js'
import { app } from '#app.js'

await seedSchedules()
await ensureProductCatalogSchema()
await ensurePosSchema()

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
