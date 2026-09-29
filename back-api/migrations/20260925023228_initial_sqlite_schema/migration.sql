CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`file_name` text NOT NULL,
	`display_order` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`email` text NOT NULL,
	`name` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `otp_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`member_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`purpose` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_otp_tokens_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `pos_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`image_url` text,
	`stock_quantity` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pos_sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`line_total` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_pos_sale_items_sale_id_pos_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `pos_sales`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_pos_sale_items_product_id_pos_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `pos_products`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `pos_sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`sale_code` text NOT NULL,
	`total_amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`product_id` text NOT NULL,
	`note` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_product_notes_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `product_option_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`product_id` text NOT NULL,
	`group_key` text NOT NULL,
	`name` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_product_option_groups_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `product_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`group_id` integer NOT NULL,
	`option_key` text NOT NULL,
	`label` text NOT NULL,
	`price_delta` integer DEFAULT 0 NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_product_options_group_id_product_option_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `product_option_groups`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`description` text,
	`image_url` text,
	`movie_title` text,
	`is_new` integer DEFAULT false NOT NULL,
	`is_sold_out` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reservation_seats` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`reservation_id` integer NOT NULL,
	`schedule_id` integer NOT NULL,
	`seat_id` integer NOT NULL,
	`ticket_type` text NOT NULL,
	`price` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_reservation_seats_reservation_id_reservations_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_reservation_seats_schedule_id_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_reservation_seats_seat_id_seats_id_fk` FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`reservation_code` text NOT NULL,
	`schedule_id` integer NOT NULL,
	`member_id` integer,
	`booking_type` text DEFAULT 'member' NOT NULL,
	`customer_name` text,
	`customer_email` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`expires_at` integer,
	`total_price` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_reservations_schedule_id_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_reservations_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`screening_id` integer NOT NULL,
	`screen_id` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_schedules_screening_id_screenings_id_fk` FOREIGN KEY (`screening_id`) REFERENCES `screenings`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_schedules_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `screen_seat_layouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`screen_id` integer NOT NULL,
	`layout_version` integer DEFAULT 1 NOT NULL,
	`background_image_url` text NOT NULL,
	`aspect_ratio_width` integer NOT NULL,
	`aspect_ratio_height` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_screen_seat_layouts_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `screenings` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`duration_min` integer NOT NULL,
	`status` text NOT NULL,
	`playwright` text,
	`director` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `screens` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`size` text NOT NULL,
	`total_seats` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seats` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`screen_id` integer NOT NULL,
	`seat_layout_id` integer NOT NULL,
	`row_label` text NOT NULL,
	`col_no` integer NOT NULL,
	`position_top_pct` real NOT NULL,
	`position_left_pct` real NOT NULL,
	`seat_width_pct` real NOT NULL,
	`seat_height_pct` real NOT NULL,
	`hit_radius_pct` real,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_seats_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_seats_seat_layout_id_screen_seat_layouts_id_fk` FOREIGN KEY (`seat_layout_id`) REFERENCES `screen_seat_layouts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `idx_images_entity` ON `images` (`entity_type`,`entity_id`,`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_members_email` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `idx_otp_member` ON `otp_tokens` (`member_id`,`purpose`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_otp_expires` ON `otp_tokens` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pos_products_slug` ON `pos_products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_pos_products_category` ON `pos_products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_pos_sale_items_sale` ON `pos_sale_items` (`sale_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pos_sales_code` ON `pos_sales` (`sale_code`);--> statement-breakpoint
CREATE INDEX `idx_pos_sales_created_at` ON `pos_sales` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_product_option_groups_key` ON `product_option_groups` (`product_id`,`group_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_product_options_key` ON `product_options` (`group_id`,`option_key`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_products_display_order` ON `products` (`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_rs_schedule_seat` ON `reservation_seats` (`schedule_id`,`seat_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_reservation_code` ON `reservations` (`reservation_code`);--> statement-breakpoint
CREATE INDEX `idx_reservations_member` ON `reservations` (`member_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_schedules_starts_at` ON `schedules` (`starts_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_ssl_screen` ON `screen_seat_layouts` (`screen_id`);--> statement-breakpoint
CREATE INDEX `idx_screenings_title` ON `screenings` (`title`);--> statement-breakpoint
CREATE INDEX `idx_screenings_type` ON `screenings` (`type`);--> statement-breakpoint
CREATE INDEX `idx_screenings_status` ON `screenings` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_seats_screen_row_col` ON `seats` (`screen_id`,`row_label`,`col_no`);