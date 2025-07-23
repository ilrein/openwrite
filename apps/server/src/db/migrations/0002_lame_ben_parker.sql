PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_location` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text,
	`novel_id` text NOT NULL,
	`parent_location_id` text,
	`image` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_location`("id", "name", "description", "type", "novel_id", "parent_location_id", "image", "metadata", "created_at", "updated_at") SELECT "id", "name", "description", "type", "novel_id", "parent_location_id", "image", "metadata", "created_at", "updated_at" FROM `location`;--> statement-breakpoint
DROP TABLE `location`;--> statement-breakpoint
ALTER TABLE `__new_location` RENAME TO `location`;--> statement-breakpoint
PRAGMA foreign_keys=ON;