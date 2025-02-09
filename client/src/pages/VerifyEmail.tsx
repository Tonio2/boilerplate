import React, { useState, useEffect } from "react";
import API from "../services/api";
import { showToast } from "../services/toast";

interface VerifyEmailResponse {
    message: string;
}

const VerifyEmail = () => {
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const verifyEmail = async () => {
            const token = window.location.pathname.split("/").pop();
            if (!token) {
                showToast("Invalid verification link.", "error");
                return;
            }

            setLoading(true);
            try {
                const { data } = await API.post<VerifyEmailResponse>("/auth/verify-email", { token });
                showToast(data.message, "success");
            } catch (error: any) {
                showToast(error.response?.data?.message || "Email verification failed.", "error");
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, []);

    return (
        <div className="max-w-md mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold text-center">Verify Email</h1>
            {loading && (<div className="text-center">Verifying...</div>)}
        </div>
    );
};

export default VerifyEmail;
