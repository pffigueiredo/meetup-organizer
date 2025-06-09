
import { serial, text, pgTable, timestamp, integer, varchar, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const meetupsTable = pgTable('meetups', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  time: varchar('time', { length: 5 }).notNull(), // HH:MM format
  location: text('location').notNull(),
  organizer_id: integer('organizer_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const rsvpsTable = pgTable('rsvps', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  meetup_id: integer('meetup_id').notNull().references(() => meetupsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserMeetup: unique().on(table.user_id, table.meetup_id),
}));

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  organizedMeetups: many(meetupsTable),
  rsvps: many(rsvpsTable),
}));

export const meetupsRelations = relations(meetupsTable, ({ one, many }) => ({
  organizer: one(usersTable, {
    fields: [meetupsTable.organizer_id],
    references: [usersTable.id],
  }),
  rsvps: many(rsvpsTable),
}));

export const rsvpsRelations = relations(rsvpsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [rsvpsTable.user_id],
    references: [usersTable.id],
  }),
  meetup: one(meetupsTable, {
    fields: [rsvpsTable.meetup_id],
    references: [meetupsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Meetup = typeof meetupsTable.$inferSelect;
export type NewMeetup = typeof meetupsTable.$inferInsert;
export type RSVP = typeof rsvpsTable.$inferSelect;
export type NewRSVP = typeof rsvpsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  users: usersTable, 
  meetups: meetupsTable, 
  rsvps: rsvpsTable 
};
