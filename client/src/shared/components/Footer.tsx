import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6 lg:px-8 py-6">
                {/* Legal Links */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
                    <Link
                        to="/privacy-policy"
                        className="hover:text-foreground transition-colors"
                    >
                        Privacy Policy
                    </Link>
                    <span className="hidden md:inline text-muted-foreground/50">•</span>
                    <Link
                        to="/terms-of-service"
                        className="hover:text-foreground transition-colors"
                    >
                        Terms of Service
                    </Link>
                </div>

                {/* Copyright */}
                <div className="text-sm text-muted-foreground">
                    © {currentYear} My App. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
