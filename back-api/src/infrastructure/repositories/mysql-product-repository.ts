import type mysql from 'mysql2/promise'
import { mysqlPool } from '#infrastructure/database/mysqlPool.js'
import type { Product, ProductCategory } from '#domain/entities/product.js'
import type { ProductRepository } from '#domain/interfaces/repositories/product-repository.js'

type ProductRow = mysql.RowDataPacket & { id: string; name: string; category: ProductCategory; price: number; description: string | null; image_url: string | null; movie_title: string | null; is_new: number; is_sold_out: number }
type GroupRow = mysql.RowDataPacket & { id: number; product_id: string; group_key: string; name: string; required: number }
type OptionRow = mysql.RowDataPacket & { group_id: number; option_key: string; label: string; price_delta: number }
type NoteRow = mysql.RowDataPacket & { product_id: string; note: string }

export class MysqlProductRepository implements ProductRepository {
  async findAll(category?: ProductCategory): Promise<Product[]> {
    let sql = 'SELECT id, name, category, price, description, image_url, movie_title, is_new, is_sold_out FROM products WHERE 1 = 1'
    const params: string[] = []
    if (category) { sql += ' AND category = ?'; params.push(category) }
    sql += ' ORDER BY display_order ASC'
    const [rows] = await mysqlPool.execute<ProductRow[]>(sql, params)
    return this.hydrate(rows)
  }
  async findById(productId: string): Promise<Product | null> {
    const [rows] = await mysqlPool.execute<ProductRow[]>('SELECT id, name, category, price, description, image_url, movie_title, is_new, is_sold_out FROM products WHERE id = ?', [productId])
    return rows[0] ? (await this.hydrate(rows))[0] : null
  }
  private async hydrate(rows: ProductRow[]): Promise<Product[]> {
    if (!rows.length) return []
    const ids = rows.map((row) => row.id); const marks = ids.map(() => '?').join(',')
    const [groups] = await mysqlPool.execute<GroupRow[]>(`SELECT id, product_id, group_key, name, required FROM product_option_groups WHERE product_id IN (${marks}) ORDER BY display_order ASC`, ids)
    const groupIds = groups.map((group) => group.id)
    const [options] = groupIds.length ? await mysqlPool.execute<OptionRow[]>(`SELECT group_id, option_key, label, price_delta FROM product_options WHERE group_id IN (${groupIds.map(() => '?').join(',')}) ORDER BY display_order ASC`, groupIds) : [[] as OptionRow[]]
    const [notes] = await mysqlPool.execute<NoteRow[]>(`SELECT product_id, note FROM product_notes WHERE product_id IN (${marks}) ORDER BY display_order ASC`, ids)
    const optionsByGroup = new Map<number, Product['optionGroups'][number]['options']>()
    for (const option of options) { const current = optionsByGroup.get(option.group_id) ?? []; current.push({ id: option.option_key, label: option.label, priceDelta: Number(option.price_delta) }); optionsByGroup.set(option.group_id, current) }
    const groupsByProduct = new Map<string, Product['optionGroups']>()
    for (const group of groups) { const current = groupsByProduct.get(group.product_id) ?? []; current.push({ id: group.group_key, name: group.name, required: Boolean(group.required), options: optionsByGroup.get(group.id) ?? [] }); groupsByProduct.set(group.product_id, current) }
    const notesByProduct = new Map<string, string[]>()
    for (const note of notes) { const current = notesByProduct.get(note.product_id) ?? []; current.push(note.note); notesByProduct.set(note.product_id, current) }
    return rows.map((row) => ({ id: row.id, name: row.name, category: row.category, price: Number(row.price), description: row.description, imagePath: row.image_url, movieTitle: row.movie_title, isNew: Boolean(row.is_new), isSoldOut: Boolean(row.is_sold_out), optionGroups: groupsByProduct.get(row.id) ?? [], notes: notesByProduct.get(row.id) ?? [] }))
  }
}
