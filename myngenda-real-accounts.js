/**
 * Myngenda Real Accounts Integration Script
 * 
 * This script creates a complete deployment package with real user accounts
 * and persistent login. The package includes:
 * 
 * 1. Enhanced authentication with JWT tokens and local storage
 * 2. Role-specific dashboards with proper styling
 * 3. Real data storage in PostgreSQL database
 * 4. Complete frontend-backend integration
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create deployment directory
const deployDir = path.join(__dirname, 'myngenda-real-accounts');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

// Create public directory for static files
const publicDir = path.join(deployDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create server directory for backend files
const serverDir = path.join(deployDir, 'server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

// Copy main files
const filesToCopy = [
  { src: 'public/index.html', dest: path.join(publicDir, 'index.html') },
  { src: 'public/standalone-auth-enhanced.html', dest: path.join(publicDir, 'standalone-auth-enhanced.html') },
  { src: 'public/customer-dashboard-enhanced.html', dest: path.join(publicDir, 'customer-dashboard-enhanced.html') },
  { src: 'public/driver-dashboard-enhanced.html', dest: path.join(publicDir, 'driver-dashboard-enhanced.html') },
  { src: 'public/admin-dashboard-enhanced.html', dest: path.join(publicDir, 'admin-dashboard-enhanced.html') },
  { src: 'public/auth-connector-enhanced.js', dest: path.join(publicDir, 'auth-connector-enhanced.js') },
  { src: 'server-real-data.js', dest: path.join(deployDir, 'server-real-data.js') },
  { src: 'server/schema.js', dest: path.join(serverDir, 'schema.js') },
  { src: 'server/auth.js', dest: path.join(serverDir, 'auth.js') },
  { src: 'server/init-db.js', dest: path.join(serverDir, 'init-db.js') },
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file.src)) {
    fs.copyFileSync(file.src, file.dest);
    console.log(`Copied ${file.src} to ${file.dest}`);
  } else {
    console.error(`Source file ${file.src} does not exist`);
  }
});

// Create package.json
const packageJson = {
  "name": "myngenda-delivery-service",
  "version": "1.0.0",
  "description": "Myngenda Package Delivery Service with Real User Accounts",
  "main": "server-real-data.js",
  "type": "module",
  "scripts": {
    "start": "node server-real-data.js",
    "init-db": "node server/init-db.js",
    "dev": "nodemon server-real-data.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "drizzle-orm": "^0.29.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
};

fs.writeFileSync(
  path.join(deployDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
console.log('Created package.json');

// Create _redirects file for Netlify SPA routing
const redirectsContent = `/*    /index.html   200`;
fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent);
console.log('Created _redirects file for Netlify');

// Create README.md with setup instructions
const readmeContent = `# Myngenda Delivery Service

A mobile-first package delivery service platform targeting the African market, with enhanced user experience and role-specific dashboards for customers, drivers, and administrators.

## Real User Accounts & Persistent Login

This package includes:

1. Enhanced authentication with JWT tokens and local storage
2. Role-specific dashboards with proper styling
3. Real data storage in PostgreSQL database
4. Complete frontend-backend integration

## Setup Instructions

### Backend Setup

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Set up environment variables:
   Create a \`.env\` file with the following:
   \`\`\`
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   \`\`\`

3. Initialize the database:
   \`\`\`
   npm run init-db
   \`\`\`

4. Start the server:
   \`\`\`
   npm start
   \`\`\`

### Frontend Deployment

1. Deploy the \`public\` directory to Netlify
2. Add the following environment variable in Netlify:
   \`\`\`
   API_URL=your_backend_api_url
   \`\`\`

## Test Accounts

The system comes with pre-configured test accounts:

- Admin: admin@myngenda.com / admin123
- Customer: user@myngenda.com / user123
- Driver: driver@myngenda.com / driver123

## Features

- JWT authentication with persistent login
- Role-based access control
- Real-time package tracking
- Admin dashboard for system management
- Driver dashboard for delivery management
- Customer dashboard for package sending and tracking

## License

This project is licensed under the MIT License.
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), readmeContent);
console.log('Created README.md with setup instructions');

// Create zip archive
const output = fs.createWriteStream(path.join(__dirname, 'myngenda-real-accounts.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

archive.pipe(output);

// Add the deployment directory to the archive
archive.directory(deployDir, false);

// Finalize the archive
archive.finalize();

console.log('Creating deployment package: myngenda-real-accounts.zip');
console.log('The package includes real user accounts and persistent login functionality.');
console.log('Upload this package to GitHub/Netlify for deployment.');