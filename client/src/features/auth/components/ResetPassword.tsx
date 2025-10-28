import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import API from "@shared/services/api";
import { showToast } from "@shared/services/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const getPasswordStrength = (password: string) => {
        const checks = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };

        return checks;
    };

    const validatePassword = (password: string) => {
        const checks = getPasswordStrength(password);

        if (!checks.minLength) {
            return "Password must be at least 8 characters long.";
        }
        if (!checks.hasUpperCase || !checks.hasLowerCase) {
            return "Password must contain both uppercase and lowercase letters.";
        }
        if (!checks.hasNumber) {
            return "Password must contain at least one number.";
        }
        if (!checks.hasSpecialChar) {
            return "Password must contain at least one special character.";
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            showToast(passwordError, "error");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const { password } = formData;
            const token = window.location.pathname.split("/").pop();
            await API.post("/auth/reset-password", { password, token });
            showToast("Password reset successful!", "success");
            navigate("/login");
        } catch (error: any) {
            console.error("Reset password failed:", error);
            showToast(
                error.response?.data?.message ||
                "Failed to reset password. Please try again.",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const passwordChecks = getPasswordStrength(formData.password);
    const showRequirements = formData.password.length > 0;

    return (
        <div className="min-h-[calc(100vh-4rem-1px)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pl-10 pr-10"
                                    disabled={isLoading}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-8 w-8"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>

                            {/* Password Requirements */}
                            {showRequirements && (
                                <div className="space-y-2 text-xs mt-3">
                                    <p className="text-muted-foreground font-medium">Password must contain:</p>
                                    <div className="space-y-1">
                                        <PasswordRequirement
                                            met={passwordChecks.minLength}
                                            text="At least 8 characters"
                                        />
                                        <PasswordRequirement
                                            met={passwordChecks.hasUpperCase && passwordChecks.hasLowerCase}
                                            text="Uppercase and lowercase letters"
                                        />
                                        <PasswordRequirement
                                            met={passwordChecks.hasNumber}
                                            text="At least one number"
                                        />
                                        <PasswordRequirement
                                            met={passwordChecks.hasSpecialChar}
                                            text="At least one special character"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="pl-10 pr-10"
                                    disabled={isLoading}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-8 w-8"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showConfirmPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

// Helper component for password requirements
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => {
    return (
        <div className={`flex items-center gap-2 ${met ? "text-green-600" : "text-muted-foreground"}`}>
            {met ? (
                <CheckCircle2 className="h-3 w-3" />
            ) : (
                <XCircle className="h-3 w-3" />
            )}
            <span>{text}</span>
        </div>
    );
};

export default ResetPassword;
