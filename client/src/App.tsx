import { Suspense, lazy } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider, ProtectedRoute, useAuth } from "@features/auth";

import Footer from "@shared/components/Footer";
import LoadingSpinner from "@shared/components/LoadingSpinner";
import Navbar from "@shared/components/Navbar";

// Lazy-loaded components
const Home = lazy(() => import("@features/home").then((m) => ({ default: m.Home })));
const Login = lazy(() => import("@features/auth").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("@features/auth").then((m) => ({ default: m.Register })));
const VerifyEmail = lazy(() => import("@features/auth").then((m) => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() =>
    import("@features/auth").then((m) => ({ default: m.ForgotPassword }))
);
const ResetPassword = lazy(() =>
    import("@features/auth").then((m) => ({ default: m.ResetPassword }))
);
const Dashboard = lazy(() => import("@features/dashboard").then((m) => ({ default: m.Dashboard })));
const Settings = lazy(() => import("@/features/settings").then((m) => ({ default: m.Settings })));
const PrivacyPolicy = lazy(() =>
    import("@features/legal").then((m) => ({ default: m.PrivacyPolicy }))
);
const TermsOfService = lazy(() =>
    import("@features/legal").then((m) => ({ default: m.TermsOfService }))
);
const NotFound = lazy(() => import("@features/error").then((m) => ({ default: m.NotFound })));

const AppContent = () => {
    const { loading } = useAuth();

    // Show loading spinner while verifying authentication
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            <Footer />
            <Toaster />
        </div>
    );
};

const App = () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    </ThemeProvider>
);

export default App;
