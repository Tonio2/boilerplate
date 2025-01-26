import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "../interfaces";

interface AuthContextType {
    user: User | null;
    login: (user: User, token: string) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

//TODO: Store user in local storage
/* In charge of:
- Managing user state
- Managing local storage
*/
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const user = localStorage.getItem("user");

        if (user) {
            setUser(JSON.parse(user));
        }
    }, []);

    const login = (user: User, token: string) => {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
