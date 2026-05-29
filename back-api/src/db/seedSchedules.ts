/**
 * seedSchedules.ts
 * サーバー起動時に今日から7日分のスケジュールがなければ自動生成する
 *
 * 使い方: src/index.ts で import して呼び出す
 *   import { seedSchedules } from '#db/seedSchedules.js'
 *   await seedSchedules()
 */

import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'

// ─── 定数 ──────────────────────────────────────────────────────────────────

const DAYS_AHEAD = 7          // 今日から何日分生成するか
const HOUR_START = 9          // 上映開始の最早時刻
const HOUR_END = 22           // 上映終了の最遅時刻（これ以降は開始しない）
const INTERVAL_MIN = 15       // 上映間のインターバル（分）

// ─── 簡易シード付き乱数生成 ─────────────────────────────────────────────────

function makeRand(seed: number) {
  let s = seed & 0x7fffffff
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// ─── メイン処理 ─────────────────────────────────────────────────────────────

export async function seedSchedules(): Promise<void> {
  try {
    // now_showing の上映アイテム（映画・舞台・イベント）を取得
    const [movieRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT m.id, m.duration_min
       FROM screenings m
       WHERE m.status = 'now_showing'
       ORDER BY m.id`,
    )
    if (movieRows.length === 0) {
      console.log('[seedSchedules] now_showingの上映アイテムがないためスキップ')
      return
    }

    // スクリーンを取得
    const [screenRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM screens ORDER BY id`,
    )
    if (screenRows.length === 0) {
      console.log('[seedSchedules] スクリーンが登録されていないためスキップ')
      return
    }

    const movies = movieRows as { id: number; duration_min: number }[]
    const screens = screenRows as { id: number }[]

    let totalInserted = 0

    for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
      // 対象日（JST基準でYYYY-MM-DD）
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + dayOffset)
      const dateStr = targetDate.toISOString().slice(0, 10) // YYYY-MM-DD (UTC)

      // JSTで見た日付（APIと合わせるため）
      const jstDate = new Date(targetDate.getTime() + 9 * 60 * 60 * 1000)
      const jstDateStr = jstDate.toISOString().slice(0, 10)

      for (const screen of screens) {
        // この日・このスクリーンにすでにスケジュールがあるか確認
        const [existing] = await pool.execute<mysql.RowDataPacket[]>(
          `SELECT COUNT(*) as cnt FROM schedules
           WHERE screen_id = ?
             AND is_public = 1
             AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?`,
          [screen.id, jstDateStr],
        )
        if ((existing[0].cnt as number) > 0) continue

        // スクリーン×日付ごとに独立したシードで乱数生成
        const rand = makeRand(
          screen.id * 10007 + dayOffset * 997 + targetDate.getMonth() * 31 + targetDate.getDate()
        )

        // 映画リストをシャッフル
        const shuffled = [...movies].sort(() => rand() - 0.5)

        // 上映開始時刻（分換算、UTCで計算しDBにはUTCで保存）
        const JST_OFFSET = 9 * 60
        let curMin = HOUR_START * 60 + Math.floor(rand() * 5) * 15 // 9:00〜10:00の間でランダム開始
        let prevMovieId = -1

        for (let loop = 0; loop < 10; loop++) {
          if (curMin >= HOUR_END * 60) break

          // 直前と異なる映画を選ぶ
          const candidates = shuffled.length > 1
            ? shuffled.filter(m => m.id !== prevMovieId)
            : shuffled
          const movie = candidates[Math.floor(rand() * candidates.length)]

          const endMin = curMin + movie.duration_min
          if (endMin > HOUR_END * 60) break

          // JST→UTC変換してDBに保存
          const startUtcMin = curMin - JST_OFFSET
          const endUtcMin = endMin - JST_OFFSET

          const startH = Math.floor((startUtcMin + 24 * 60) / 60) % 24
          const startM = ((startUtcMin % 60) + 60) % 60
          const endH = Math.floor((endUtcMin + 24 * 60) / 60) % 24
          const endM = ((endUtcMin % 60) + 60) % 60

          // UTCの日付（深夜0時をまたぐ場合は前日になる）
          const startDate = new Date(targetDate)
          if (startUtcMin < 0) startDate.setDate(startDate.getDate() - 1)
          const endDate = new Date(targetDate)
          if (endUtcMin < 0) endDate.setDate(endDate.getDate() - 1)

          const startDateStr = startDate.toISOString().slice(0, 10)
          const endDateStr = endDate.toISOString().slice(0, 10)

          const startsAt = `${startDateStr} ${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`
          const endsAt = `${endDateStr} ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`

          await pool.execute(
            `INSERT INTO schedules (screening_id, screen_id, starts_at, ends_at, is_public)
             VALUES (?, ?, ?, ?, 1)`,
            [movie.id, screen.id, startsAt, endsAt],
          )

          totalInserted++
          prevMovieId = movie.id

          // 次の上映開始 = 終了 + インターバル + ランダムな追加待機(0〜30分)
          curMin = endMin + INTERVAL_MIN + Math.floor(rand() * 3) * 15
        }
      }
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
