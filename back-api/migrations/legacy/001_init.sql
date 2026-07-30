-- HALシネマ テーブル定義
-- 対象DB: MySQL 8.x
-- 文字コード: utf8mb4 / タイムゾーン: UTC 保存・JST 表示
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- 1. members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  email      VARCHAR(254)     NOT NULL,
  name       VARCHAR(100)     NULL,
  created_at DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_members_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 2. otp_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_tokens (
  id               BIGINT UNSIGNED          NOT NULL AUTO_INCREMENT,
  member_id        BIGINT UNSIGNED          NOT NULL,
  token_hash       CHAR(64)                 NOT NULL,
  purpose          ENUM('login','register') NOT NULL,
  expires_at       DATETIME(3)              NOT NULL,
  used_at          DATETIME(3)              NULL,
  failed_attempts  TINYINT UNSIGNED         NOT NULL DEFAULT 0,
  locked_until     DATETIME(3)              NULL,
  created_at       DATETIME(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_otp_member  (member_id, purpose, created_at DESC),
  KEY idx_otp_expires (expires_at),
  CONSTRAINT fk_otp_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 3. screens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screens (
  id          BIGINT UNSIGNED               NOT NULL AUTO_INCREMENT,
  name        VARCHAR(50)                   NOT NULL,
  size        ENUM('large','medium','small') NOT NULL,
  total_seats INT UNSIGNED                  NOT NULL,
  created_at  DATETIME(3)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 4. screenings (映画・舞台・イベントマスタ統合)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screenings (
  id            BIGINT UNSIGNED                   NOT NULL AUTO_INCREMENT,
  type          ENUM('movie', 'stage', 'event')   NOT NULL,
  title         VARCHAR(200)                      NOT NULL,
  description   TEXT                              NOT NULL,
  duration_min  SMALLINT UNSIGNED                 NOT NULL,
  status        ENUM('now_showing','coming_soon') NOT NULL,
  playwright    VARCHAR(100)                      NULL, -- 作 (演劇特有)
  director      VARCHAR(100)                      NULL, -- 演出 (演劇特有)
  created_at    DATETIME(3)                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_screenings_title  (title),
  KEY idx_screenings_type   (type),
  KEY idx_screenings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 4.5. images (統合・多態的画像管理テーブル)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS images (
  id            BIGINT UNSIGNED                    NOT NULL AUTO_INCREMENT,
  entity_type   VARCHAR(50)                        NOT NULL, -- 'screening', 'goods', 'food' 等を識別
  entity_id     BIGINT UNSIGNED                    NOT NULL, -- 各種マスタテーブルのIDに対応
  file_name     VARCHAR(500)                       NOT NULL,
  display_order INT UNSIGNED                       NOT NULL DEFAULT 1,
  created_at    DATETIME(3)                        NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_images_entity (entity_type, entity_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 5. schedules (映画・舞台・イベント上映スケジュール統合)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  screening_id BIGINT UNSIGNED NOT NULL,
  screen_id    BIGINT UNSIGNED NOT NULL,
  starts_at    DATETIME(3)     NOT NULL,
  ends_at      DATETIME(3)     NOT NULL,
  is_public    TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_schedules_starts_at (starts_at),
  CONSTRAINT fk_schedules_screening FOREIGN KEY (screening_id) REFERENCES screenings (id) ON DELETE RESTRICT,
  CONSTRAINT fk_schedules_screen    FOREIGN KEY (screen_id)    REFERENCES screens    (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 6. screen_seat_layouts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screen_seat_layouts (
  id                   BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  screen_id            BIGINT UNSIGNED   NOT NULL,
  layout_version       INT UNSIGNED      NOT NULL DEFAULT 1,
  background_image_url VARCHAR(500)      NOT NULL,
  aspect_ratio_width   SMALLINT UNSIGNED NOT NULL,
  aspect_ratio_height  SMALLINT UNSIGNED NOT NULL,
  created_at           DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_ssl_screen (screen_id),
  CONSTRAINT fk_ssl_screen FOREIGN KEY (screen_id) REFERENCES screens (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 7. seats
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
  id                BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  screen_id         BIGINT UNSIGNED   NOT NULL,
  seat_layout_id    BIGINT UNSIGNED   NOT NULL,
  row_label         VARCHAR(2)        NOT NULL,
  col_no            SMALLINT UNSIGNED NOT NULL,
  position_top_pct  DECIMAL(5,2)      NOT NULL,
  position_left_pct DECIMAL(5,2)      NOT NULL,
  seat_width_pct    DECIMAL(5,2)      NOT NULL,
  seat_height_pct   DECIMAL(5,2)      NOT NULL,
  hit_radius_pct    DECIMAL(5,2)      NULL,
  created_at        DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_seats_screen_row_col (screen_id, row_label, col_no),
  CONSTRAINT fk_seats_screen FOREIGN KEY (screen_id)      REFERENCES screens             (id) ON DELETE RESTRICT,
  CONSTRAINT fk_seats_layout FOREIGN KEY (seat_layout_id) REFERENCES screen_seat_layouts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 8. reservations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id               BIGINT UNSIGNED               NOT NULL AUTO_INCREMENT,
  reservation_code VARCHAR(12)                   NOT NULL,
  schedule_id      BIGINT UNSIGNED               NOT NULL,
  member_id        BIGINT UNSIGNED               NULL,
  booking_type     ENUM('member','guest')        NOT NULL DEFAULT 'member',
  customer_name    VARCHAR(100)                  NULL,
  customer_email   VARCHAR(254)                  NULL,
  status           ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  expires_at       DATETIME(3)                   NULL,
  total_price      INT UNSIGNED                  NOT NULL,
  created_at       DATETIME(3)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservation_code (reservation_code),
  KEY idx_reservations_member (member_id, created_at DESC),
  CONSTRAINT fk_reservations_schedule FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reservations_member   FOREIGN KEY (member_id)   REFERENCES members   (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 9. reservation_seats
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservation_seats (
  id             BIGINT UNSIGNED                                   NOT NULL AUTO_INCREMENT,
  reservation_id BIGINT UNSIGNED                                   NOT NULL,
  schedule_id    BIGINT UNSIGNED                                   NOT NULL,
  seat_id        BIGINT UNSIGNED                                   NOT NULL,
  ticket_type    ENUM('general','university','highschool','child') NOT NULL,
  price          INT UNSIGNED                                      NOT NULL,
  created_at     DATETIME(3)                                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_rs_schedule_seat (schedule_id, seat_id),
  CONSTRAINT fk_rs_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE CASCADE,
  CONSTRAINT fk_rs_schedule    FOREIGN KEY (schedule_id)    REFERENCES schedules    (id) ON DELETE RESTRICT,
  CONSTRAINT fk_rs_seat        FOREIGN KEY (seat_id)        REFERENCES seats        (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
