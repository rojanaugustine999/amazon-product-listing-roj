
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { error: resetError } =
                await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

            if (resetError) {
                throw resetError;
            }

            setMessage(
                "If an account exists for this email, you will receive a password reset link shortly. Please check your inbox and spam folder."
            );
        } catch (err) {
            console.error("Password reset request failed:", err);
            setError(
                "We couldn't send the reset request. Please try again in a moment."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
            <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-2xl text-white">
                    🔐
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Forgot Password?
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Enter the email address associated with your account. We&apos;ll send
                    you a link to reset your password.
                </p>

                {message && (
                    <div
                        role="status"
                        className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Email address
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Sending reset link..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-6 border-t border-gray-100 pt-5 text-center">
                    <Link
                        href="/login"
                        className="text-sm font-semibold text-gray-700 hover:text-black hover:underline"
                    >
                        ← Back to Login
                    </Link>
                </div>
            </section>
        </main>
    );
}
