"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MenuItem = {
    label: string;
    href: string;
    icon: string;
};


const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/admin", icon: "▦" },
    { label: "Orders", href: "/admin/orders", icon: "📦" },
    { label: "Products", href: "/admin/products", icon: "🛍️" },
];


const SidebarContext = createContext(false);

export function useAdminSidebar() {
    return useContext(SidebarContext);
}

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [adminName, setAdminName] = useState("Administrator");

    // Keep the top navbar icon and offset synchronized with the admin sidebar state.
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("admin-sidebar-state-change", {
                detail: { collapsed },
            })
        );
    }, [collapsed]);

    // Let the top navbar toggle the admin sidebar.
    useEffect(() => {
        const handleAdminSidebarToggle = () => {
            setCollapsed((current) => !current);
        };

        const handleAdminMobileToggle = () => {
            setMobileOpen((current) => !current);
        };

        window.addEventListener(
            "admin-sidebar-toggle",
            handleAdminSidebarToggle
        );
        window.addEventListener(
            "admin-sidebar-mobile-toggle",
            handleAdminMobileToggle
        );

        return () => {
            window.removeEventListener(
                "admin-sidebar-toggle",
                handleAdminSidebarToggle
            );
            window.removeEventListener(
                "admin-sidebar-mobile-toggle",
                handleAdminMobileToggle
            );
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function checkAdmin() {
            const supabase = createClient();

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    router.replace(
                        `/login?next=${encodeURIComponent(pathname || "/admin")}`
                    );
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("full_name, role")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error("Could not verify admin role:", profileError.message);

                    if (active) {
                        setAuthorized(false);
                        setCheckingAuth(false);
                    }
                    return;
                }

                if (!profile || profile.role !== "admin") {
                    router.replace("/account");
                    return;
                }

                if (active) {
                    setAdminName(profile.full_name || user.email || "Administrator");
                    setAuthorized(true);
                    setCheckingAuth(false);
                }
            } catch (error) {
                console.error("Admin authorization failed:", error);

                if (active) {
                    setAuthorized(false);
                    setCheckingAuth(false);
                }
            }
        }

        setCheckingAuth(true);
        checkAdmin();

        return () => {
            active = false;
        };
    }, [pathname, router]);

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
    }

    const isActive = (href: string) =>
        href === "/admin"
            ? pathname === "/admin"
            : pathname === href || pathname.startsWith(`${href}/`);

    if (checkingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                    <p className="mt-4 text-sm text-gray-600">
                        Verifying administrator access...
                    </p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
                <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="text-3xl">🔒</div>
                    <h1 className="mt-4 text-xl font-bold text-gray-900">
                        Admin access unavailable
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        We could not verify your administrator permissions. Please try
                        again or return to your account.
                    </p>
                    <button
                        onClick={() => router.refresh()}
                        className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        Try again
                    </button>
                    <Link
                        href="/account"
                        className="ml-3 text-sm font-medium text-gray-700 underline"
                    >
                        My account
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <SidebarContext.Provider value={collapsed}>
            <div className="min-h-screen bg-gray-50 text-gray-900">
                {mobileOpen && (
                    <button
                        aria-label="Close sidebar"
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${collapsed ? "w-[76px]" : "w-64"
                        } ${mobileOpen
                            ? "translate-x-0"
                            : "-translate-x-full lg:translate-x-0"
                        }`}
                >
                    <Link
                        href="/admin"
                        className="flex h-[72px] items-center gap-3 border-b border-gray-200 px-5"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-lg font-bold text-white">
                            A
                        </span>
                        {!collapsed && (
                            <span className="text-lg font-bold tracking-tight">
                                Amazon Admin
                            </span>
                        )}
                    </Link>

                    <div className="px-3 py-5">
                        {!collapsed && (
                            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Workspace
                            </p>
                        )}

                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive(item.href)
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg">
                                        {item.icon}
                                    </span>
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto border-t border-gray-200 p-3">
                        <button
                            onClick={() => setCollapsed((value) => !value)}
                            className="hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-600 hover:bg-gray-100 lg:flex"
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <span className="w-6 text-center text-lg">
                                {collapsed ? "»" : "«"}
                            </span>
                            {!collapsed && <span>Collapse sidebar</span>}
                        </button>

                        <Link
                            href="/"
                            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-600 hover:bg-gray-100"
                        >
                            <span className="w-6 text-center text-lg">↗</span>
                            {!collapsed && <span>View storefront</span>}
                        </Link>
                    </div>
                </aside>

                <div
                    className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"
                        }`}
                >
                    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
                                aria-label="Open navigation"
                            >
                                ☰
                            </button>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">

                                    {pathname === "/admin"
                                        ? "Dashboard"
                                        : pathname.startsWith("/admin/orders")
                                            ? "Order Management"
                                            : pathname.startsWith("/admin/products")
                                                ? "Product Management"
                                                : "Administration"}
                                </p>
                                <p className="hidden text-xs text-gray-500 sm:block">
                                    Amazon Product Listing
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="max-w-48 truncate text-sm font-semibold text-gray-900">
                                    {adminName}
                                </p>
                                <p className="text-xs text-green-700">Administrator</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Log out
                            </button>
                        </div>
                    </header>

                    <main className="p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}