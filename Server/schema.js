import { pgTable, varchar, text, timestamp, integer, serial } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create tables
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('customer'),
  vehicleType: varchar('vehicle_type', { length: 100 }),
  profileImageUrl: text('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 500 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

const packages = pgTable('packages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  from: varchar('from_location', { length: 255 }).notNull(),
  to: varchar('to_location', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  eta: varchar('eta', { length: 100 }),
  date: varchar('date', { length: 50 }),
  userId: integer('user_id').notNull().references(() => users.id),
  driverId: integer('driver_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Initialize drizzle with schema
const db = drizzle(pool, { schema: { users, sessions, packages } });

export {
  db,
  users,
  sessions,
  packages
};