import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@features/auth/hooks/useAuth";
import API from "@shared/services/api";
import { showToast } from "@shared/services/toast";
import { LayoutDashboard, LogOut, Menu, Settings, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
    const { user, loading, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await API.delete("/auth/logout");
            logout();
            showToast("Logout successful", "success");
            setIsOpen(false);
        } catch (error) {
            showToast("Logout failed", "error");
        }
    };

    const getInitials = (email: string) => {
        return email?.slice(0, 2).toUpperCase() || "U";
    };

    return (
        <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/" className="hover:text-primary text-xl font-bold transition-colors">
                    My App
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-4 md:flex">
                    {loading ? (
                        <span className="text-muted-foreground text-sm">Loading...</span>
                    ) : user ? (
                        <>
                            <Button variant="ghost" asChild>
                                <Link to="/dashboard">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Link>
                            </Button>

                            <ModeToggle />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-10 w-10 rounded-full"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {getInitials(user.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm leading-none font-medium">
                                                Account
                                            </p>
                                            <p className="text-muted-foreground text-xs leading-none">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/dashboard" className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings" className="cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="cursor-pointer text-red-600"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <ModeToggle />
                            <Button variant="ghost" asChild>
                                <Link to="/login">Login</Link>
                            </Button>
                            <Button asChild>
                                <Link to="/register">Register</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className="flex items-center gap-2 md:hidden">
                    <ModeToggle />
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px]">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col gap-4">
                                {loading ? (
                                    <span className="text-muted-foreground text-sm">
                                        Loading...
                                    </span>
                                ) : user ? (
                                    <div className="px-4">
                                        <div className="flex items-center gap-3 border-b pb-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {getInitials(user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Account</span>
                                                <span className="text-muted-foreground text-xs">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full">
                                            <Button
                                                variant="ghost"
                                                asChild
                                                className="mt-4 w-full justify-start"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Link to="/dashboard">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    Dashboard
                                                </Link>
                                            </Button>
                                        </div>

                                        <div className="w-full">
                                            <Button
                                                variant="ghost"
                                                asChild
                                                className="w-full justify-start"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Link to="/settings">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Settings
                                                </Link>
                                            </Button>
                                        </div>

                                        <div className="w-full">
                                            <Button
                                                variant="destructive"
                                                className="mt-4 w-full justify-start"
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Logout
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-4">
                                        <div>
                                            <Button
                                                variant="ghost"
                                                asChild
                                                className="w-full justify-start"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Link to="/login">
                                                    <UserIcon className="mr-2 h-4 w-4" />
                                                    Login
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="mt-4">
                                            <Button
                                                asChild
                                                className="w-full"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Link to="/register">Register</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
