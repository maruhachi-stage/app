import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { eq } from 'drizzle-orm'
import { db, closeDatabase } from '#infrastructure/database/sqlite.js'
import { staffAccounts } from '#infrastructure/database/schema.js'
import { getStaffRole, STAFF_ROLES } from '#domain/entities/staff-account.js'
import { ScryptPasswordHasher } from '#infrastructure/adapters/scrypt-password-hasher.js'

/**
 * Creates the first administrator account. Input can be provided through
 * STAFF_BOOTSTRAP_* environment variables so the script also works in CI.
 */
const rl = createInterface({ input, output })

try {
  console.log('初期スタッフ管理者を作成します。')
  const userId = (process.env.STAFF_BOOTSTRAP_USER_ID ?? (await rl.question('ユーザーID: '))).trim()
  const displayName = (
    process.env.STAFF_BOOTSTRAP_DISPLAY_NAME ?? (await rl.question('表示名: '))
  ).trim()
  const email = (
    process.env.STAFF_BOOTSTRAP_EMAIL ?? (await rl.question('OTP送信先メールアドレス: '))
  ).trim()
  const password =
    process.env.STAFF_BOOTSTRAP_PASSWORD ?? (await rl.question('パスワード（12文字以上）: '))
  const roleId = Number(
    process.env.STAFF_BOOTSTRAP_ROLE_ID ??
      (await rl.question(
        `ロールID (${Object.values(STAFF_ROLES)
          .map((role) => `${role.id}:${role.name}`)
          .join(', ')}): `,
      )),
  )

  if (
    !/^[A-Za-z0-9._-]{3,80}$/.test(userId) ||
    !displayName ||
    !email.includes('@') ||
    password.length < 12 ||
    !getStaffRole(roleId)
  ) {
    throw new Error('入力値が不正です')
  }

  const existing = await db
    .select({ id: staffAccounts.id })
    .from(staffAccounts)
    .where(eq(staffAccounts.userId, userId))
    .limit(1)
    .get()
  if (existing) throw new Error(`スタッフ ${userId} は既に存在します`)

  await db.insert(staffAccounts).values({
    userId,
    displayName,
    email,
    passwordHash: await new ScryptPasswordHasher().hash(password),
    roleId,
  })
  console.log(`スタッフ ${userId} を作成しました。`)
} finally {
  rl.close()
  closeDatabase()
}
