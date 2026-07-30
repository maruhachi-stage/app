CREATE TABLE `staff_accounts` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `user_id` varchar(80) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` smallint unsigned NOT NULL,
  `status` enum('active','suspended') NOT NULL DEFAULT 'active',
  `failed_login_count` smallint unsigned NOT NULL DEFAULT 0,
  `locked_until` datetime(3),
  `last_login_at` datetime(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `staff_accounts_id` PRIMARY KEY(`id`),
  CONSTRAINT `uq_staff_accounts_user_id` UNIQUE(`user_id`),
  CONSTRAINT `uq_staff_accounts_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `staff_otp_challenges` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `challenge_token_hash` char(64) NOT NULL,
  `staff_account_id` bigint unsigned NOT NULL,
  `otp_hash` char(64) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3),
  `failed_attempts` smallint unsigned NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `staff_otp_challenges_id` PRIMARY KEY(`id`),
  CONSTRAINT `uq_staff_otp_challenge_token` UNIQUE(`challenge_token_hash`)
);
--> statement-breakpoint
CREATE TABLE `staff_sessions` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `token_hash` char(64) NOT NULL,
  `staff_account_id` bigint unsigned NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `revoked_at` datetime(3),
  `last_seen_at` datetime(3),
  `ip_address` varchar(64),
  `user_agent` varchar(500),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `staff_sessions_id` PRIMARY KEY(`id`),
  CONSTRAINT `uq_staff_session_token` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `staff_audit_logs` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `staff_account_id` bigint unsigned,
  `action` varchar(100) NOT NULL,
  `target_type` varchar(100),
  `target_id` varchar(100),
  `request_id` varchar(64),
  `ip_address` varchar(64),
  `metadata` text,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `staff_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `staff_otp_challenges` ADD CONSTRAINT `staff_otp_challenges_staff_account_id_staff_accounts_id_fk` FOREIGN KEY (`staff_account_id`) REFERENCES `staff_accounts`(`id`) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE `staff_sessions` ADD CONSTRAINT `staff_sessions_staff_account_id_staff_accounts_id_fk` FOREIGN KEY (`staff_account_id`) REFERENCES `staff_accounts`(`id`) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE `staff_audit_logs` ADD CONSTRAINT `staff_audit_logs_staff_account_id_staff_accounts_id_fk` FOREIGN KEY (`staff_account_id`) REFERENCES `staff_accounts`(`id`) ON DELETE set null;
--> statement-breakpoint
CREATE INDEX `idx_staff_otp_account` ON `staff_otp_challenges` (`staff_account_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_staff_session_account` ON `staff_sessions` (`staff_account_id`,`expires_at`);
--> statement-breakpoint
CREATE INDEX `idx_staff_audit_account` ON `staff_audit_logs` (`staff_account_id`,`created_at`);
