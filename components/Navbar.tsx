"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CartButton from "@/components/CartButton";
import { useWishlist } from "@/context/WishlistContext";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { wishlistItems } = useWishlist();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (mounted) {
                setIsLoggedIn(Boolean(user));
                setLoading(false);
            }
        }

        checkUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(Boolean(session?.user));
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    async function handleLogout() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            alert("Unable to log out. Please try again.");
            return;
        }

        setIsLoggedIn(false);
        router.push("/");
        router.refresh();
    }

    const linkClass =
        "inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100 sm:px-4";

    return (
        <header className="border-b border-gray-200 bg-gray-50">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="text-xl font-bold text-gray-900 sm:text-2xl"
                >
                    Amazon Product Listing
                </Link>

                <nav
                    aria-label="Main navigation"
                    className="flex flex-wrap items-center gap-2"
                >
                    {!loading &&
                        (isLoggedIn ? (
                            <>
                                <Link href="/account" className={linkClass}>
                                    My Account
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className={linkClass}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className={linkClass}>
                                    Login
                                </Link>

                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center rounded-full bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 sm:px-4"
                                >
                                    Register
                                </Link>
                            </>
                        ))}

                    <Link
                        href="/wishlist"
                        className={linkClass}
                    >
                        <span className="mr-1 text-red-600">♥</span>
                        Wishlist ({wishlistItems.length})
                    </Link>

                    <CartButton />
                </nav>
            </div>
        </header>
    );
}
