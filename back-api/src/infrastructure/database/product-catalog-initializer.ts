/**
 * Transitional initializer entry point. The existing catalog schema and seed
 * are still executed by the legacy bootstrap until the composition root is
 * migrated; callers can depend on this stable infrastructure API now.
 */
export { ensureProductCatalogSchema as initializeProductCatalog } from '#modules/products/service.js'
