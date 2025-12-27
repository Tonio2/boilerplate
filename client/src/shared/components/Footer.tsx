import { Link } from "react-router-dom";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-background/95 supports-[backdrop-filter]:bg-background/60 mt-auto w-full border-t backdrop-blur">
            <div className="flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row md:px-6 lg:px-8">
                {/* Legal Links */}
                <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-4 text-sm md:gap-6">
                    <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                        Privacy Policy
                    </Link>
                    <span className="text-muted-foreground/50 hidden md:inline">•</span>
                    <Link
                        to="/terms-of-service"
                        className="hover:text-foreground transition-colors"
                    >
                        Terms of Service
                    </Link>
                </div>

                {/* Copyright */}
                <div className="text-muted-foreground text-sm">
                    © {currentYear} My App. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
