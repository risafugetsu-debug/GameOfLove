// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';

const m0000 = `CREATE TABLE \`date_entries\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`person_id\` text NOT NULL,
\t\`note\` text DEFAULT '' NOT NULL,
\t\`vibe\` text NOT NULL,
\t\`movement\` integer,
\t\`logged_at\` integer NOT NULL,
\tFOREIGN KEY (\`person_id\`) REFERENCES \`date_people\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE \`date_people\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`photo_data\` text,
\t\`color_hex\` text NOT NULL,
\t\`first_impression_note\` text,
\t\`position\` integer DEFAULT 0 NOT NULL,
\t\`is_eliminated\` integer DEFAULT false NOT NULL,
\t\`eliminated_at\` integer,
\t\`created_at\` integer NOT NULL
);`;

const m0001 = `ALTER TABLE \`date_people\` ADD COLUMN \`is_favorite\` integer DEFAULT false NOT NULL;`;

export default {
  journal,
  migrations: {
    m0000,
    m0001,
  },
};
