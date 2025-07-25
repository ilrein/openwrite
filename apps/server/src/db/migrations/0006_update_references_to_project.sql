-- Update chapter table to reference work instead of project (novel)
-- First create new table with correct structure
CREATE TABLE `chapter_new` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`summary` text,
	`word_count` integer DEFAULT 0,
	`order` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`work_id` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Update character table to allow project or work references
CREATE TABLE `character_new` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`role` text,
	`appearance` text,
	`personality` text,
	`backstory` text,
	`motivation` text,
	`project_id` text,
	`work_id` text,
	`image` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Update location table to allow project or work references
CREATE TABLE `location_new` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text,
	`project_id` text,
	`work_id` text,
	`parent_location_id` text,
	`image` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_location_id`) REFERENCES `location_new`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Update plot_point table to allow project or work references
CREATE TABLE `plot_point_new` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text,
	`order` integer NOT NULL,
	`project_id` text,
	`work_id` text,
	`chapter_id` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapter_new`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Update writing_session table to include work reference
CREATE TABLE `writing_session_new` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`work_id` text,
	`user_id` text NOT NULL,
	`chapter_id` text,
	`words_written` integer DEFAULT 0,
	`time_spent` integer DEFAULT 0,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`goal_words` integer,
	`goal_achieved` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapter_new`(`id`) ON UPDATE no action ON DELETE no action
);