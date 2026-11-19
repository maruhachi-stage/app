import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { getStaffRole, STAFF_ROLES } from '#domain/entities/staff-account.js'
import { ScryptPasswordHasher } from '#infrastructure/adapters/scrypt-password-hasher.js'

/**
 * Prints the SQL that creates the first administrator account. D1 has no way to
 * run Drizzle queries from Node, so the statement is executed with
 * `wrangler d1 execute <database> --remote --command "<SQL>"`.
 *
 * Input can be provided through STAFF_BOOTSTRAP_* environment variables so the
 * script also works in CI.
 */
function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

const rl = createInterface({ input, output })

try {
  console.log('初期スタッフ管理者の登録SQLを生成します。')
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

  const passwordHash = await new ScryptPasswordHasher().hash(password)
  const sql = [
    'INSERT INTO staff_accounts (user_id, display_name, email, password_hash, role_id, status)',
    `VALUES (${sqlString(userId)}, ${sqlString(displayName)}, ${sqlString(email)}, ${sqlString(passwordHash)}, ${roleId}, 'active')`,
    'ON CONFLICT(user_id) DO NOTHING;',
  ].join(' ')

  console.log('\n--- SQL ---')
  console.log(sql)
  console.log('--- SQL ---')
  console.log(
    `\n適用例: npx wrangler d1 execute maruhachi-stage-db --remote --command "${sql.replaceAll('"', '\\"')}"`,
  )
} finally {
  rl.close()
}
