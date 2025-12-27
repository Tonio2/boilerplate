import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import API from "@shared/services/api";
import { User } from "@shared/types/user";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* In charge of:
- Managing user state
- Verifying authentication on app load
- Persisting user info in localStorage (authentication is managed via httpOnly cookies)
*/
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const storedUser = localStorage.getItem("user");

            // If we have stored user data, verify it with the server
            if (storedUser) {
                try {
                    const { data } = await API.get("/auth/me");
                    // Update with fresh user data from server
                    setUser(data.user);
                    localStorage.setItem("user", JSON.stringify(data.user));
                } catch (error) {
                    // If verification fails (expired cookies, etc.), clear state
                    console.error("Auth verification failed:", error);
                    setUser(null);
                    localStorage.removeItem("user");
                }
            }

            setLoading(false);
        };

        verifyAuth();
    }, []);

    const login = (user: User) => {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
