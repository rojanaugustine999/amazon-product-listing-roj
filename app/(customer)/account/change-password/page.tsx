
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function verifySession() {
            try {
                const supabase = createClient();
                const { data, error: authError } =
                    await supabase.auth.getUser();

                if (!active) return;

                if (authError || !data.user) {
                    router.replace(
                        "/login?next=%2Faccount%2Fchange-password"
                    );
                    router.refresh();
                    return;
                }

                setCheckingAuth(false);
            } catch {
                if (active) {
                    router.replace(
                        "/login?next=%2Faccount%2Fchange-password"
                    );
                }
            }
        }

        void verifySession();

        return () => {
            active = false;
        };
    }, [router]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setMessage("");

        if (saving) return;

        if (!currentPassword) {
            setError("Please enter your current password.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Your new password must be at least 8 characters.");
            return;
        }

        if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
            setError(
                "Your new password must contain at least one uppercase and one lowercase letter."
            );
            return;
        }

        if (!/\d/.test(newPassword)) {
            setError("Your new password must contain at least one number.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("The new password and confirmation do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setError("Choose a new password different from your current one.");
            return;
        }

        setSaving(true);

        try {
            const supabase = createClient();

            // Verify the current password before changing it.
            const { data: authData, error: authError } =
                await supabase.auth.getUser();

            if (authError || !authData.user?.email) {
                throw new Error(
                    "Your session could not be verified. Please log in again."
                );
            }

            const { error: verifyError } =
                await supabase.auth.signInWithPassword({
                    email: authData.user.email,
                    password: currentPassword,
                });

            if (verifyError) {
                throw new Error("Your current password is incorrect.");
            }

            // Update the password in Supabase Authentication.
            const { error: updateError } =
                await supabase.auth.updateUser({
                    password: newPassword,
                });

            if (updateError) {
                throw updateError;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setMessage("Your password has been changed successfully.");
        } catch (err) {
            console.error("Failed to change password:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to change your password. Please try again."
            );
        } finally {
            setSaving(false);
        }
    }

    if (checkingAuth) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
                <p className="text-sm text-gray-600">
                    Verifying your account...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/account"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    <span aria-hidden="true">←</span>
                    Back to My Account
                </Link>

                <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                    <div className="mb-7">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-xl text-white">
                            🔐
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                            Change Password
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Update your account password to help keep your account secure.
                        </p>
                    </div>

                    {message && (
                        <div
                            role="status"
                            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                        >
                            {message}
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="current-password"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Current password
                            </label>

                            <div className="flex rounded-xl border border-gray-300 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-200">
                                <input
                                    id="current-password"
                                    type={showCurrentPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={currentPassword}
                                    onChange={(event) =>
                                        setCurrentPassword(event.target.value)
                                    }
                                    className="min-w-0 flex-1 rounded-l-xl px-4 py-3 text-sm outline-none"
                                    placeholder="Enter current password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCurrentPassword((value) => !value)
                                    }
                                    className="px-4 text-sm font-medium text-gray-600 hover:text-gray-900"
                                    aria-label={
                                        showCurrentPassword
                                            ? "Hide current password"
                                            : "Show current password"
                                    }
                                >
                                    {showCurrentPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="new-password"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                New password
                            </label>

                            <div className="flex rounded-xl border border-gray-300 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-200">
                                <input
                                    id="new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    className="min-w-0 flex-1 rounded-l-xl px-4 py-3 text-sm outline-none"
                                    placeholder="Enter new password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword((value) => !value)
                                    }
                                    className="px-4 text-sm font-medium text-gray-600 hover:text-gray-900"
                                    aria-label={
                                        showNewPassword
                                            ? "Hide new password"
                                            : "Show new password"
                                    }
                                >
                                    {showNewPassword ? "Hide" : "Show"}
                                </button>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-gray-500">
                                Use at least 8 characters, including uppercase,
                                lowercase, and a number.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirm-password"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Confirm new password
                            </label>

                            <div className="flex rounded-xl border border-gray-300 focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-200">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    className="min-w-0 flex-1 rounded-l-xl px-4 py-3 text-sm outline-none"
                                    placeholder="Enter new password again"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((value) => !value)
                                    }
                                    className="px-4 text-sm font-medium text-gray-600 hover:text-gray-900"
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide confirmation password"
                                            : "Show confirmation password"
                                    }
                                >
                                    {showConfirmPassword ? "Hide" : "Show"}
                                </button>
                            </div>

                            {confirmPassword.length > 0 && (
                                <p
                                    className={`mt-2 text-xs ${newPassword === confirmPassword
                                        ? "text-green-700"
                                        : "text-red-600"
                                        }`}
                                >
                                    {newPassword === confirmPassword
                                        ? "Passwords match."
                                        : "Passwords do not match yet."}
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm font-semibold text-gray-800">
                                Password checklist
                            </p>

                            <ul className="mt-3 space-y-2 text-sm">
                                <li
                                    className={
                                        newPassword.length >= 8
                                            ? "text-green-700"
                                            : "text-gray-500"
                                    }
                                >
                                    {newPassword.length >= 8 ? "✓" : "○"} At least 8 characters
                                </li>

                                <li
                                    className={
                                        /[A-Z]/.test(newPassword)
                                            ? "text-green-700"
                                            : "text-gray-500"
                                    }
                                >
                                    {/[A-Z]/.test(newPassword) ? "✓" : "○"} One uppercase letter
                                </li>

                                <li
                                    className={
                                        /[a-z]/.test(newPassword)
                                            ? "text-green-700"
                                            : "text-gray-500"
                                    }
                                >
                                    {/[a-z]/.test(newPassword) ? "✓" : "○"} One lowercase letter
                                </li>

                                <li
                                    className={
                                        /\d/.test(newPassword)
                                            ? "text-green-700"
                                            : "text-gray-500"
                                    }
                                >
                                    {/\d/.test(newPassword) ? "✓" : "○"} One number
                                </li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || checkingAuth}
                            className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Updating password..." : "Update Password"}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}
