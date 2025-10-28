import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
    return (
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4 pt-8">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                            <FileQuestion className="relative h-24 w-24 text-primary mx-auto" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-6xl font-bold tracking-tight">404</CardTitle>
                        <CardDescription className="text-xl">Page Not Found</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pb-8">
                    <Button asChild className="w-full" size="lg">
                        <Link to="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go to Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" size="lg">
                        <Link to="/dashboard">
                            <Search className="mr-2 h-4 w-4" />
                            Go to Dashboard
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full">
                        <Link to="#" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default NotFound;
