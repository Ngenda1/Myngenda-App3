/**
 * Myngenda Enhanced Authentication Connector
 * Supports persistent authentication with JWT tokens and local storage
 */

const AuthConnector = (function() {
  // API base URL - configure for production vs development
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://myngenda.replit.app/api';
  
  // Local storage keys
  const TOKEN_KEY = 'myngenda_auth_token';
  const USER_KEY = 'myngenda_user';
  
  // Store authentication data in local storage
  function storeAuthData(user, token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  
  // Clear authentication data from local storage
  function clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  
  // Check if user is authenticated
  function isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
  
  // Get current user data
  function getCurrentUser() {
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  // Make API request with authentication
  async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (response.status === 401) {
        // Token expired or invalid, clear auth data
        clearAuthData();
      }
      
      return {
        success: response.ok,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        data: { message: 'Network error. Please check your connection.' },
        status: 0
      };
    }
  }
  
  // Login user
  async function login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.token && data.user) {
        storeAuthData(data.user, data.token);
        return {
          success: true,
          user: data.user
        };
      } else {
        return {
          success: false,
          message: data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.'
      };
    }
  }
  
  // Register user
  async function register(userData) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (data.success && data.token && data.user) {
        storeAuthData(data.user, data.token);
        return {
          success: true,
          user: data.user
        };
      } else {
        return {
          success: false,
          message: data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.'
      };
    }
  }
  
  // Logout user
  async function logout() {
    try {
      // Call logout API if authenticated
      if (isAuthenticated()) {
        await apiRequest('/auth/logout', { method: 'POST' });
      }
      
      // Clear local auth data regardless of API response
      clearAuthData();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local auth data even if API call fails
      clearAuthData();
      return { success: true };
    }
  }
  
  // Get current user from API
  async function fetchCurrentUser() {
    if (!isAuthenticated()) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }
    
    const response = await apiRequest('/auth/current-user');
    
    if (response.success && response.data.success) {
      // Update stored user data
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      return {
        success: true,
        user: response.data.user
      };
    } else {
      clearAuthData();
      return {
        success: false,
        message: response.data.message || 'Failed to get user data'
      };
    }
  }
  
  // Redirect to appropriate dashboard based on user role
  function redirectToDashboard() {
    const user = getCurrentUser();
    
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
    
    switch (user.role) {
      case 'admin':
        window.location.href = '/admin-dashboard.html';
        break;
      case 'driver':
        window.location.href = '/driver-dashboard.html';
        break;
      default:
        window.location.href = '/customer-dashboard.html';
        break;
    }
  }
  
  // Check for authentication redirect
  function checkAuthRedirect() {
    // Already on login or register page
    if (window.location.pathname.includes('login') || window.location.pathname.includes('register')) {
      return;
    }
    
    // Dashboard access requires authentication
    if (window.location.pathname.includes('dashboard') && !isAuthenticated()) {
      window.location.href = '/login.html';
      return;
    }
    
    // Admin dashboard check
    if (window.location.pathname.includes('admin-dashboard')) {
      const user = getCurrentUser();
      if (!user || user.role !== 'admin') {
        redirectToDashboard();
        return;
      }
    }
    
    // Driver dashboard check
    if (window.location.pathname.includes('driver-dashboard')) {
      const user = getCurrentUser();
      if (!user || user.role !== 'driver') {
        redirectToDashboard();
        return;
      }
    }
    
    // Customer dashboard check
    if (window.location.pathname.includes('customer-dashboard')) {
      const user = getCurrentUser();
      if (!user || user.role !== 'customer') {
        redirectToDashboard();
        return;
      }
    }
  }
  
  // Public API
  return {
    login,
    register,
    logout,
    isAuthenticated,
    getCurrentUser,
    fetchCurrentUser,
    redirectToDashboard,
    checkAuthRedirect,
    apiRequest
  };
})();

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
  AuthConnector.checkAuthRedirect();
  
  // Update any user-specific elements on the page
  if (AuthConnector.isAuthenticated()) {
    const user = AuthConnector.getCurrentUser();
    
    // Update user display name if element exists
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user) {
      userNameElement.textContent = user.name || user.email;
    }
    
    // Update user role if element exists
    const userRoleElement = document.getElementById('user-role');
    if (userRoleElement && user) {
      userRoleElement.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
  }
});