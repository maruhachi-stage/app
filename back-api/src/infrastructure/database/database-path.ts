import { rmSync } from 'node:fs'
import path from 'node:path'

export function resolveDatabasePath(filePath: string): string {
  if (filePath === ':memory:') return filePath
  return path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(process.cwd(), filePath)
}

export function getConfiguredDatabasePath(): string {
  const isTest = process.env.NODE_ENV === 'test'
  const configuredPath = isTest
    ? (process.env.DB_TEST_FILE ?? process.env.DB_FILE ?? './data/test.db')
    : (process.env.DB_FILE ?? './data/app.db')

  return resolveDatabasePath(configuredPath)
}

export function removeSqliteDatabaseFiles(databasePath: string): void {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    rmSync(databasePath + suffix, { force: true })
  }
}
