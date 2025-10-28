import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import API from "@shared/services/api";
import { showToast } from "@shared/services/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VerifyEmailResponse {
    message: string;
}

type VerificationState = "loading" | "success" | "error";

const VerifyEmail = () => {
    const [state, setState] = useState<VerificationState>("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        const verifyEmail = async () => {
            const token = window.location.pathname.split("/").pop();

            if (!token) {
                setState("error");
                setMessage("Invalid verification link.");
                showToast("Invalid verification link.", "error");
                return;
            }

            try {
                const { data } = await API.post<VerifyEmailResponse>("/auth/verify-email", { token });
                setState("success");
                setMessage(data.message || "Email verified successfully!");
                showToast(data.message, "success");
            } catch (error: any) {
                setState("error");
                const errorMessage = error.response?.data?.message || "Email verification failed.";
                setMessage(errorMessage);
                showToast(errorMessage, "error");
            }
        };

        verifyEmail();
    }, []);

    return (
        <div className="min-h-[calc(100vh-4rem-1px)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {state === "loading" && "Verifying Email"}
                        {state === "success" && "Email Verified"}
                        {state === "error" && "Verification Failed"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {state === "loading" && "Please wait while we verify your email address"}
                        {state === "success" && "Your email has been successfully verified"}
                        {state === "error" && "We couldn't verify your email address"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center space-y-4">
                    {state === "loading" && (
                        <div className="flex flex-col items-center space-y-4 py-8">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Verifying your email...</p>
                        </div>
                    )}

                    {state === "success" && (
                        <div className="flex flex-col items-center space-y-4 py-8">
                            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
                            </div>
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/50">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                                <AlertDescription className="text-green-800 dark:text-green-400">
                                    {message}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {state === "error" && (
                        <div className="flex flex-col items-center space-y-4 py-8">
                            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                                <XCircle className="h-16 w-16 text-red-600 dark:text-red-500" />
                            </div>
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {message}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                    {state === "success" && (
                        <Button asChild className="w-full">
                            <Link to="/login">
                                Continue to Login
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}

                    {state === "error" && (
                        <div className="w-full space-y-2">
                            <Button asChild variant="default" className="w-full">
                                <Link to="/register">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Register Again
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link to="/">
                                    Go to Home
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default VerifyEmail;
