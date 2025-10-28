import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Mail,
    Shield,
    CheckCircle2,
    XCircle,
    Send,
    Download,
    Trash2,
    Loader2,
    AlertTriangle,
    User as UserIcon,
} from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";
import API from "@shared/services/api";
import { showToast } from "@shared/services/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Settings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isResendingVerification, setIsResendingVerification] = useState(false);
    const [isExportingData, setIsExportingData] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [confirmDeletion, setConfirmDeletion] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Assuming user has emailVerified property - adjust based on your User interface
    const isEmailVerified = (user as any)?.isEmailVerified ?? true;

    const handleResendVerification = async () => {
        setIsResendingVerification(true);
        try {
            await API.post("/auth/resend-verification");
            showToast("Verification email sent! Please check your inbox.", "success");
        } catch (error: any) {
            console.error("Failed to resend verification email:", error);
        } finally {
            setIsResendingVerification(false);
        }
    };

    const handleExportData = async () => {
        setIsExportingData(true);
        try {
            const response = await API.get("/auth/export-data", {
                responseType: "blob",
            });

            // Create a download link
            console.log(response.data);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `my-data-${new Date().toISOString().split("T")[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast("Your data has been exported successfully!", "success");
        } catch (error: any) {
            console.error("Failed to export data:", error);
            showToast(
                error.response?.data?.message || "Failed to export data. Please try again.",
                "error"
            );
        } finally {
            setIsExportingData(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showToast("Please enter your password to confirm deletion.", "error");
            return;
        }

        if (!confirmDeletion) {
            showToast("Please confirm that you want to delete your account.", "error");
            return;
        }

        setIsDeletingAccount(true);
        try {
            await API.delete("/auth/delete-account", {
                data: {
                    password: deletePassword,
                    confirmDeletion: confirmDeletion,
                },
            });
            showToast("Your account has been deleted successfully.", "success");
            logout();
            navigate("/");
        } catch (error: any) {
            console.error("Failed to delete account:", error);
            showToast(
                error.response?.data?.message || "Failed to delete account. Please try again.",
                "error"
            );
            setIsDeletingAccount(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        setShowDeleteDialog(false);
        setDeletePassword("");
        setConfirmDeletion(false);
    };

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto max-w-4xl space-y-6 p-4 py-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Email Verification Alert */}
            {!isEmailVerified && (
                <Alert variant="destructive">
                    <AlertDescription className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <p>
                                Your email address is not verified. Please verify your email to
                                access all features.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={isResendingVerification}
                            className="ml-4"
                        >
                            {isResendingVerification ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-3 w-3" />
                                    Resend
                                </>
                            )}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Account Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        Account Information
                    </CardTitle>
                    <CardDescription>Your personal account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Email Address</p>
                            <div className="flex items-center gap-2">
                                <Mail className="text-muted-foreground h-4 w-4" />
                                <p className="text-muted-foreground text-sm">{user.email}</p>
                                {isEmailVerified ? (
                                    <Badge variant="default" className="gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Not Verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Account Role</p>
                            <div className="flex items-center gap-2">
                                <Shield className="text-muted-foreground h-4 w-4" />
                                <p className="text-muted-foreground text-sm capitalize">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
                <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                    <CardDescription>Manage your data and privacy settings (GDPR)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Export Your Data</p>
                            <p className="text-muted-foreground text-sm">
                                Download a copy of all your data in JSON format
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleExportData}
                            disabled={isExportingData}
                        >
                            {isExportingData ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Data
                                </>
                            )}
                        </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                        <div className="space-y-1">
                            <p className="text-destructive text-sm font-medium">Delete Account</p>
                            <p className="text-muted-foreground text-sm">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeletingAccount}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete
                                        your account and remove all your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="delete-password">
                                            Confirm your password
                                        </Label>
                                        <Input
                                            id="delete-password"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            disabled={isDeletingAccount}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="confirm-deletion"
                                            checked={confirmDeletion}
                                            onCheckedChange={(checked: boolean) =>
                                                setConfirmDeletion(checked)
                                            }
                                            disabled={isDeletingAccount}
                                        />
                                        <Label
                                            htmlFor="confirm-deletion"
                                            className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            I understand that this action cannot be undone
                                        </Label>
                                    </div>
                                </div>

                                <AlertDialogFooter>
                                    <AlertDialogCancel
                                        onClick={handleCloseDeleteDialog}
                                        disabled={isDeletingAccount}
                                    >
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={
                                            isDeletingAccount || !deletePassword || !confirmDeletion
                                        }
                                    >
                                        {isDeletingAccount ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            "Delete Account"
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
