import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Env } from '#types.js'

/** Drizzle client bound to the D1 binding of the current request. */
export type Database = DrizzleD1Database

export function createDatabase(env: Pick<Env, 'DB'>): Database {
  return drizzle(env.DB)
}
