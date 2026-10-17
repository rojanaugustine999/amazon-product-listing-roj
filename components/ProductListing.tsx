
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import PriceFilter from "@/components/PriceFilter";
import SortSelect from "@/components/SortSelect";
import CartButton from "@/components/CartButton";
import Pagination from "@/components/Pagination";

import type { Product } from "@/data/products";
import { useWishlist } from "@/context/WishlistContext";
import { createClient } from "@/lib/supabase/client";

type ProductListingProps = {
    products: Product[];
};

export default function ProductListing({
    products,
}: ProductListingProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { wishlistItems } = useWishlist();

    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        let active = true;

        async function loadUser() {
            try {
                const { data, error } = await supabase.auth.getUser();

                if (!active) return;

                if (error) {
                    setUserEmail(null);
                } else {
                    setUserEmail(data.user?.email ?? null);
                }
            } catch {
                if (active) setUserEmail(null);
            } finally {
                if (active) setAuthLoading(false);
            }
        }

        void loadUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (active) {
                setUserEmail(session?.user?.email ?? null);
                setAuthLoading(false);
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error("Logout failed:", error.message);
                return;
            }

            setUserEmail(null);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setLoggingOut(false);
        }
    };

    const updateSearchParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        if (key !== "page") {
            params.delete("page");
        }

        const query = params.toString();
        router.push(query ? `/?${query}` : "/");
    };

    const searchFromUrl = searchParams.get("search") || "";
    const categoryFromUrl = searchParams.get("category") || "All";
    const priceFromUrl = searchParams.get("price") || "All";
    const sortFromUrl = searchParams.get("sort") || "default";

    const currentPage = Math.max(
        1,
        Number(searchParams.get("page")) || 1
    );

    const productsPerPage = 8;

    const categories = [
        "All",
        ...new Set(products.map((product) => product.category)),
    ];

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchFromUrl.toLowerCase());

        const matchesCategory =
            categoryFromUrl === "All" ||
            product.category === categoryFromUrl;

        const matchesPrice =
            priceFromUrl === "All" ||
            (priceFromUrl === "under-2000" && product.price < 2000) ||
            (priceFromUrl === "2000-3999" &&
                product.price >= 2000 &&
                product.price < 4000) ||
            (priceFromUrl === "4000-plus" && product.price >= 4000);

        return matchesSearch && matchesCategory && matchesPrice;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortFromUrl) {
            case "price-low":
                return a.price - b.price;
            case "price-high":
                return b.price - a.price;
            case "name-az":
                return a.name.localeCompare(b.name);
            case "name-za":
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });

    const totalPages = Math.ceil(
        sortedProducts.length / productsPerPage
    );

    const safePage =
        totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

    const startIndex = (safePage - 1) * productsPerPage;

    const paginatedProducts = sortedProducts.slice(
        startIndex,
        startIndex + productsPerPage
    );

    return (
        <main className="min-h-screen overflow-x-hidden bg-gray-50">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                {/* Header and customer authentication */}
                <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/"
                        className="w-fit text-2xl font-bold leading-tight text-gray-950 sm:text-3xl"
                    >
                        Amazon Product Listing
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {!authLoading && (
                            userEmail ? (
                                <>
                                    <Link
                                        href="/account"
                                        className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100 sm:px-4"
                                    >
                                        My Account
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                                    >
                                        {loggingOut ? "Logging out..." : "Logout"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100 sm:px-4"
                                    >
                                        Login
                                    </Link>

                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center rounded-full bg-black px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 sm:px-4"
                                    >
                                        Register
                                    </Link>
                                </>
                            )
                        )}

                        <Link
                            href="/wishlist"
                            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-red-300 hover:bg-red-50 sm:px-4"
                        >
                            <span className="text-lg leading-none text-red-600">
                                ♥
                            </span>

                            <span>Wishlist</span>

                            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                                {wishlistItems.length}
                            </span>
                        </Link>

                        <div className="shrink-0">
                            <CartButton />
                        </div>
                    </div>
                </header>

                {/* Search */}
                <div className="mb-5 sm:mb-6">
                    <SearchBar
                        search={searchFromUrl}
                        setSearch={(value: string) =>
                            updateSearchParams("search", value)
                        }
                    />
                </div>

                {/* Category, price, and sorting controls */}
                <div className="mb-6 flex min-w-0 flex-col gap-5 sm:mb-8 sm:gap-6">
                    <CategoryFilter
                        categories={categories}
                        selectedCategory={categoryFromUrl}
                        onCategoryChange={(value: string) =>
                            updateSearchParams(
                                "category",
                                value === "All" ? "" : value
                            )
                        }
                    />

                    <PriceFilter
                        selectedPrice={priceFromUrl}
                        onPriceChange={(value: string) => {
                            const priceValue =
                                value === "All"
                                    ? ""
                                    : value === "Under ₹2000"
                                        ? "under-2000"
                                        : value === "₹2000 - ₹3999"
                                            ? "2000-3999"
                                            : "4000-plus";

                            updateSearchParams("price", priceValue);
                        }}
                    />

                    <SortSelect
                        sortBy={sortFromUrl}
                        onSortChange={(value: string) =>
                            updateSearchParams("sort", value)
                        }
                    />
                </div>

                {/* Responsive product grid */}
                {paginatedProducts.length > 0 ? (
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                        {paginatedProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center">
                        <p className="text-lg font-semibold text-gray-800">
                            No products found
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                            Try another search or change your filters.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                    <Pagination
                        currentPage={safePage}
                        totalPages={totalPages}
                        onPageChange={(page: number) =>
                            updateSearchParams("page", String(page))
                        }
                    />
                </div>
            </div>
        </main>
    );
}
