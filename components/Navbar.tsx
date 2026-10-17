
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
    }

    return (
        <header className="mx-auto w-full max-w-5xl px-4 py-5">
            <nav className="flex flex-wrap items-center justify-between gap-4">
                <Link href="/" className="text-xl font-bold text-black">
                    Amazon Product Listing
                </Link>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    {user ? (
                        <>
                            <Link
                                href="/account"
                                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
                            >
                                My Account
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
                            >
                                Login
                            </Link>

                            <Link
                                href="/register"
                                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}
