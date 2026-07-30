import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { db, mysqlPool } from '#infrastructure/database/mysqlPool.js'
import { staffAccounts } from '#infrastructure/database/schema.js'
import { STAFF_ROLES, getStaffRole } from '#config/staff-roles.js'
import { hashPassword } from '#lib/staff-auth.js'

const rl = createInterface({ input, output })
try {
  console.log('初期スタッフ管理者を作成します。')
  const userId = (process.env.STAFF_BOOTSTRAP_USER_ID ?? await rl.question('ユーザーID: ')).trim()
  const displayName = (process.env.STAFF_BOOTSTRAP_DISPLAY_NAME ?? await rl.question('表示名: ')).trim()
  const email = (process.env.STAFF_BOOTSTRAP_EMAIL ?? await rl.question('OTP送信先メールアドレス: ')).trim()
  const password = process.env.STAFF_BOOTSTRAP_PASSWORD ?? await rl.question('パスワード（12文字以上）: ')
  const roleId = Number(process.env.STAFF_BOOTSTRAP_ROLE_ID ?? await rl.question(`ロールID (${Object.values(STAFF_ROLES).map((role) => `${role.id}:${role.name}`).join(', ')}): `))
  if (!/^[A-Za-z0-9._-]{3,80}$/.test(userId) || !displayName || !email.includes('@') || password.length < 12 || !getStaffRole(roleId)) throw new Error('入力値が不正です')
  await db.insert(staffAccounts).values({ userId, displayName, email, passwordHash: await hashPassword(password), roleId })
  console.log(`スタッフ ${userId} を作成しました。`)
} finally {
  rl.close()
  await mysqlPool.end()
}
