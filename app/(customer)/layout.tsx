"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CustomerSidebarContextType = {
    collapsed: boolean;
    toggleCollapsed: () => void;
};

const SidebarContext =
    createContext<CustomerSidebarContextType | null>(null);

export function useCustomerSidebar() {
    const context = useContext(SidebarContext);

    if (!context) {
        throw new Error(
            "useCustomerSidebar must be used within the customer layout"
        );
    }

    return context;
}

export default function AccountLayout({
    children,
}: {
    children: ReactNode;
}) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [fullName, setFullName] = useState("");

    const toggleCollapsed = useCallback(() => {
        setCollapsed((current) => !current);
    }, []);

    // Keep the top navbar icon synchronized with the sidebar state.
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("customer-sidebar-state-change", {
                detail: { collapsed },
            })
        );
    }, [collapsed]);

    // Let the top navbar control the customer sidebar.
    useEffect(() => {
        const handleCustomerSidebarToggle = () => {
            setCollapsed((current) => !current);
        };

        window.addEventListener(
            "customer-sidebar-toggle",
            handleCustomerSidebarToggle
        );

        return () => {
            window.removeEventListener(
                "customer-sidebar-toggle",
                handleCustomerSidebarToggle
            );
        };
    }, []);

    // Close the mobile drawer when the route changes.
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Verify authentication and load the customer's profile.
    useEffect(() => {
        let active = true;

        const verifyUser = async () => {
            setCheckingAuth(true);

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    if (active) {
                        router.replace(
                            `/login?next=${encodeURIComponent(pathname)}`
                        );
                    }
                    return;
                }

                const { data: profile, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("full_name, role")
                        .eq("id", user.id)
                        .maybeSingle();

                if (!active) return;

                if (profileError) {
                    console.error(
                        "Could not load customer profile:",
                        profileError.message
                    );
                }

                if (profile?.role === "admin") {
                    router.replace("/admin");
                    return;
                }

                setFullName(profile?.full_name ?? "");
            } catch (error) {
                console.error("Could not verify customer:", error);

                if (active) {
                    router.replace(
                        `/login?next=${encodeURIComponent(pathname)}`
                    );
                }
            } finally {
                if (active) {
                    setCheckingAuth(false);
                }
            }
        };

        void verifyUser();

        return () => {
            active = false;
        };
    }, [pathname, router, supabase]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Logout failed:", error.message);
            return;
        }

        router.replace("/login");
        router.refresh();
    };

    const sidebarWidth = collapsed ? "lg:pl-[76px]" : "lg:pl-64";

    const sidebarLinks = [
        {
            label: "Dashboard",
            href: "/account",
            icon: "▦",
        },
        {
            label: "My Orders",
            href: "/account/orders",
            icon: "▤",
        },
        {
            label: "My Profile",
            href: "/account/profile",
            icon: "♙",
        },
        {
            label: "Wishlist",
            href: "/wishlist",
            icon: "♡",
        },
    ];

    if (checkingAuth) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-600">
                    Checking your account...
                </p>
            </div>
        );
    }

    return (
        <SidebarContext.Provider
            value={{ collapsed, toggleCollapsed }}
        >
            <div className="min-h-screen bg-gray-50">
                {/* Mobile backdrop */}
                {mobileOpen && (
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    />
                )}

                {/* Customer sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${collapsed ? "w-[76px]" : "w-64"
                        } ${mobileOpen
                            ? "translate-x-0"
                            : "-translate-x-full lg:translate-x-0"
                        }`}
                >
                    <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
                        {!collapsed && (
                            <span className="truncate font-bold text-gray-900">
                                My Account
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close sidebar"
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="border-b border-gray-200 px-4 py-4">
                        {!collapsed ? (
                            <>
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {fullName || "Welcome"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Customer account
                                </p>
                            </>
                        ) : (
                            <div
                                className="text-center text-sm font-semibold text-gray-700"
                                title={fullName || "Customer"}
                            >
                                {(fullName || "C")
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        )}
                    </div>

                    <nav
                        aria-label="Customer navigation"
                        className="flex-1 space-y-1 overflow-y-auto p-3"
                    >
                        {sidebarLinks.map((item) => {
                            const active =
                                item.href === "/account"
                                    ? pathname === "/account"
                                    : pathname === item.href ||
                                    pathname.startsWith(
                                        `${item.href}/`
                                    );

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={
                                        collapsed ? item.label : undefined
                                    }
                                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${active
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <span className="w-5 shrink-0 text-center text-lg">
                                        {item.icon}
                                    </span>

                                    {!collapsed && (
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="space-y-2 border-t border-gray-200 p-3">
                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            className="hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm text-gray-700 transition hover:bg-gray-100 lg:flex"
                            title={
                                collapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                        >
                            <span aria-hidden="true">
                                {collapsed ? "⇥" : "⇤"}
                            </span>

                            {!collapsed && (
                                <span>Collapse sidebar</span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title={collapsed ? "Logout" : undefined}
                            className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                            <span aria-hidden="true">↪</span>

                            {!collapsed && <span>Logout</span>}
                        </button>
                    </div>
                </aside>

                {/* Customer page content */}
                <div
                    className={`min-h-screen transition-all duration-200 ${sidebarWidth}`}
                >
                    {/* Mobile sidebar trigger */}
                    <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open customer navigation"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-100"
                        >
                            ☰
                        </button>

                        <span className="font-semibold text-gray-900">
                            My Account
                        </span>
                    </div>

                    <main className="min-w-0 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}