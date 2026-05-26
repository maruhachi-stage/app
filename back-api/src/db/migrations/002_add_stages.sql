-- マイグレーション 002: 演劇(stages)テーブルの追加とスケジュール(schedules)テーブルの拡張
SET NAMES utf8mb4;

-- 1. stages テーブルの作成
CREATE TABLE IF NOT EXISTS stages (
  id            BIGINT UNSIGNED                   NOT NULL AUTO_INCREMENT,
  title         VARCHAR(200)                      NOT NULL,
  description   TEXT                              NOT NULL,
  duration_min  SMALLINT UNSIGNED                 NOT NULL,
  thumbnail_url VARCHAR(500)                      NULL,
  status        ENUM('now_showing','coming_soon') NOT NULL,
  playwright    VARCHAR(100)                      NULL, -- 作 (演劇特有)
  director      VARCHAR(100)                      NULL, -- 演出 (演劇特有)
  created_at    DATETIME(3)                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_stages_title  (title),
  KEY idx_stages_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. stage_images テーブルの作成
CREATE TABLE IF NOT EXISTS stage_images (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stage_id      BIGINT UNSIGNED NOT NULL,
  file_name     VARCHAR(500)    NOT NULL,
  display_order INT UNSIGNED    NOT NULL DEFAULT 1,
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_stage_images_stage (stage_id, display_order),
  CONSTRAINT fk_stage_images_stage FOREIGN KEY (stage_id) REFERENCES stages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. schedules テーブルの拡張
-- movie_id の NOT NULL 制約を解除し、NULL 許容にする
ALTER TABLE schedules MODIFY movie_id BIGINT UNSIGNED NULL;

-- stage_id カラムを追加
ALTER TABLE schedules ADD COLUMN stage_id BIGINT UNSIGNED NULL AFTER movie_id;

-- stage_id に対する外部キー制約を追加
ALTER TABLE schedules ADD CONSTRAINT fk_schedules_stage FOREIGN KEY (stage_id) REFERENCES stages (id) ON DELETE RESTRICT;
