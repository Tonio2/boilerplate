import { ArrowLeft, FileQuestion, Home, Search } from "lucide-react";
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

const NotFound = () => {
    return (
        <div className="from-background to-muted flex flex-1 items-center justify-center bg-gradient-to-br p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4 pt-8">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="bg-primary/20 absolute inset-0 rounded-full blur-3xl" />
                            <FileQuestion
                                className="text-primary relative mx-auto h-24 w-24"
                                strokeWidth={1.5}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-6xl font-bold tracking-tight">404</CardTitle>
                        <CardDescription className="text-xl">Page Not Found</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        Oops! The page you're looking for doesn't exist. It might have been moved or
                        deleted.
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
