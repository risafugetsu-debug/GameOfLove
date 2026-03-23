CREATE TABLE `date_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`vibe` text NOT NULL,
	`movement` integer,
	`logged_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `date_people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `date_people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`photo_data` text,
	`color_hex` text NOT NULL,
	`first_impression_note` text,
	`position` integer DEFAULT 0 NOT NULL,
	`is_eliminated` integer DEFAULT false NOT NULL,
	`eliminated_at` integer,
	`created_at` integer NOT NULL
);
