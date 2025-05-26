import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, users, sessions } from './schema.js';
import { eq } from 'drizzle-orm';

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda-jwt-secret-key';
const TOKEN_EXPIRY = '7d'; // Token expires in 7 days

// User registration
async function registerUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
    
    if (existingUser.length > 0) {
      return { success: false, message: 'User with this email already exists' };
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create new user
    const newUser = await db.insert(users).values({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role || 'customer',
      vehicleType: userData.vehicleType || null
    }).returning();
    
    if (!newUser || newUser.length === 0) {
      return { success: false, message: 'Failed to create user' };
    }
    
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
    
    // Return user data (without password) and token
    const { password, ...userWithoutPassword } = user;
    
    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed', error: error.message };
  }
}

// User login
async function loginUser(email, password) {
  try {
    // Find user by email
    const userResult = await db.select().from(users).where(eq(users.email, email));
    
    if (!userResult || userResult.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const user = userResult[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
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
    
    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed', error: error.message };
  }
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Logout user
async function logoutUser(userId, token) {
  try {
    // Remove session
    await db.delete(sessions).where(eq(sessions.userId, userId)).where(eq(sessions.token, token));
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Logout failed', error: error.message };
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    
    if (!userResult || userResult.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const user = userResult[0];
    
    // Return user data (without password)
    const { password, ...userWithoutPassword } = user;
    
    return {
      success: true,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Get user error:', error);
    return { success: false, message: 'Failed to get user', error: error.message };
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

export {
  registerUser,
  loginUser,
  logoutUser,
  getUserById,
  authMiddleware,
  verifyToken
};