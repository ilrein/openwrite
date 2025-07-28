CREATE TABLE `graph_connection` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`source_node_id` text NOT NULL,
	`target_node_id` text NOT NULL,
	`connection_type` text NOT NULL,
	`connection_strength` integer DEFAULT 1,
	`visual_properties` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_node_id`) REFERENCES `graph_node`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_node_id`) REFERENCES `graph_node`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `graph_node` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`node_type` text NOT NULL,
	`sub_type` text,
	`title` text NOT NULL,
	`description` text,
	`position_x` integer DEFAULT 0,
	`position_y` integer DEFAULT 0,
	`visual_properties` text,
	`metadata` text,
	`word_count` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `text_block` (
	`id` text PRIMARY KEY NOT NULL,
	`story_node_id` text NOT NULL,
	`content` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`word_count` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`story_node_id`) REFERENCES `graph_node`(`id`) ON UPDATE no action ON DELETE cascade
);
