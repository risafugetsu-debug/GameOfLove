import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const datePeople = sqliteTable('date_people', {
  id:                  text('id').primaryKey(),
  name:                text('name').notNull(),
  photoData:           text('photo_data'),
  colorHex:            text('color_hex').notNull(),
  firstImpressionNote: text('first_impression_note'),
  position:            integer('position').notNull().default(0),
  isEliminated:        integer('is_eliminated', { mode: 'boolean' }).notNull().default(false),
  eliminatedAt:        integer('eliminated_at', { mode: 'timestamp' }),
  createdAt:           integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const dateEntries = sqliteTable('date_entries', {
  id:       text('id').primaryKey(),
  personId: text('person_id').notNull().references(() => datePeople.id, { onDelete: 'cascade' }),
  note:     text('note').notNull().default(''),
  vibe:     text('vibe').notNull(),
  movement: integer('movement'),
  loggedAt: integer('logged_at', { mode: 'timestamp' }).notNull(),
});
