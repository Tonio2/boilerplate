import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
    user: boolean;
    login: () => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

//TODO: Store user in local storage
/* In charge of:
- Managing user state
- Managing local storage
*/
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<boolean>(false);

    useEffect(() => {

        const user = localStorage.getItem("token");
        if (user) {
            setUser(true);
        }
    }, []);

    const login = () => setUser(true);
    const logout = () => {
        setUser(false);
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
