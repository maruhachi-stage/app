import { eq } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { members } from '#infrastructure/database/schema.js'
import type { Member } from '#domain/entities/member.js'
import type { MemberRepository } from '#domain/interfaces/repositories/member-repository.js'

export class MysqlMemberRepository implements MemberRepository {
  async findByEmail(email: string): Promise<Member | null> {
    const [row] = await db.select({ id: members.id, email: members.email, name: members.name })
      .from(members)
      .where(eq(members.email, email))
      .limit(1)
    return row ? this.member(row) : null
  }
  async findById(id: number): Promise<Member | null> {
    const [row] = await db.select({ id: members.id, email: members.email, name: members.name })
      .from(members)
      .where(eq(members.id, id))
      .limit(1)
    return row ? this.member(row) : null
  }
  async create(email: string, name: string | null): Promise<Member> {
    const [created] = await db.insert(members).values({ email, name }).$returningId()
    return { id: created.id, email, name }
  }
  async getOrCreateByEmail(email: string): Promise<number> {
    const existing = await this.findByEmail(email)
    if (existing) return existing.id
    const [created] = await db.insert(members).values({ email }).$returningId()
    return created.id
  }
  private member(row: { id: number; email: string; name: string | null }): Member { return { id: row.id, email: row.email, name: row.name } }
}
