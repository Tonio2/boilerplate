import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
    return (
        <div className="flex-1 container max-w-4xl mx-auto p-4 py-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
                <p className="text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Introduction */}
            <Card>
                <CardHeader>
                    <CardTitle>Introduction</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground">
                        [Your Company Name] ("we", "our", or "us") is committed to protecting your privacy.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                        when you use our service.
                    </p>
                </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
                <CardHeader>
                    <CardTitle>Information We Collect</CardTitle>
                    <CardDescription>Types of data we collect from users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Personal Information</h3>
                        <p className="text-sm text-muted-foreground">
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                            <li>Email address</li>
                            <li>Account credentials (encrypted password)</li>
                            <li>Profile information you choose to provide</li>
                        </ul>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-2">Automatically Collected Information</h3>
                        <p className="text-sm text-muted-foreground">
                            When you access our service, we may automatically collect:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                            <li>Log data (IP address, browser type, pages visited)</li>
                            <li>Device information</li>
                            <li>Cookies and similar technologies</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card>
                <CardHeader>
                    <CardTitle>How We Use Your Information</CardTitle>
                    <CardDescription>Purposes for which we process your data</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Provide, maintain, and improve our services</li>
                        <li>Process your transactions and send related information</li>
                        <li>Send you technical notices and support messages</li>
                        <li>Respond to your comments and questions</li>
                        <li>Protect against fraudulent or illegal activity</li>
                        <li>Comply with legal obligations</li>
                    </ul>
                </CardContent>
            </Card>

            {/* Data Storage and Security */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Storage and Security</CardTitle>
                    <CardDescription>How we protect your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        We implement appropriate technical and organizational measures to protect your personal
                        information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Your passwords are encrypted using industry-standard bcrypt hashing. We use secure
                        HTTP-only cookies for session management.
                    </p>
                </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Rights</CardTitle>
                    <CardDescription>GDPR and data protection rights</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                        You have the following rights regarding your personal data:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                        <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                        <li><strong>Right to Erasure:</strong> Request deletion of your account and data</li>
                        <li><strong>Right to Data Portability:</strong> Export your data in a machine-readable format</li>
                        <li><strong>Right to Object:</strong> Object to processing of your data</li>
                        <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                        You can exercise these rights from your account settings page.
                    </p>
                </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
                <CardHeader>
                    <CardTitle>Cookies and Tracking</CardTitle>
                    <CardDescription>How we use cookies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        We use the following types of cookies:
                    </p>
                    <div className="space-y-2">
                        <div>
                            <h4 className="text-sm font-semibold">Strictly Necessary Cookies</h4>
                            <p className="text-sm text-muted-foreground">
                                These cookies are essential for authentication and security. They include access
                                tokens and refresh tokens stored as HTTP-only cookies.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Preference Cookies</h4>
                            <p className="text-sm text-muted-foreground">
                                These cookies remember your preferences such as theme settings (dark/light mode).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Retention</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We retain your personal information for as long as your account is active or as needed
                        to provide you services. You may delete your account at any time from the settings page,
                        which will permanently remove all your data from our servers.
                    </p>
                </CardContent>
            </Card>

            {/* Third-Party Services */}
            <Card>
                <CardHeader>
                    <CardTitle>Third-Party Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        [Customize this section based on your third-party integrations. Examples: analytics
                        services, payment processors, email service providers, etc.]
                    </p>
                </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card>
                <CardHeader>
                    <CardTitle>Children's Privacy</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Our service is not intended for children under the age of 13. We do not knowingly
                        collect personal information from children under 13. If you are a parent or guardian
                        and believe your child has provided us with personal information, please contact us.
                    </p>
                </CardContent>
            </Card>

            {/* Changes to Privacy Policy */}
            <Card>
                <CardHeader>
                    <CardTitle>Changes to This Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We may update this Privacy Policy from time to time. We will notify you of any changes
                        by posting the new Privacy Policy on this page and updating the "Last updated" date.
                    </p>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        If you have any questions about this Privacy Policy, please contact us at:
                    </p>
                    <ul className="list-none text-sm text-muted-foreground mt-2 space-y-1">
                        <li>Email: [your-email@example.com]</li>
                        <li>Address: [Your Company Address]</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default PrivacyPolicy;
