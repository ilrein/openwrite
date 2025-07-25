-- Step 1: Rename novel table to project
ALTER TABLE `novel` RENAME TO `project`;
--> statement-breakpoint

-- Step 2: Add project type field
ALTER TABLE `project` ADD `type` text DEFAULT 'novel' NOT NULL;
--> statement-breakpoint

-- Step 3: Create work table for individual works within projects
CREATE TABLE `work` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`work_type` text NOT NULL,
	`order` integer DEFAULT 1 NOT NULL,
	`target_word_count` integer,
	`current_word_count` integer DEFAULT 0,
	`status` text DEFAULT 'draft' NOT NULL,
	`cover_image` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	`last_written_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Step 4: Rename novel_collaborator to project_collaborator
ALTER TABLE `novel_collaborator` RENAME TO `project_collaborator`;
--> statement-breakpoint

-- Step 5: Update foreign key references (SQLite will handle these automatically with the table renames)
-- Note: SQLite automatically updates foreign key references when tables are renamed