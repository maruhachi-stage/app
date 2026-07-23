import type mysql from 'mysql2/promise'
import type { OtpPurpose } from '#application/dto/auth.js'
import { pool } from '#db/client.js'
import type { OtpToken } from '#domain/entities/otp-token.js'
import type { OtpTokenRepository } from '#domain/interfaces/repositories/otp-token-repository.js'

export class MysqlOtpTokenRepository implements OtpTokenRepository {
  async findRecent(memberId: number, purpose: OtpPurpose, sinceSeconds: number): Promise<OtpToken | null> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`SELECT id, member_id, token_hash, purpose, expires_at, used_at, failed_attempts, locked_until, created_at FROM otp_tokens WHERE member_id = ? AND purpose = ? AND created_at > DATE_SUB(NOW(3), INTERVAL ? SECOND) LIMIT 1`, [memberId, purpose, sinceSeconds])
    return rows.length ? this.token(rows[0]) : null
  }
  async create(memberId: number, tokenHash: string, purpose: OtpPurpose, expiresAt: Date): Promise<void> {
    await pool.execute('INSERT INTO otp_tokens (member_id, token_hash, purpose, expires_at) VALUES (?, ?, ?, ?)', [memberId, tokenHash, purpose, expiresAt])
  }
  async findLatest(memberId: number, purpose: OtpPurpose): Promise<OtpToken | null> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`SELECT id, member_id, token_hash, purpose, expires_at, used_at, failed_attempts, locked_until, created_at FROM otp_tokens WHERE member_id = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1`, [memberId, purpose])
    return rows.length ? this.token(rows[0]) : null
  }
  async recordFailure(id: number, failedAttempts: number, lockedUntil?: Date): Promise<void> {
    if (lockedUntil) await pool.execute('UPDATE otp_tokens SET failed_attempts = ?, locked_until = ? WHERE id = ?', [failedAttempts, lockedUntil, id])
    else await pool.execute('UPDATE otp_tokens SET failed_attempts = ? WHERE id = ?', [failedAttempts, id])
  }
  async markUsed(id: number): Promise<void> { await pool.execute('UPDATE otp_tokens SET used_at = NOW(3) WHERE id = ?', [id]) }
  private token(row: mysql.RowDataPacket): OtpToken {
    return { id: row.id as number, memberId: row.member_id as number, tokenHash: row.token_hash as string, purpose: row.purpose as OtpPurpose, expiresAt: row.expires_at as Date | string, usedAt: (row.used_at ?? null) as Date | string | null, failedAttempts: row.failed_attempts as number, lockedUntil: (row.locked_until ?? null) as Date | string | null, createdAt: row.created_at as Date | string }
  }
}
