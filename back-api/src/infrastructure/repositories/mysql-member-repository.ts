import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'
import type { Member } from '#domain/entities/member.js'
import type { MemberRepository } from '#domain/interfaces/repositories/member-repository.js'

export class MysqlMemberRepository implements MemberRepository {
  async findByEmail(email: string): Promise<Member | null> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT id, email, name FROM members WHERE email = ?', [email])
    return rows.length ? this.member(rows[0]) : null
  }
  async findById(id: number): Promise<Member | null> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT id, email, name FROM members WHERE id = ?', [id])
    return rows.length ? this.member(rows[0]) : null
  }
  async create(email: string, name: string | null): Promise<Member> {
    const [result] = await pool.execute<mysql.ResultSetHeader>('INSERT INTO members (email, name) VALUES (?, ?)', [email, name])
    return { id: result.insertId, email, name }
  }
  async getOrCreateByEmail(email: string): Promise<number> {
    const existing = await this.findByEmail(email)
    if (existing) return existing.id
    const [result] = await pool.execute<mysql.ResultSetHeader>('INSERT INTO members (email) VALUES (?)', [email])
    return result.insertId
  }
  private member(row: mysql.RowDataPacket): Member { return { id: row.id as number, email: row.email as string, name: (row.name ?? null) as string | null } }
}
