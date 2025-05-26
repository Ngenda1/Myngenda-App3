import pg from 'pg';
const { Pool } = pg;

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// SQL to create users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'customer',
  vehicle_type VARCHAR(100),
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// SQL to create sessions table
const createSessionsTable = `
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// SQL to create packages table
const createPackagesTable = `
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  eta VARCHAR(100),
  date VARCHAR(50),
  user_id UUID NOT NULL,
  driver_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);
`;

// SQL to insert test users if they don't exist
const insertTestUsers = `
INSERT INTO users (email, password, name, role)
SELECT 
  'admin@myngenda.com', 
  '$2a$10$NL0iEL9CpMwYP4puPAvHPuN4HVhYGYvyWQzWyPwJ8o9PVdOy2pVae', 
  'Admin User', 
  'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@myngenda.com');

INSERT INTO users (email, password, name, role)
SELECT 
  'user@myngenda.com', 
  '$2a$10$t3xL4Y/SRfrzKV4JWQvUZerY2JZWfCO/p9jzeYbJpi1Wo8Xjdd4rW', 
  'Test Customer', 
  'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@myngenda.com');

INSERT INTO users (email, password, name, role, vehicle_type)
SELECT 
  'driver@myngenda.com', 
  '$2a$10$ZoIfH5.r9yfePwi30rw0kewhNlSqOZXuXPmTGnf9B.l3BTW33Lh3m', 
  'Test Driver', 
  'driver',
  'motorcycle'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver@myngenda.com');
`;

// Initialize database
async function initDatabase() {
  try {
    // Create tables
    await pool.query(createUsersTable);
    console.log('Users table created or already exists');
    
    await pool.query(createSessionsTable);
    console.log('Sessions table created or already exists');
    
    await pool.query(createPackagesTable);
    console.log('Packages table created or already exists');
    
    // Insert test users
    await pool.query(insertTestUsers);
    console.log('Test users created or already exist');
    
    console.log('Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initDatabase();