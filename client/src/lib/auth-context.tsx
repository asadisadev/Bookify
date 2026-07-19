import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AppRole = "customer" | "business" | "staff" | "admin";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isApproved?: boolean;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const getUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return null;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
        // Map role from backend to AppRole
        const roleMap: Record<string, AppRole> = {
          'Customer': 'customer',
          'Professional': 'staff',
          'Admin': 'admin'
        };
        setRoles([roleMap[userData.role] || 'customer']);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRoles([]);
  };

  const refreshUser = async () => {
    const userData = await getUser();
    if (userData) {
      setUser(userData);
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        roles,
        signOut,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("business")) return "business";
  if (roles.includes("staff")) return "staff";
  return "customer";
}

export function dashboardPathForRole(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "business":
      return "/business";
    case "staff":
      return "/business";
    default:
      return "/account";
  }
}