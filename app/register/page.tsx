"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [verificationEmail, setVerificationEmail] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setVerificationEmail("");

        const normalizedEmail = email.trim().toLowerCase();

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (!fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { data, error: authError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    data: { full_name: fullName.trim() },
                    emailRedirectTo: `${window.location.origin}/login`,
                },
            });

            if (authError) throw authError;

            if (data.session) {
                router.push("/account");
                router.refresh();
            } else {
                setEmail(normalizedEmail);
                setVerificationEmail(normalizedEmail);
                setSuccess(
                    "Registration submitted. Check your inbox and spam folder, then click the verification link before logging in."
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleResendVerification() {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const supabase = createClient();

            const { error: resendError } =
                await supabase.auth.resend({
                    type: "signup",
                    email: verificationEmail || email.trim().toLowerCase(),
                    options: {
                        emailRedirectTo: `${window.location.origin}/login`,
                    },
                });

            if (resendError) throw resendError;

            setSuccess(
                "If this account needs email verification, a new verification email has been requested. Check your inbox and spam folder."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not resend the verification email. Please try again later."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto max-w-md rounded-xl border bg-white p-8 shadow-sm">
                <Link href="/" className="text-sm text-gray-600 hover:underline">
                    ← Back to shopping
                </Link>

                <h1 className="mt-6 text-3xl font-bold">Create your account</h1>

                <p className="mt-2 text-gray-600">
                    Register to save and track your orders.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label
                            htmlFor="fullName"
                            className="mb-1 block text-sm font-medium"
                        >
                            Full name
                        </label>
                        <input
                            id="fullName"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            autoComplete="name"
                            required
                            maxLength={100}
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1 block text-sm font-medium"
                        >
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                            required
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1 block text-sm font-medium"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            required
                            className="w-full rounded-lg border px-3 py-2"
                            placeholder="At least 8 characters"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    {success && (
                        <p
                            role="status"
                            className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                        >
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                {verificationEmail && (
                    <div className="mt-4 rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-700">
                            Didn't receive the verification email?
                        </p>
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={loading}
                            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-60"
                        >
                            {loading ? "Please wait..." : "Resend verification email"}
                        </button>
                    </div>
                )}

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already registered?{" "}
                    <Link href="/login" className="font-semibold text-black underline">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}