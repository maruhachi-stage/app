import { mysqlPool } from './mysqlPool.js'
import { ensureProductCatalogSchema } from './product-catalog-initializer.js'
import { ensurePosSchema } from './pos-initializer.js'
import { seedSchedules } from './seedSchedules.js'

try {
  await ensureProductCatalogSchema()
  await ensurePosSchema()
  await seedSchedules()
  console.log('[seed] Database seed completed')
} finally {
  await mysqlPool.end()
}
