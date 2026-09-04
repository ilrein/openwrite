CREATE TABLE `character_group` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`member_ids` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `character_group_project_id_idx` ON `character_group` (`project_id`);--> statement-breakpoint
CREATE TABLE `world_element` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`description` text,
	`traits` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `world_element_project_id_idx` ON `world_element` (`project_id`);--> statement-breakpoint
ALTER TABLE `chapter` ADD `braindump` text;--> statement-breakpoint
ALTER TABLE `character` ADD `role` text;--> statement-breakpoint
ALTER TABLE `character` ADD `traits` text;--> statement-breakpoint
ALTER TABLE `project` ADD `style_bible` text;