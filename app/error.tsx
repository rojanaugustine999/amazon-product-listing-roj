"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error for development debugging.
        console.error("Page error:", error);
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 sm:px-6">
            <section
                role="alert"
                className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10"
            >
                <div
                    aria-hidden="true"
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl text-red-600"
                >
                    !
                </div>

                <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
                    Something went wrong
                </h1>

                <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                    We couldn't load this page. Please check your connection
                    and try again.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        <span aria-hidden="true">↻</span>
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        Back to Shopping
                    </Link>
                </div>
            </section>
        </main>
    );
}
