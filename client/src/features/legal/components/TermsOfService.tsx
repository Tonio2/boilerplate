import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const TermsOfService = () => {
    return (
        <div className="flex-1 container max-w-4xl mx-auto p-4 py-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
                <p className="text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Introduction */}
            <Card>
                <CardHeader>
                    <CardTitle>Acceptance of Terms</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground">
                        By accessing and using this service operated by [Your Company Name] ("we", "our", or "us"),
                        you accept and agree to be bound by the terms and provision of this agreement. If you do not
                        agree to these Terms of Service, please do not use our service.
                    </p>
                </CardContent>
            </Card>

            {/* Use of Service */}
            <Card>
                <CardHeader>
                    <CardTitle>Use of Service</CardTitle>
                    <CardDescription>Guidelines for using our platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Permitted Use</h3>
                        <p className="text-sm text-muted-foreground">
                            You may use our service for lawful purposes only. You agree to use the service in
                            compliance with all applicable laws and regulations.
                        </p>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-2">Prohibited Activities</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            You agree not to:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe upon the rights of others</li>
                            <li>Transmit any harmful or malicious code</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with or disrupt the service or servers</li>
                            <li>Use the service for any automated data collection (scraping, bots, etc.)</li>
                            <li>Impersonate any person or entity</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* User Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle>User Accounts</CardTitle>
                    <CardDescription>Account registration and responsibilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        To access certain features of the service, you may be required to create an account.
                        You agree to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Provide accurate and complete registration information</li>
                        <li>Maintain the security of your password and account</li>
                        <li>Notify us immediately of any unauthorized use of your account</li>
                        <li>Be responsible for all activities that occur under your account</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                        We reserve the right to suspend or terminate your account if you violate these terms
                        or engage in fraudulent or illegal activities.
                    </p>
                </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
                <CardHeader>
                    <CardTitle>Intellectual Property Rights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        The service and its original content, features, and functionality are owned by
                        [Your Company Name] and are protected by international copyright, trademark, patent,
                        trade secret, and other intellectual property laws.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        You retain ownership of any content you submit to the service. By submitting content,
                        you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and
                        display such content in connection with the service.
                    </p>
                </CardContent>
            </Card>

            {/* Termination */}
            <Card>
                <CardHeader>
                    <CardTitle>Termination</CardTitle>
                    <CardDescription>Account termination and suspension</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">By You</h4>
                        <p className="text-sm text-muted-foreground">
                            You may terminate your account at any time through the account settings page.
                            Upon termination, your data will be permanently deleted from our servers.
                        </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">By Us</h4>
                        <p className="text-sm text-muted-foreground">
                            We may terminate or suspend your account immediately, without prior notice, if you
                            breach these Terms of Service. Upon termination, your right to use the service will
                            immediately cease.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Disclaimers */}
            <Card>
                <CardHeader>
                    <CardTitle>Disclaimers and Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Service "As Is"</h4>
                        <p className="text-sm text-muted-foreground">
                            The service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties
                            of any kind, either express or implied, including but not limited to warranties of
                            merchantability, fitness for a particular purpose, or non-infringement.
                        </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Limitation of Liability</h4>
                        <p className="text-sm text-muted-foreground">
                            In no event shall [Your Company Name], its directors, employees, or agents be liable
                            for any indirect, incidental, special, consequential, or punitive damages, including
                            without limitation, loss of profits, data, use, or other intangible losses, resulting
                            from your access to or use of or inability to access or use the service.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Indemnification */}
            <Card>
                <CardHeader>
                    <CardTitle>Indemnification</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        You agree to indemnify, defend, and hold harmless [Your Company Name] and its affiliates,
                        officers, directors, employees, and agents from and against any claims, liabilities,
                        damages, losses, and expenses arising out of or in any way connected with your access to
                        or use of the service or your violation of these Terms of Service.
                    </p>
                </CardContent>
            </Card>

            {/* Governing Law */}
            <Card>
                <CardHeader>
                    <CardTitle>Governing Law and Jurisdiction</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        These Terms shall be governed by and construed in accordance with the laws of
                        [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes
                        arising from these terms shall be subject to the exclusive jurisdiction of the courts
                        of [Your Jurisdiction].
                    </p>
                </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card>
                <CardHeader>
                    <CardTitle>Changes to Terms of Service</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We reserve the right to modify or replace these Terms at any time at our sole discretion.
                        We will provide notice of any material changes by posting the new Terms of Service on this
                        page and updating the "Last updated" date. Your continued use of the service after such
                        changes constitutes your acceptance of the new terms.
                    </p>
                </CardContent>
            </Card>

            {/* Severability */}
            <Card>
                <CardHeader>
                    <CardTitle>Severability</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        If any provision of these Terms is held to be unenforceable or invalid, such provision
                        will be changed and interpreted to accomplish the objectives of such provision to the
                        greatest extent possible under applicable law, and the remaining provisions will continue
                        in full force and effect.
                    </p>
                </CardContent>
            </Card>

            {/* Entire Agreement */}
            <Card>
                <CardHeader>
                    <CardTitle>Entire Agreement</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        These Terms of Service, together with our Privacy Policy, constitute the entire agreement
                        between you and [Your Company Name] regarding the use of the service and supersede all
                        prior agreements and understandings.
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
                        If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfService;
