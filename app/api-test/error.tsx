"use client";

import { useEffect } from "react";
import Link from "next/link";

type ApiTestErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function ApiTestError({
    error,
    reset,
}: ApiTestErrorProps) {
    useEffect(() => {
        if (error) {
            console.error("API test page error:", error.message);

            if (error.digest) {
                console.error("Error digest:", error.digest);
            }
        } else {
            console.error(
                "API test page error: No error object was provided."
            );
        }
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 sm:px-6">
            <section
                role="alert"
                className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10"
            >
                <div
                    aria-hidden="true"
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600"
                >
                    !
                </div>

                <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
                    Unable to Load Products
                </h1>

                <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                    The product service may be temporarily unavailable.
                    Please try again.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={reset}
                        className="min-h-12 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        Back to Home
                    </Link>
                </div>
            </section>
        </main>
    );
}