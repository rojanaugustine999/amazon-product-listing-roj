
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSidebar } from "@/context/SidebarContext";

type Profile = {
    role: string;
};

export default function Navbar() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const { cartItems } = useCart();
    const { wishlistItems } = useWishlist();

    const {
        sidebarExpanded,
        toggleSidebar,
        toggleMobileFilters,
    } = useSidebar();

    const isCustomerPage =
        pathname === "/account" ||
        pathname.startsWith("/account/") ||
        pathname === "/wishlist";

    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [search, setSearch] = useState("");
    const [customerSidebarCollapsed, setCustomerSidebarCollapsed] =
        useState(false);

    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const wishlistCount = wishlistItems.length;

    // Listen for customer sidebar state changes.
    useEffect(() => {
        const handleSidebarStateChange = (event: Event) => {
            const customEvent =
                event as CustomEvent<{ collapsed: boolean }>;

            if (typeof customEvent.detail?.collapsed === "boolean") {
                setCustomerSidebarCollapsed(
                    customEvent.detail.collapsed
                );
            }
        };

        window.addEventListener(
            "customer-sidebar-state-change",
            handleSidebarStateChange
        );

        return () => {
            window.removeEventListener(
                "customer-sidebar-state-change",
                handleSidebarStateChange
            );
        };
    }, []);

    // Toggle the appropriate sidebar.
    const handleToggleFilters = () => {
        if (isCustomerPage) {
            window.dispatchEvent(
                new Event("customer-sidebar-toggle")
            );
            return;
        }

        if (window.matchMedia("(min-width: 1024px)").matches) {
            toggleSidebar();
        } else {
            toggleMobileFilters();
        }
    };

    // Synchronize search with URL navigation.
    useEffect(() => {
        const syncSearch = () => {
            const params = new URLSearchParams(
                window.location.search
            );
            setSearch(params.get("search") ?? "");
        };

        syncSearch();
        window.addEventListener("popstate", syncSearch);

        return () => {
            window.removeEventListener("popstate", syncSearch);
        };
    }, []);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const params = new URLSearchParams(
            window.location.search
        );
        const trimmedSearch = search.trim();

        if (trimmedSearch) {
            params.set("search", trimmedSearch);
        } else {
            params.delete("search");
        }

        params.delete("page");

        const query = params.toString();
        router.push(query ? `/?${query}` : "/");
    };

    const handleClearSearch = () => {
        setSearch("");

        const params = new URLSearchParams(
            window.location.search
        );
        params.delete("search");
        params.delete("page");

        const query = params.toString();
        router.push(query ? `/?${query}` : "/");
    };

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

    // Load user and listen for authentication changes.
    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            try {
                const {
                    data: { user: currentUser },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    console.error(
                        "Could not load user:",
                        error.message
                    );
                }

                if (!active) return;

                setUser(currentUser);

                if (currentUser) {
                    await loadProfile(currentUser.id);
                } else {
                    setRole(null);
                }
            } catch (error) {
                console.error(
                    "Could not initialize Navbar:",
                    error
                );
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

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error("Logout failed:", error.message);
                return;
            }

            setUser(null);
            setRole(null);
            router.push("/login");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    };

    const menuLabel = isCustomerPage
        ? customerSidebarCollapsed
            ? "Expand customer sidebar"
            : "Collapse customer sidebar"
        : sidebarExpanded
            ? "Collapse product filters"
            : "Expand product filters";

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">

            <nav className="flex min-h-16 w-full flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-5 sm:py-3 lg:flex-nowrap lg:gap-3 lg:px-6">
                {/* Sidebar toggle button */}
                <button
                    type="button"
                    onClick={handleToggleFilters}
                    aria-label={menuLabel}
                    title={menuLabel}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-800 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M9 4v16" />
                        {isCustomerPage ? (
                            customerSidebarCollapsed ? (
                                <path d="m13 9 3 3-3 3" />
                            ) : (
                                <path d="m16 9-3 3 3 3" />
                            )
                        ) : sidebarExpanded ? (
                            <path d="m16 9-3 3 3 3" />
                        ) : (
                            <path d="m13 9 3 3-3 3" />
                        )}
                    </svg>
                </button>

                {/* Amazon logo */}
                <Link
                    href="/"
                    className="shrink-0 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl"
                >
                    Amazon
                </Link>

                {/* Search: second row on mobile, center on desktop */}
                <form
                    onSubmit={handleSearch}
                    role="search"
                    className="order-3 w-full min-w-0 basis-full lg:order-none lg:flex-1"
                >
                    <div className="flex min-w-0 overflow-hidden rounded-xl border border-gray-300 bg-gray-50 transition focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-200">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search products..."
                            aria-label="Search products"
                            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none sm:px-4"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                aria-label="Clear search"
                                className="shrink-0 px-3 text-gray-500 hover:text-gray-900"
                            >
                                ×
                            </button>
                        )}

                        <button
                            type="submit"
                            aria-label="Submit search"
                            className="shrink-0 bg-black px-4 text-white transition hover:bg-gray-800 sm:px-5"
                        >
                            <span aria-hidden="true">⌕</span>
                            <span className="sr-only">Search</span>
                        </button>
                    </div>
                </form>

                {/* Account and shopping actions */}
                <div className="order-2 ml-auto flex max-w-full min-w-0 items-center gap-1 overflow-x-auto pb-0.5 sm:gap-2 lg:order-none lg:ml-0 lg:shrink-0 lg:overflow-visible">
                    {!loading && user && role === "admin" && (
                        <Link
                            href="/admin/orders"
                            className="shrink-0 whitespace-nowrap rounded-full bg-orange-100 px-2 py-2 text-xs font-semibold text-orange-800 transition hover:bg-orange-200 sm:px-3 sm:text-sm"
                        >
                            <span className="sm:hidden">Admin</span>
                            <span className="hidden sm:inline">Admin Orders</span>
                        </Link>
                    )}

                    {!loading && user && (
                        <Link
                            href="/account"
                            className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 sm:px-3 sm:text-sm"
                        >
                            <span className="sm:hidden">Account</span>
                            <span className="hidden sm:inline">My Account</span>
                        </Link>
                    )}

                    {!loading && user && (
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
                        >
                            {loggingOut ? (
                                <span>...</span>
                            ) : (
                                <>
                                    <span className="sm:hidden">Exit</span>
                                    <span className="hidden sm:inline">Logout</span>
                                </>
                            )}
                        </button>
                    )}

                    <Link
                        href="/wishlist"
                        aria-label={`Wishlist, ${wishlistCount} items`}
                        className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 sm:px-3 sm:text-sm"
                    >
                        <span className="text-red-500">♥</span>{" "}
                        <span className="sm:hidden">{wishlistCount}</span>
                        <span className="hidden sm:inline">
                            Wishlist ({wishlistCount})
                        </span>
                    </Link>

                    <Link
                        href="/cart"
                        aria-label={`Cart, ${cartCount} items`}
                        className="shrink-0 whitespace-nowrap rounded-full bg-black px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800 sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                        <span aria-hidden="true">🛒</span>{" "}
                        <span className="sm:hidden">{cartCount}</span>
                        <span className="hidden sm:inline">Cart ({cartCount})</span>
                    </Link>

                    {!loading && !user && (
                        <Link
                            href="/login"
                            className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 sm:text-sm"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </nav>

        </header>
    );
}
