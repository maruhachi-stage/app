-- HALシネマ 映画館スタイル座席レイアウト更新
-- 実行方法: 既存DBに対してそのまま実行可能 (UPDATE文のみ)
-- 新規DBの場合: 先に 001_init.sql でテーブルを作成し、screens/screen_seat_layouts/screenings を別途挿入してから実行
SET NAMES utf8mb4;

-- ──────────────────────────────────────────────────────────────────────────────
-- 大スクリーン (screen_id 1, 2, 3) : 200席 / 20行(A-T) x 10列
-- レイアウト: [1-2] 左通路 [3-4-5-6-7-8] 右通路 [9-10]
-- コンテナサイズ目安: 幅533px x 高500px (seat_width_pct=6%, seat_height_pct=4%)
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE seats SET
  position_top_pct = CASE row_label
    WHEN 'A' THEN  5.0 WHEN 'B' THEN  9.5 WHEN 'C' THEN 14.0 WHEN 'D' THEN 18.5
    WHEN 'E' THEN 23.0 WHEN 'F' THEN 27.5 WHEN 'G' THEN 32.0 WHEN 'H' THEN 36.5
    WHEN 'I' THEN 41.0 WHEN 'J' THEN 45.5 WHEN 'K' THEN 50.0 WHEN 'L' THEN 54.5
    WHEN 'M' THEN 59.0 WHEN 'N' THEN 63.5 WHEN 'O' THEN 68.0 WHEN 'P' THEN 72.5
    WHEN 'Q' THEN 77.0 WHEN 'R' THEN 81.5 WHEN 'S' THEN 86.0 WHEN 'T' THEN 90.5
    ELSE position_top_pct
  END,
  position_left_pct = CASE col_no
    WHEN  1 THEN  6.5 WHEN  2 THEN 13.5
    WHEN  3 THEN 32.5 WHEN  4 THEN 39.5 WHEN  5 THEN 46.5
    WHEN  6 THEN 53.5 WHEN  7 THEN 60.5 WHEN  8 THEN 67.5
    WHEN  9 THEN 86.5 WHEN 10 THEN 93.5
    ELSE position_left_pct
  END,
  seat_width_pct  = 6.00,
  seat_height_pct = 4.00,
  hit_radius_pct  = 2.00
WHERE screen_id IN (1, 2, 3);

-- ──────────────────────────────────────────────────────────────────────────────
-- 中スクリーン (screen_id 4, 5) : 120席 / 12行(A-L) x 10列
-- レイアウト: [1-2] 左通路 [3-4-5-6-7-8] 右通路 [9-10]
-- コンテナサイズ目安: 幅533px x 高400px (seat_width_pct=6%, seat_height_pct=5%)
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE seats SET
  position_top_pct = CASE row_label
    WHEN 'A' THEN  5.0 WHEN 'B' THEN 12.5 WHEN 'C' THEN 20.0 WHEN 'D' THEN 27.5
    WHEN 'E' THEN 35.0 WHEN 'F' THEN 42.5 WHEN 'G' THEN 50.0 WHEN 'H' THEN 57.5
    WHEN 'I' THEN 65.0 WHEN 'J' THEN 72.5 WHEN 'K' THEN 80.0 WHEN 'L' THEN 87.5
    ELSE position_top_pct
  END,
  position_left_pct = CASE col_no
    WHEN  1 THEN  6.5 WHEN  2 THEN 13.5
    WHEN  3 THEN 32.5 WHEN  4 THEN 39.5 WHEN  5 THEN 46.5
    WHEN  6 THEN 53.5 WHEN  7 THEN 60.5 WHEN  8 THEN 67.5
    WHEN  9 THEN 86.5 WHEN 10 THEN 93.5
    ELSE position_left_pct
  END,
  seat_width_pct  = 6.00,
  seat_height_pct = 5.00,
  hit_radius_pct  = 2.00
WHERE screen_id IN (4, 5);

-- ──────────────────────────────────────────────────────────────────────────────
-- 小スクリーン (screen_id 6, 7, 8) : 70席 / 7行(A-G) x 10列
-- レイアウト: [1-2] 左通路 [3-4-5-6-7-8] 右通路 [9-10]
-- (左右から2列目の場所に通路)
-- コンテナサイズ目安: 幅533px x 高400px (seat_width_pct=6%, seat_height_pct=5%)
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE seats SET
  position_top_pct = CASE row_label
    WHEN 'A' THEN  8.0 WHEN 'B' THEN 20.0 WHEN 'C' THEN 32.0 WHEN 'D' THEN 44.0
    WHEN 'E' THEN 56.0 WHEN 'F' THEN 68.0 WHEN 'G' THEN 80.0
    ELSE position_top_pct
  END,
  position_left_pct = CASE col_no
    WHEN  1 THEN  6.5 WHEN  2 THEN 13.5
    WHEN  3 THEN 32.5 WHEN  4 THEN 39.5 WHEN  5 THEN 46.5
    WHEN  6 THEN 53.5 WHEN  7 THEN 60.5 WHEN  8 THEN 67.5
    WHEN  9 THEN 86.5 WHEN 10 THEN 93.5
    ELSE position_left_pct
  END,
  seat_width_pct  = 6.00,
  seat_height_pct = 5.00,
  hit_radius_pct  = 2.00
WHERE screen_id IN (6, 7, 8);
