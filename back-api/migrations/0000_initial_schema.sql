CREATE TABLE `images` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` bigint unsigned NOT NULL,
	`file_name` varchar(500) NOT NULL,
	`display_order` int unsigned NOT NULL DEFAULT 1,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(254) NOT NULL,
	`name` varchar(100),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_members_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `otp_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`token_hash` char(64) NOT NULL,
	`purpose` enum('login','register') NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`used_at` datetime(3),
	`failed_attempts` smallint unsigned NOT NULL DEFAULT 0,
	`locked_until` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `otp_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_products` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` enum('goods','food','drink','set') NOT NULL,
	`price` int unsigned NOT NULL,
	`image_url` varchar(500),
	`stock_quantity` int unsigned,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `pos_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pos_products_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `pos_sale_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`sale_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`product_name` varchar(160) NOT NULL,
	`unit_price` int unsigned NOT NULL,
	`quantity` int unsigned NOT NULL,
	`line_total` int unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `pos_sale_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pos_sales` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`sale_code` varchar(16) NOT NULL,
	`total_amount` int unsigned NOT NULL,
	`payment_method` enum('cash','card','qr') NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `pos_sales_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pos_sales_code` UNIQUE(`sale_code`)
);
--> statement-breakpoint
CREATE TABLE `product_notes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`product_id` varchar(80) NOT NULL,
	`note` text NOT NULL,
	`display_order` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `product_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_option_groups` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`product_id` varchar(80) NOT NULL,
	`group_key` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	`display_order` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `product_option_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_product_option_groups_key` UNIQUE(`product_id`,`group_key`)
);
--> statement-breakpoint
CREATE TABLE `product_options` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`group_id` bigint unsigned NOT NULL,
	`option_key` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`price_delta` int NOT NULL DEFAULT 0,
	`display_order` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `product_options_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_product_options_key` UNIQUE(`group_id`,`option_key`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(80) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` enum('goods','food','drink','set') NOT NULL,
	`price` int unsigned NOT NULL,
	`description` text,
	`image_url` varchar(500),
	`movie_title` varchar(160),
	`is_new` boolean NOT NULL DEFAULT false,
	`is_sold_out` boolean NOT NULL DEFAULT false,
	`display_order` int unsigned NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservation_seats` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`reservation_id` bigint unsigned NOT NULL,
	`schedule_id` bigint unsigned NOT NULL,
	`seat_id` bigint unsigned NOT NULL,
	`ticket_type` enum('general','university','highschool','child') NOT NULL,
	`price` int unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `reservation_seats_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_rs_schedule_seat` UNIQUE(`schedule_id`,`seat_id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`reservation_code` varchar(12) NOT NULL,
	`schedule_id` bigint unsigned NOT NULL,
	`member_id` bigint unsigned,
	`booking_type` enum('member','guest') NOT NULL DEFAULT 'member',
	`customer_name` varchar(100),
	`customer_email` varchar(254),
	`reservation_status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
	`expires_at` datetime(3),
	`total_price` int unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_reservation_code` UNIQUE(`reservation_code`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`screening_id` bigint unsigned NOT NULL,
	`screen_id` bigint unsigned NOT NULL,
	`starts_at` datetime(3) NOT NULL,
	`ends_at` datetime(3) NOT NULL,
	`is_public` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screen_seat_layouts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`screen_id` bigint unsigned NOT NULL,
	`layout_version` int unsigned NOT NULL DEFAULT 1,
	`background_image_url` varchar(500) NOT NULL,
	`aspect_ratio_width` smallint unsigned NOT NULL,
	`aspect_ratio_height` smallint unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `screen_seat_layouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_ssl_screen` UNIQUE(`screen_id`)
);
--> statement-breakpoint
CREATE TABLE `screenings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`type` enum('movie','stage','event') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`duration_min` smallint unsigned NOT NULL,
	`status` enum('now_showing','coming_soon') NOT NULL,
	`playwright` varchar(100),
	`director` varchar(100),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `screenings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`size` enum('large','medium','small') NOT NULL,
	`total_seats` int unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `screens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seats` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`screen_id` bigint unsigned NOT NULL,
	`seat_layout_id` bigint unsigned NOT NULL,
	`row_label` varchar(2) NOT NULL,
	`col_no` smallint unsigned NOT NULL,
	`position_top_pct` decimal(5,2) NOT NULL,
	`position_left_pct` decimal(5,2) NOT NULL,
	`seat_width_pct` decimal(5,2) NOT NULL,
	`seat_height_pct` decimal(5,2) NOT NULL,
	`hit_radius_pct` decimal(5,2),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `seats_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_seats_screen_row_col` UNIQUE(`screen_id`,`row_label`,`col_no`)
);
--> statement-breakpoint
ALTER TABLE `otp_tokens` ADD CONSTRAINT `otp_tokens_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pos_sale_items` ADD CONSTRAINT `pos_sale_items_sale_id_pos_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `pos_sales`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pos_sale_items` ADD CONSTRAINT `pos_sale_items_product_id_pos_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `pos_products`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_notes` ADD CONSTRAINT `product_notes_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_option_groups` ADD CONSTRAINT `product_option_groups_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_options` ADD CONSTRAINT `product_options_group_id_product_option_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `product_option_groups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation_seats` ADD CONSTRAINT `reservation_seats_reservation_id_reservations_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation_seats` ADD CONSTRAINT `reservation_seats_schedule_id_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation_seats` ADD CONSTRAINT `reservation_seats_seat_id_seats_id_fk` FOREIGN KEY (`seat_id`) REFERENCES `seats`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_schedule_id_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_screening_id_screenings_id_fk` FOREIGN KEY (`screening_id`) REFERENCES `screenings`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `screen_seat_layouts` ADD CONSTRAINT `screen_seat_layouts_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seats` ADD CONSTRAINT `seats_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `seats` ADD CONSTRAINT `seats_seat_layout_id_screen_seat_layouts_id_fk` FOREIGN KEY (`seat_layout_id`) REFERENCES `screen_seat_layouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_images_entity` ON `images` (`entity_type`,`entity_id`,`display_order`);--> statement-breakpoint
CREATE INDEX `idx_otp_member` ON `otp_tokens` (`member_id`,`purpose`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_otp_expires` ON `otp_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_pos_products_category` ON `pos_products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_pos_sale_items_sale` ON `pos_sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `idx_pos_sales_created_at` ON `pos_sales` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_products_display_order` ON `products` (`display_order`);--> statement-breakpoint
CREATE INDEX `idx_reservations_member` ON `reservations` (`member_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_schedules_starts_at` ON `schedules` (`starts_at`);--> statement-breakpoint
CREATE INDEX `idx_screenings_title` ON `screenings` (`title`);--> statement-breakpoint
CREATE INDEX `idx_screenings_type` ON `screenings` (`type`);--> statement-breakpoint
CREATE INDEX `idx_screenings_status` ON `screenings` (`status`);
