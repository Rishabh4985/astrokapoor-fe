import { createContext, useContext, useState, useCallback } from "react";

const safeStorage = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.warn(`Failed to get localStorage item ${key}:`, error);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      if (typeof value === "string") {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Failed to save to localStorage ${key}:`, error);
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage item ${key}:`, error);
    }
  },
};

const defaultContextValue = {
  userRole: null,
  authToken: null,
  currentSeller: null,
  setCurrentSeller: () => {},
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
};

/* eslint-disable react-refresh/only-export-components */
export const AuthContext = createContext(defaultContextValue);
AuthContext.displayName = "AuthContext";

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => {
    const role = safeStorage.getItem("role");
    return role && typeof role === "string" ? role : null;
  });

  const [authToken, setAuthToken] = useState(() => {
    const token = safeStorage.getItem("authToken");
    return token && typeof token === "string" ? token : null;
  });

  const [currentSeller, setCurrentSeller] = useState(() => {
    const seller = safeStorage.getItem("currentSeller");
    return seller && typeof seller === "object" ? seller : null;
  });

  const isAuthenticated = !!(userRole && authToken);

  const login = useCallback((role, token, sellerData = null) => {
    try {
      if (!role || !token) {
        console.error("Login failed: Missing role or token");
        return false;
      }

      setUserRole(role);
      setAuthToken(token);

      safeStorage.setItem("role", role);
      safeStorage.setItem("authToken", token);

      if (role === "seller" && sellerData) {
        const normalizedSeller = {
          ...sellerData,
          email: sellerData.email?.toLowerCase?.().trim() || "",
        };
        setCurrentSeller(normalizedSeller);
        safeStorage.setItem("currentSeller", normalizedSeller);
        safeStorage.setItem("isSellerLoggedIn", "true");
      }

      if (role === "admin") {
        safeStorage.setItem("isAdminLoggedIn", "true");
      }

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setUserRole(null);
      setAuthToken(null);
      setCurrentSeller(null);

      const keysToRemove = [
        "role",
        "authToken",
        "currentSeller",
        "isAdminLoggedIn",
        "isSellerLoggedIn",
        "userList",
      ];
      keysToRemove.forEach((key) => safeStorage.removeItem(key));
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  const setCurrentSellerSafe = useCallback((seller) => {
    try {
      if (seller && typeof seller === "object") {
        setCurrentSeller(seller);
        safeStorage.setItem("currentSeller", seller);
      }
    } catch (error) {
      console.error("Failed to set current seller:", error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userRole,
        authToken,
        currentSeller,
        setCurrentSeller: setCurrentSellerSafe,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

/* eslint-disable react-refresh/only-export-components */
export const useAuthRole = (requiredRole) => {
  const { userRole, isAuthenticated } = useAuth();

  return {
    hasRole: isAuthenticated && userRole === requiredRole,
    userRole,
    isAuthenticated,
  };
};
