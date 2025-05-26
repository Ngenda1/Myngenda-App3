# Myngenda Delivery Service

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
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with the following:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

3. Initialize the database:
   ```
   npm run init-db
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Deployment

1. Deploy the `public` directory to Netlify
2. Add the following environment variable in Netlify:
   ```
   API_URL=your_backend_api_url
   ```

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

## Deployment

### Netlify Deployment
1. Upload the contents of this package to GitHub
2. Connect your GitHub repository to Netlify
3. Set the publish directory to `public`
4. Set the environment variables for the backend API URL

### Backend Deployment
1. Deploy the server to a Node.js hosting service (Heroku, Render, etc.)
2. Set up a PostgreSQL database
3. Set the environment variables for the database connection and JWT secret

## License

This project is licensed under the MIT License.