import { asc, eq, inArray } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import {
  productNotes,
  productOptionGroups,
  productOptions,
  products,
} from '#infrastructure/database/schema.js'
import type { Product, ProductCategory } from '#domain/entities/product.js'
import type { ProductRepository } from '#domain/interfaces/repositories/product-repository.js'

export class DrizzleProductRepository implements ProductRepository {
  async findAll(category?: ProductCategory): Promise<Product[]> {
    const rows = await db
      .select()
      .from(products)
      .where(category ? eq(products.category, category) : undefined)
      .orderBy(asc(products.displayOrder))
    return this.hydrate(rows)
  }

  async findById(productId: string): Promise<Product | null> {
    const rows = await db.select().from(products).where(eq(products.id, productId))
    return rows[0] ? (await this.hydrate(rows))[0] : null
  }

  private async hydrate(rows: (typeof products.$inferSelect)[]): Promise<Product[]> {
    if (!rows.length) return []

    const ids = rows.map((row) => row.id)
    const groups = await db
      .select()
      .from(productOptionGroups)
      .where(inArray(productOptionGroups.productId, ids))
      .orderBy(asc(productOptionGroups.displayOrder))
    const groupIds = groups.map((group) => group.id)
    const options = groupIds.length
      ? await db
          .select()
          .from(productOptions)
          .where(inArray(productOptions.groupId, groupIds))
          .orderBy(asc(productOptions.displayOrder))
      : []
    const notes = await db
      .select()
      .from(productNotes)
      .where(inArray(productNotes.productId, ids))
      .orderBy(asc(productNotes.displayOrder))

    const optionsByGroup = new Map<number, Product['optionGroups'][number]['options']>()
    for (const option of options) {
      const current = optionsByGroup.get(option.groupId) ?? []
      current.push({ id: option.optionKey, label: option.label, priceDelta: option.priceDelta })
      optionsByGroup.set(option.groupId, current)
    }
    const groupsByProduct = new Map<string, Product['optionGroups']>()
    for (const group of groups) {
      const current = groupsByProduct.get(group.productId) ?? []
      current.push({
        id: group.groupKey,
        name: group.name,
        required: group.required,
        options: optionsByGroup.get(group.id) ?? [],
      })
      groupsByProduct.set(group.productId, current)
    }
    const notesByProduct = new Map<string, string[]>()
    for (const note of notes) {
      const current = notesByProduct.get(note.productId) ?? []
      current.push(note.note)
      notesByProduct.set(note.productId, current)
    }
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      description: row.description,
      imagePath: row.imageUrl,
      movieTitle: row.movieTitle,
      isNew: row.isNew,
      isSoldOut: row.isSoldOut,
      optionGroups: groupsByProduct.get(row.id) ?? [],
      notes: notesByProduct.get(row.id) ?? [],
    }))
  }
}
