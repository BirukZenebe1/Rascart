import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext();

// Create provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(async (authToken = token, throwOnError = false) => {
    if (!authToken) {
      setUser(null);
      return null;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const response = await axios.get('/api/auth/profile');
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      if (throwOnError) {
        throw error;
      }
      return null;
    }
  }, [token]);

   // Logout function
  const logout = useCallback(() => {
    // Remove token from local storage
    localStorage.removeItem('token');
    
    // Remove token from state and axios headers
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
    
    // Redirect to login page
    navigate('/login');
  }, [navigate]);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          await refreshUser(token, true);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Don't immediately logout on first error
          // This gives the backend a chance to respond if it's just starting up
          if (error.response && error.response.status === 401) {
            logout(); // Only logout on unauthorized responses
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, logout, refreshUser]);

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user_id, username, email } = response.data;
      
      // Save token to local storage
      localStorage.setItem('token', token);
      
      // Set token in state and axios headers
      setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store complete user info
      setUser({ 
        _id: user_id, 
        username, 
        email: email || credentials.email,
        // Add a placeholder created_at if not provided
        created_at: new Date().toISOString()
      });
      
      // Wait a brief moment before returning success
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

 

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
