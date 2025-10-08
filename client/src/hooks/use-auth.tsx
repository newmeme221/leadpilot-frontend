import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define user types locally
export type SelectUser = {
  id: number;
  email: string;
  role?: string;
  subscription_tier?: string;
};

export type InsertUser = {
  email: string;
  password: string;
  subscriptionTier?: string;
};

type LoginData = Pick<InsertUser, "email" | "password">;

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  logout: () => Promise<void>;
};

// Use undefined as initial value instead of null for stricter typing
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<any, Error>({
    queryKey: [`${apiUrl}/user`],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", `${apiUrl}/login`, credentials);
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Login successful",
        description: "You are logged in",
        variant: "default",
      });
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ["/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", `${apiUrl}/register`, credentials);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You can now log in",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ✅ Add logout handler
  const logout = async () => {
    try {
      localStorage.removeItem("access_token");
      queryClient.removeQueries({ queryKey: [`${apiUrl}/user`] });
      await refetchUser(); // Ensures user is null
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
