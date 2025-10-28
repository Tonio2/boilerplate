import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
