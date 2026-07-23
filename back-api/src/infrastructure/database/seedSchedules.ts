/**
 * seedSchedules.ts
 * サーバー起動時に今日から7日分のスケジュールがなければ自動生成する
 *
 * 使い方: src/index.ts で import して呼び出す
 *   import { seedSchedules } from '#infrastructure/database/seedSchedules.js'
 *   await seedSchedules()
 *
 * 生成ルール:
 *   映画: 各スクリーン × 各日 に 5〜7 枠をランダム配置 (9:00〜22:00)
 *   舞台: 大スクリーン × 各日 に夕方〜夜 1〜2 公演 (17:00〜22:00)
 *   イベント: 中スクリーン × 週末 に夜 1 公演 (18:00〜22:00)
 */

import type mysql from 'mysql2/promise'
import { mysqlPool as pool } from '#infrastructure/database/mysqlPool.js'

// ─── 定数 ──────────────────────────────────────────────────────────────────

const DAYS_AHEAD   = 7   // 今日から何日分生成するか
const HOUR_START   = 9   // 映画の最早開始時刻 (JST)
const HOUR_END     = 22  // 上映終了の最遅時刻 (JST) — これ以降は開始しない
const INTERVAL_MIN = 15  // 上映間の最低インターバル（分）

// ─── 簡易シード付き乱数生成 ─────────────────────────────────────────────────

function makeRand(seed: number) {
  let s = seed & 0x7fffffff
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// ─── ヘルパー: JST分→UTC日時文字列 ─────────────────────────────────────────

/**
 * 対象日（UTC 00:00 を基準）に JST 分オフセットを加算して
 * 'YYYY-MM-DD HH:MM:SS' 形式の UTC 文字列を返す
 */
function jstMinToUtcStr(baseDate: Date, jstMin: number): string {
  const JST_OFFSET = 9 * 60
  const utcMin = jstMin - JST_OFFSET
  const d = new Date(baseDate)
  if (utcMin < 0) d.setDate(d.getDate() - 1)
  const dateStr = d.toISOString().slice(0, 10)
  const h = ((Math.floor((utcMin % 1440 + 1440) / 60)) % 24)
  const m = ((utcMin % 60) + 60) % 60
  return `${dateStr} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

// ─── 既存チェック ──────────────────────────────────────────────────────────

async function hasSchedule(screenId: number, jstDateStr: string): Promise<boolean> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM schedules
     WHERE screen_id = ?
       AND is_public = 1
       AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?`,
    [screenId, jstDateStr],
  )
  return (rows[0].cnt as number) > 0
}

// ─── 映画スケジュール生成 ────────────────────────────────────────────────────

async function seedMovieSchedules(
  movies: { id: number; duration_min: number }[],
  screens: { id: number; size: string }[],
  targetDate: Date,
  jstDateStr: string,
  dayOffset: number,
): Promise<number> {
  let inserted = 0

  for (const screen of screens) {
    if (await hasSchedule(screen.id, jstDateStr)) continue

    const rand = makeRand(screen.id * 10007 + dayOffset * 997 + targetDate.getMonth() * 31 + targetDate.getDate())

    // 映画リストをシャッフル
    const shuffled = [...movies].sort(() => rand() - 0.5)

    // 9:00〜10:00 の間でランダム開始（15分刻み）
    let curMin = HOUR_START * 60 + Math.floor(rand() * 5) * 15
    let prevMovieId = -1

    for (let loop = 0; loop < 10; loop++) {
      if (curMin >= HOUR_END * 60) break

      const candidates = shuffled.length > 1
        ? shuffled.filter(m => m.id !== prevMovieId)
        : shuffled
      const movie = candidates[Math.floor(rand() * candidates.length)]

      const endMin = curMin + movie.duration_min
      if (endMin > HOUR_END * 60) break

      await pool.execute(
        `INSERT INTO schedules (screening_id, screen_id, starts_at, ends_at, is_public)
         VALUES (?, ?, ?, ?, 1)`,
        [
          movie.id,
          screen.id,
          jstMinToUtcStr(targetDate, curMin),
          jstMinToUtcStr(targetDate, endMin),
        ],
      )
      inserted++
      prevMovieId = movie.id

      // インターバル + ランダムな追加待機 (0 / 15 / 30 分)
      curMin = endMin + INTERVAL_MIN + Math.floor(rand() * 3) * 15
    }
  }

  return inserted
}

// ─── 舞台スケジュール生成 ────────────────────────────────────────────────────
// 大スクリーン (size='large') に 夕方〜夜 1〜2 公演

async function seedStageSchedules(
  stages: { id: number; duration_min: number }[],
  screens: { id: number; size: string }[],
  targetDate: Date,
  jstDateStr: string,
  dayOffset: number,
): Promise<number> {
  if (stages.length === 0) return 0

  const largeScreens = screens.filter(s => s.size === 'large')
  if (largeScreens.length === 0) return 0

  let inserted = 0

  // 舞台はスクリーン1番のみ使用（最大スクリーン）
  const screen = largeScreens[0]

  const rand = makeRand(screen.id * 3001 + dayOffset * 7919 + 42)

  // 17:00〜18:00 の間でランダムに開始
  const START_MIN = 17 * 60
  const startMin = START_MIN + Math.floor(rand() * 5) * 15

  const stage = stages[Math.floor(rand() * stages.length)]
  const endMin = startMin + stage.duration_min

  if (endMin <= HOUR_END * 60) {
    // この時間帯にスケジュールが既にあるか確認（映画と別チェック）
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM schedules
       WHERE screen_id = ?
         AND is_public = 1
         AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?
         AND screening_id IN (SELECT id FROM screenings WHERE type = 'stage')`,
      [screen.id, jstDateStr],
    )
    if ((rows[0].cnt as number) === 0) {
      await pool.execute(
        `INSERT INTO schedules (screening_id, screen_id, starts_at, ends_at, is_public)
         VALUES (?, ?, ?, ?, 1)`,
        [
          stage.id,
          screen.id,
          jstMinToUtcStr(targetDate, startMin),
          jstMinToUtcStr(targetDate, endMin),
        ],
      )
      inserted++
    }
  }

  return inserted
}

// ─── イベントスケジュール生成 ─────────────────────────────────────────────────
// 週末 (土・日) のみ、中スクリーンに夜 1 公演

async function seedEventSchedules(
  events: { id: number; duration_min: number }[],
  screens: { id: number; size: string }[],
  targetDate: Date,
  jstDateStr: string,
  dayOffset: number,
): Promise<number> {
  if (events.length === 0) return 0

  // JSTで曜日を判定 (0=日, 6=土)
  const jstDate = new Date(targetDate.getTime() + 9 * 60 * 60 * 1000)
  const dow = jstDate.getUTCDay()
  const isWeekend = dow === 0 || dow === 6
  if (!isWeekend) return 0

  const mediumScreens = screens.filter(s => s.size === 'medium')
  if (mediumScreens.length === 0) return 0

  const screen = mediumScreens[0]
  const rand = makeRand(screen.id * 5003 + dayOffset * 6271 + 99)

  // 18:00〜19:00 の間でランダムに開始
  const startMin = 18 * 60 + Math.floor(rand() * 5) * 15
  const event = events[Math.floor(rand() * events.length)]
  const endMin = startMin + event.duration_min

  if (endMin > HOUR_END * 60) return 0

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM schedules
     WHERE screen_id = ?
       AND is_public = 1
       AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?
       AND screening_id IN (SELECT id FROM screenings WHERE type = 'event')`,
    [screen.id, jstDateStr],
  )
  if ((rows[0].cnt as number) > 0) return 0

  await pool.execute(
    `INSERT INTO schedules (screening_id, screen_id, starts_at, ends_at, is_public)
     VALUES (?, ?, ?, ?, 1)`,
    [
      event.id,
      screen.id,
      jstMinToUtcStr(targetDate, startMin),
      jstMinToUtcStr(targetDate, endMin),
    ],
  )
  return 1
}

// ─── メイン処理 ─────────────────────────────────────────────────────────────

export async function seedSchedules(): Promise<void> {
  try {
    // now_showing の上映アイテムを種別ごとに取得
    const [allRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, type, duration_min FROM screenings WHERE status = 'now_showing' ORDER BY id`,
    )
    if (allRows.length === 0) {
      console.log('[seedSchedules] now_showingの上映アイテムがないためスキップ')
      return
    }

    const movies = allRows.filter(r => r.type === 'movie') as { id: number; type: string; duration_min: number }[]
    const stages = allRows.filter(r => r.type === 'stage') as { id: number; type: string; duration_min: number }[]
    const events = allRows.filter(r => r.type === 'event') as { id: number; type: string; duration_min: number }[]

    // スクリーンを取得
    const [screenRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, size FROM screens ORDER BY id`,
    )
    if (screenRows.length === 0) {
      console.log('[seedSchedules] スクリーンが登録されていないためスキップ')
      return
    }

    const screens = screenRows as { id: number; size: string }[]
    // 映画用スクリーン: 全スクリーン
    const movieScreens = screens

    let totalInserted = 0

    for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
      const targetDate = new Date()
      targetDate.setUTCHours(0, 0, 0, 0)
      targetDate.setDate(targetDate.getDate() + dayOffset)

      // JSTの日付文字列
      const jstDate = new Date(targetDate.getTime() + 9 * 60 * 60 * 1000)
      const jstDateStr = jstDate.toISOString().slice(0, 10)

      // 映画スケジュール生成
      if (movies.length > 0) {
        totalInserted += await seedMovieSchedules(movies, movieScreens, targetDate, jstDateStr, dayOffset)
      }

      // 舞台スケジュール生成
      totalInserted += await seedStageSchedules(stages, screens, targetDate, jstDateStr, dayOffset)

      // イベントスケジュール生成
      totalInserted += await seedEventSchedules(events, screens, targetDate, jstDateStr, dayOffset)
    }

    if (totalInserted > 0) {
      console.log(`[seedSchedules] ${totalInserted}件のスケジュールを生成しました`)
    } else {
      console.log('[seedSchedules] 生成対象なし（すでに全日程のスケジュールが存在します）')
    }
  } catch (err) {
    console.error('[seedSchedules] エラー:', err)
  }
}
