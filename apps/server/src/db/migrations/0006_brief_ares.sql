CREATE INDEX `graph_connection_project_id_idx` ON `graph_connection` (`project_id`);--> statement-breakpoint
CREATE INDEX `graph_connection_source_node_id_idx` ON `graph_connection` (`source_node_id`);--> statement-breakpoint
CREATE INDEX `graph_connection_target_node_id_idx` ON `graph_connection` (`target_node_id`);--> statement-breakpoint
CREATE INDEX `graph_connection_type_idx` ON `graph_connection` (`project_id`,`connection_type`);--> statement-breakpoint
CREATE INDEX `graph_connection_source_target_idx` ON `graph_connection` (`source_node_id`,`target_node_id`);--> statement-breakpoint
CREATE INDEX `graph_node_project_id_idx` ON `graph_node` (`project_id`);--> statement-breakpoint
CREATE INDEX `graph_node_type_idx` ON `graph_node` (`node_type`);--> statement-breakpoint
CREATE INDEX `graph_node_project_type_idx` ON `graph_node` (`project_id`,`node_type`);--> statement-breakpoint
CREATE INDEX `text_block_story_node_id_idx` ON `text_block` (`story_node_id`);--> statement-breakpoint
CREATE INDEX `text_block_order_idx` ON `text_block` (`story_node_id`,`order_index`);