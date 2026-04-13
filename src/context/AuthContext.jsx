import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { jwtDecode } from "jwt-decode";

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
      // Also remove from sessionStorage if exists
      if (key === "sessionAuthToken" || key === "sessionUserRole") {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Failed to remove localStorage item ${key}:`, error);
    }
  },
};

const safeSessionStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get sessionStorage item ${key}:`, error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to save to sessionStorage ${key}:`, error);
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove sessionStorage item ${key}:`, error);
    }
  },
};

const AUTH_LOCAL_KEYS = [
  "userRole",
  "authToken",
  "currentSeller",
  "isAdminLoggedIn",
  "isSellerLoggedIn",
  "userList",
  "user",
];
const AUTH_SESSION_KEYS = ["sessionAuthToken", "sessionUserRole"];

const clearStoredAuthData = () => {
  AUTH_LOCAL_KEYS.forEach((key) => safeStorage.removeItem(key));
  AUTH_SESSION_KEYS.forEach((key) => safeSessionStorage.removeItem(key));
};

const getTokenExpiryMs = (token) => {
  try {
    const decoded = jwtDecode(token);
    if (!decoded || typeof decoded.exp !== "number") return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token || typeof token !== "string") return true;
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return true;
  return Date.now() >= expiryMs;
};

const normalizeSellerData = (sellerData) => {
  if (!sellerData || typeof sellerData !== "object") return null;
  return {
    ...sellerData,
    email: sellerData.email?.toLowerCase?.().trim() || "",
  };
};

/* eslint-disable react-refresh/only-export-components */
export const AuthContext = createContext(undefined);
AuthContext.displayName = "AuthContext";

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    const roleFromSession = safeSessionStorage.getItem("sessionUserRole");
    const tokenFromSession = safeSessionStorage.getItem("sessionAuthToken");

    const roleFromLocal = safeStorage.getItem("userRole");
    const tokenFromLocal = safeStorage.getItem("authToken");
    const storedSeller = safeStorage.getItem("currentSeller");

    const userRole =
      typeof roleFromSession === "string"
        ? roleFromSession
        : typeof roleFromLocal === "string"
          ? roleFromLocal
          : null;

    const authToken =
      typeof tokenFromSession === "string"
        ? tokenFromSession
        : typeof tokenFromLocal === "string"
          ? tokenFromLocal
          : null;

    if (!userRole || !authToken || isTokenExpired(authToken)) {
      clearStoredAuthData();
      return {
        userRole: null,
        authToken: null,
        currentSeller: null,
      };
    }

    return {
      userRole,
      authToken,
      currentSeller:
        userRole === "seller" && storedSeller && typeof storedSeller === "object"
          ? storedSeller
          : null,
    };
  });

  const { userRole, authToken, currentSeller } = authState;

  const isAuthenticated = useMemo(
    () => Boolean(userRole && authToken && !isTokenExpired(authToken)),
    [userRole, authToken],
  );

  const login = useCallback((role, token, sellerData = null) => {
    try {
      if (!role || !token) {
        console.error("Login failed: Missing role or token");
        return false;
      }

      if (isTokenExpired(token)) {
        console.error("Login failed: Token is expired or invalid");
        return false;
      }

      const normalizedSeller = role === "seller" ? normalizeSellerData(sellerData) : null;

      setAuthState({
        userRole: role,
        authToken: token,
        currentSeller: normalizedSeller,
      });

      // Store in sessionStorage for tab isolation
      safeSessionStorage.setItem("sessionAuthToken", token);
      safeSessionStorage.setItem("sessionUserRole", role);

      // Store in localStorage for persistence
      safeStorage.setItem("userRole", role);
      safeStorage.setItem("authToken", token);

      if (role === "seller" && normalizedSeller) {
        safeStorage.setItem("currentSeller", normalizedSeller);
        safeStorage.setItem("isSellerLoggedIn", "true");
        safeStorage.removeItem("isAdminLoggedIn");
      }

      if (role === "admin") {
        safeStorage.setItem("isAdminLoggedIn", "true");
        safeStorage.removeItem("isSellerLoggedIn");
        safeStorage.removeItem("currentSeller");
      }

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setAuthState({
        userRole: null,
        authToken: null,
        currentSeller: null,
      });
      clearStoredAuthData();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!authToken) return;

    if (isTokenExpired(authToken)) {
      logout();
      return;
    }

    const expiryMs = getTokenExpiryMs(authToken);
    if (!expiryMs) {
      logout();
      return;
    }

    const msUntilExpiry = expiryMs - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }

    const timeoutId = setTimeout(() => {
      logout();
    }, msUntilExpiry);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [authToken, logout]);

  const setCurrentSellerSafe = useCallback((seller) => {
    try {
      if (seller && typeof seller === "object") {
        const normalizedSeller = normalizeSellerData(seller);
        setAuthState((prev) => ({
          ...prev,
          currentSeller: normalizedSeller,
        }));
        safeStorage.setItem("currentSeller", normalizedSeller);
      }
    } catch (error) {
      console.error("Failed to set current seller:", error);
    }
  }, []);

  const isAdmin = userRole === "admin";
  const isSeller = userRole === "seller";

  const contextValue = useMemo(
    () => ({
      userRole,
      authToken,
      currentSeller,
      setCurrentSeller: setCurrentSellerSafe,
      login,
      logout,
      isAuthenticated,
      isSeller,
      isAdmin,
    }),
    [
      userRole,
      authToken,
      currentSeller,
      setCurrentSellerSafe,
      login,
      logout,
      isAuthenticated,
      isSeller,
      isAdmin,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
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
