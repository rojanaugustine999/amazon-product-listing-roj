"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

type Profile = {
    role: string;
};

export default function Navbar() {
    const supabase = createClient();
    const router = useRouter();

    // Use the same contexts as the Cart and Wishlist pages.
    const { cartItems } = useCart();
    const { wishlistItems } = useWishlist();

    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    // Total cart quantity, including quantities greater than one.
    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    // Wishlist count is the number of saved products.
    const wishlistCount = wishlistItems.length;

    const loadProfile = useCallback(
        async (userId: string) => {
            const { data, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .maybeSingle();

            if (error) {
                console.error(
                    "Could not load profile role:",
                    error.message
                );
                setRole(null);
                return;
            }

            const profile = data as Profile | null;
            setRole(profile?.role ?? null);
        },
        [supabase]
    );

    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            try {
                const {
                    data: { user: currentUser },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    console.error("Could not load user:", error.message);
                }

                if (!active) return;

                setUser(currentUser);

                if (currentUser) {
                    await loadProfile(currentUser.id);
                } else {
                    setRole(null);
                }
            } catch (error) {
                console.error("Could not initialize Navbar:", error);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return;

            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (!currentUser) {
                setRole(null);
                setLoading(false);
                return;
            }

            // Avoid running the profile query directly inside
            // the Supabase auth callback.
            setTimeout(() => {
                if (active) {
                    void loadProfile(currentUser.id);
                }
            }, 0);

            setLoading(false);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, [supabase, loadProfile]);

    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Logout failed:", error.message);
            setLoggingOut(false);
            return;
        }

        setUser(null);
        setRole(null);
        router.push("/login");
        router.refresh();
        setLoggingOut(false);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
            <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="shrink-0 text-2xl font-bold tracking-tight text-gray-950"
                >
                    Amazon
                </Link>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    {!loading && user && role === "admin" && (
                        <Link
                            href="/admin/orders"
                            className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-200"
                        >
                            Admin Orders
                        </Link>
                    )}

                    {!loading && user && (
                        <Link
                            href="/account"
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                        >
                            My Account
                        </Link>
                    )}

                    {!loading && user && (
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loggingOut ? "Logging out..." : "Logout"}
                        </button>
                    )}

                    <Link
                        href="/wishlist"
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                    >
                        <span className="text-red-500">♥</span>{" "}
                        Wishlist ({wishlistCount})
                    </Link>

                    <Link
                        href="/cart"
                        className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                    >
                        🛒 Cart ({cartCount})
                    </Link>

                    {!loading && !user && (
                        <Link
                            href="/login"
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}