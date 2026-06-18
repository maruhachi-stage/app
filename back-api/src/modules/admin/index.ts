import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import { requireAdminEditKey } from '#middleware/adminEditKey.js'
import { getEditAccess, getOverview, verifyEditKey } from '#modules/admin/handlers.js'

const router = new Hono<AppEnv>()

router.get('/admin/overview', getOverview)
router.post('/admin/edit-key/verify', verifyEditKey)
router.get('/admin/edit-access', requireAdminEditKey, getEditAccess)

export default router
