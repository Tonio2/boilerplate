import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "@shared/services/api";
import { showToast } from "@shared/services/toast";


const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic client-side validation
        if (formData.password !== formData.confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        setLoading(true);
        try {
            const { email, password } = formData;
            await API.post("/auth/register", { email, password });
            showToast("Registration successful! Please check your email to verify your account.", "success");
            navigate("/login");
        } catch (error: any) {
            // Error is handled by API interceptor
            console.error("Registration failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold text-center">Register</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <label htmlFor="email" className="block font-medium mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded"
                        placeholder="example@email.com"
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block font-medium mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Enter your password"
                    />
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="block font-medium mb-1">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Confirm your password"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
};

export default Register;
