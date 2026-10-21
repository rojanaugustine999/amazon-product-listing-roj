"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleResetPassword = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setMessage("");
        setError("");

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (!/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/[0-9]/.test(password)) {
            setError(
                "Include at least one uppercase letter, one lowercase letter, and one number."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError || !userData.user) {
                setError(
                    "Your reset link is invalid or expired. Please request a new password reset email."
                );
                return;
            }

            const { error: updateError } =
                await supabase.auth.updateUser({ password });

            if (updateError) {
                setError(updateError.message);
                return;
            }

            setMessage(
                "Password updated successfully! Redirecting you to login..."
            );

            window.setTimeout(() => {
                router.replace("/login");
            }, 2000);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md sm:p-8">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">
                    Reset Password
                </h1>

                <p className="mb-6 text-sm text-gray-600">
                    Enter your new password below.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            New password
                        </label>

                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={8}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="Enter new password"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Confirm new password
                        </label>

                        <input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            autoComplete="new-password"
                            required
                            minLength={8}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(event) =>
                                setShowPassword(event.target.checked)
                            }
                        />
                        Show password
                    </label>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    {message && (
                        <p
                            role="status"
                            className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                        >
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-gray-900 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Updating password..." : "Update password"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-gray-600">
                    Remember your password?{" "}
                    <a
                        href="/login"
                        className="font-medium text-blue-600 hover:underline"
                    >
                        Back to login
                    </a>
                </p>
            </div>
        </main>
    );
}