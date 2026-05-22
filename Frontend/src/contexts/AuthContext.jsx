import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'user' or 'partner'
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First try user authentication
        const userResponse = await fetch('http://localhost:3000/api/user/profile', {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const data = await userResponse.json();
          if (data.user) {
            setUser(data.user);
            setUserType('user');
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // If user auth fails, try partner authentication
        const partnerResponse = await fetch('http://localhost:3000/api/food/profile', {
          credentials: 'include'
        });
        
        if (partnerResponse.ok) {
          const data = await partnerResponse.json();
          if (data.success && data.data) {
            setUser(data.data);
            setUserType('partner');
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // If both fail, user is not authenticated
        setUser(null);
        setUserType(null);
        setIsAuthenticated(false);
      } catch (error) {
        console.error('Auth check error:', error);
        // Silently handle errors - user is not authenticated
        setUser(null);
        setUserType(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData, type = 'user') => {
    setUser(userData);
    setUserType(type);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    // Call appropriate backend logout based on user type
    try {
      const logoutEndpoint = userType === 'partner' 
        ? 'http://localhost:3000/api/auth/food-partner/logout'
        : 'http://localhost:3000/api/auth/user/logout';
      
      await fetch(logoutEndpoint, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear user data
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('demoUserId');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, userType, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
