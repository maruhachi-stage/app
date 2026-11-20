CREATE TABLE `staff_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`failed_login_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`last_login_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`staff_account_id` integer,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`request_id` text,
	`ip_address` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_staff_audit_logs_staff_account_id_staff_accounts_id_fk` FOREIGN KEY (`staff_account_id`) REFERENCES `staff_accounts`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `staff_otp_challenges` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`challenge_token_hash` text NOT NULL,
	`staff_account_id` integer NOT NULL,
	`otp_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_staff_otp_challenges_staff_account_id_staff_accounts_id_fk` FOREIGN KEY (`staff_account_id`) REFERENCES `staff_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `staff_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`token_hash` text NOT NULL,
	`staff_account_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`last_seen_at` integer,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_staff_sessions_staff_account_id_staff_accounts_id_fk` FOREIGN KEY (`staff_account_id`) REFERENCES `staff_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_staff_accounts_user_id` ON `staff_accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_staff_accounts_email` ON `staff_accounts` (`email`);--> statement-breakpoint
CREATE INDEX `idx_staff_audit_account` ON `staff_audit_logs` (`staff_account_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_staff_otp_challenge_token` ON `staff_otp_challenges` (`challenge_token_hash`);--> statement-breakpoint
CREATE INDEX `idx_staff_otp_account` ON `staff_otp_challenges` (`staff_account_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_staff_session_token` ON `staff_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_staff_session_account` ON `staff_sessions` (`staff_account_id`,`expires_at`);