import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, User as UserIcon, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";
import API from "@shared/services/api";
import { showToast } from "@shared/services/toast";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/" className="font-bold text-xl hover:text-primary transition-colors">
                    My App
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                    {loading ? (
                        <span className="text-sm text-muted-foreground">Loading...</span>
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
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
                                            <p className="text-sm font-medium leading-none">Account</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="cursor-pointer">
                                            <UserCircle className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/dashboard" className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
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
                <div className="flex md:hidden items-center gap-2">
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
                                    <span className="text-sm text-muted-foreground">Loading...</span>
                                ) : user ? (
                                    <div className="px-4">
                                        <div className="flex items-center gap-3 pb-4 border-b">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {getInitials(user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Account</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>


                                        <div className="w-full"><Button variant="ghost" asChild className="justify-start w-full mt-4" onClick={() => setIsOpen(false)}>
                                            <Link to="/dashboard">
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                Dashboard
                                            </Link>
                                        </Button>
                                        </div>

                                        <div className="w-full"><Button variant="ghost" asChild className="justify-start w-full" onClick={() => setIsOpen(false)}>
                                            <Link to="/profile">
                                                <UserCircle className="mr-2 h-4 w-4" />
                                                Profile
                                            </Link>
                                        </Button>
                                        </div>

                                        <div className="w-full"><Button
                                            variant="destructive"
                                            className="justify-start w-full mt-4"
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
                                            <Button variant="ghost" asChild className="justify-start w-full" onClick={() => setIsOpen(false)}>
                                                <Link to="/login">
                                                    <UserIcon className="mr-2 h-4 w-4" />
                                                    Login
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="mt-4">
                                            <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
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
