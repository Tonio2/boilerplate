import React from "react";
import { useAuth } from "../hooks/useAuth"; // Adjust the import path as necessary

const Profile = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to My App</h1>
            <p className="text-lg text-gray-600 mb-8">This is your profile page.</p>
            {user && (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                        <p className="text-gray-700">
                            <span className="font-semibold text-gray-800">Email:</span> {user.email}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                        <p className="text-gray-700">
                            <span className="font-semibold text-gray-800">Role:</span> {user.role}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;