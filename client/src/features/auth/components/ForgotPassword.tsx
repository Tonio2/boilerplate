import { ArrowLeft, Loader2, Mail, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import API from "@shared/services/api";
import { showToast } from "@shared/services/toast";

const ForgotPassword = () => {
    const [email, setEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await API.post("/auth/forgot-password", { email });
            showToast(data.message, "success");
            setEmail(""); // Clear the email field after success
        } catch (error) {
            console.error("Failed to send reset password link:", error);
            showToast("Failed to send reset password link. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="from-background to-muted flex flex-1 items-center justify-center bg-gradient-to-br p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-center text-2xl font-bold">
                        Forgot Password
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your email address and we'll send you a link to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <SendHorizontal className="mr-2 h-4 w-4" />
                                    Send reset link
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button variant="ghost" asChild className="w-full">
                        <Link to="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ForgotPassword;
