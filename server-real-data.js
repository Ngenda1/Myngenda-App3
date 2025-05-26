import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { db, users, sessions, packages } from './server/schema.js';
import { eq } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3000;

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda-jwt-secret-key';
const TOKEN_EXPIRY = '7d'; // Token expires in 7 days

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use(express.static('public'));

// Authentication middleware
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

// TEST endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Find user by email
    const userResults = await db.select().from(users).where(eq(users.email, email));
    
    if (userResults.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    const user = userResults[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    // Store session
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    // Return user info and token
    const { password: _, ...userInfo } = user;
    
    console.log('Login successful for user:', userInfo.email);
    res.json({ success: true, user: userInfo, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { name, email, password, role, vehicleType } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
      vehicleType: vehicleType || null
    }).returning();
    
    // Generate JWT token
    const user = newUser[0];
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    
    // Store session
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    // Return user info and token
    const { password: _, ...userInfo } = user;
    
    console.log('Registration successful for user:', userInfo.email);
    res.json({ success: true, user: userInfo, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Current user endpoint
app.get('/api/auth/current-user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user from database
    const userResults = await db.select().from(users).where(eq(users.id, userId));
    
    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userResults[0];
    
    // Return user info (without password)
    const { password, ...userInfo } = user;
    
    res.json({ success: true, user: userInfo });
  } catch (error) {
    console.error('Current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const token = req.headers.authorization.split(' ')[1];
    
    // Remove session
    await db.delete(sessions)
      .where(eq(sessions.userId, userId))
      .where(eq(sessions.token, token));
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get packages endpoint
app.get('/api/packages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let userPackages;
    
    if (userRole === 'admin') {
      // Admins see all packages
      userPackages = await db.select().from(packages);
    } else if (userRole === 'driver') {
      // Drivers see packages assigned to them
      userPackages = await db.select().from(packages).where(eq(packages.driverId, userId));
    } else {
      // Customers see their own packages
      userPackages = await db.select().from(packages).where(eq(packages.userId, userId));
    }
    
    res.json({ success: true, packages: userPackages });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create package endpoint
app.post('/api/packages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, from, to } = req.body;
    
    if (!name || !from || !to) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Create new package
    const newPackage = await db.insert(packages).values({
      name,
      from,
      to,
      status: 'pending',
      eta: 'Calculating...',
      date: new Date().toISOString().split('T')[0],
      userId
    }).returning();
    
    res.json({ success: true, package: newPackage[0] });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});