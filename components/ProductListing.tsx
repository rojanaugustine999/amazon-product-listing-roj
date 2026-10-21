
"use client";

import {
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import PriceFilter from "@/components/PriceFilter";
import SortSelect from "@/components/SortSelect";
import Pagination from "@/components/Pagination";

import type { Product } from "@/data/products";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "@/context/SidebarContext";

type ProductListingProps = {
    products: Product[];
};

type SupabaseProduct = {
    id: number;
    name: string;
    category: string;
    price: number | string;
    original_price: number | string;
    rating: number | string;
    reviews: number;
    image: string;
};

const PRODUCTS_PER_PAGE = 8;

function ProductListingContent({ products }: ProductListingProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Shared sidebar state controlled by the Navbar.
    const {
        sidebarExpanded,
        mobileFiltersOpen,
        setMobileFiltersOpen,
    } = useSidebar();

    const [storeProducts, setStoreProducts] = useState<Product[]>(products);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);

    const [categoryExpanded, setCategoryExpanded] = useState(true);
    const [priceExpanded, setPriceExpanded] = useState(true);
    const [sortExpanded, setSortExpanded] = useState(true);

    // Load products from Supabase.
    const loadStoreProducts = useCallback(async () => {
        setProductsLoading(true);
        setProductsError(null);

        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("products")
                .select(
                    "id, name, category, price, original_price, rating, reviews, image"
                )
                .order("id", { ascending: true });

            if (error) {
                throw error;
            }

            const mappedProducts: Product[] = (
                (data ?? []) as SupabaseProduct[]
            ).map((item) => ({
                id: Number(item.id),
                name: item.name,
                category: item.category,
                price: Number(item.price),
                originalPrice: Number(item.original_price),
                rating: Number(item.rating),
                reviews: Number(item.reviews),
                image: item.image,
            }));

            setStoreProducts(mappedProducts);
        } catch (error) {
            console.error("Failed to load storefront products:", error);

            setProductsError(
                "Unable to refresh products from Supabase. Showing the existing product list."
            );
        } finally {
            setProductsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadStoreProducts();
    }, [loadStoreProducts]);

    // Keep filters in the URL so refresh and browser navigation work.
    const updateSearchParams = useCallback(
        (key: string, value: string) => {
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
        },
        [router, searchParams]
    );

    // Clear search, category, price, sort, and pagination.
    const clearFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        ["search", "category", "price", "sort", "page"].forEach((key) => {
            params.delete(key);
        });

        const query = params.toString();
        router.push(query ? `/?${query}` : "/");
        setMobileFiltersOpen(false);
    }, [router, searchParams, setMobileFiltersOpen]);

    const searchFromUrl = searchParams.get("search") || "";
    const categoryFromUrl = searchParams.get("category") || "All";
    const priceFromUrl = searchParams.get("price") || "All";
    const sortFromUrl = searchParams.get("sort") || "default";

    const requestedPage = Number(searchParams.get("page") || "1");

    const currentPage =
        Number.isFinite(requestedPage) && requestedPage >= 1
            ? Math.floor(requestedPage)
            : 1;

    const categories = useMemo(
        () => [
            "All",
            ...new Set(storeProducts.map((product) => product.category)),
        ],
        [storeProducts]
    );

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchFromUrl.trim().toLowerCase();

        return storeProducts.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(normalizedSearch) ||
                product.category.toLowerCase().includes(normalizedSearch);

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
    }, [storeProducts, searchFromUrl, categoryFromUrl, priceFromUrl]);

    const sortedProducts = useMemo(() => {
        const result = [...filteredProducts];

        switch (sortFromUrl) {
            case "price-low":
                return result.sort((a, b) => a.price - b.price);

            case "price-high":
                return result.sort((a, b) => b.price - a.price);

            case "name-az":
                return result.sort((a, b) => a.name.localeCompare(b.name));

            case "name-za":
                return result.sort((a, b) => b.name.localeCompare(a.name));

            default:
                return result;
        }
    }, [filteredProducts, sortFromUrl]);

    const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);

    const safePage =
        totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

    // Correct an invalid page after filters change.
    useEffect(() => {
        if (currentPage !== safePage) {
            updateSearchParams("page", safePage > 1 ? String(safePage) : "");
        }
    }, [currentPage, safePage, updateSearchParams]);

    const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE;

    const paginatedProducts = sortedProducts.slice(
        startIndex,
        startIndex + PRODUCTS_PER_PAGE
    );

    const activeFilterCount =
        Number(categoryFromUrl !== "All") +
        Number(priceFromUrl !== "All") +
        Number(sortFromUrl !== "default");

    const selectedPrice =
        priceFromUrl === "under-2000"
            ? "Under ₹2000"
            : priceFromUrl === "2000-3999"
                ? "₹2000 - ₹3999"
                : priceFromUrl === "4000-plus"
                    ? "₹4000+"
                    : "All";

    const filterPanel = (
        <div className="space-y-0">
            <div className="flex items-center justify-between gap-3 pb-4">
                <h2 className="text-base font-bold text-gray-950">Filters</h2>

                <button
                    type="button"
                    onClick={clearFilters}
                    className="shrink-0 text-xs font-semibold text-gray-600 underline underline-offset-2 hover:text-black"
                >
                    Clear all
                </button>
            </div>

            {/* Category filter */}
            <section className="border-t border-gray-200 py-4">
                <button
                    type="button"
                    onClick={() => setCategoryExpanded((value) => !value)}
                    aria-expanded={categoryExpanded}
                    className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-gray-900"
                >
                    <span>Category</span>
                    <span aria-hidden="true">
                        {categoryExpanded ? "−" : "+"}
                    </span>
                </button>

                {categoryExpanded && (
                    <div className="mt-3 min-w-0">
                        <CategoryFilter
                            categories={categories}
                            selectedCategory={categoryFromUrl}
                            onCategoryChange={(value) => {
                                updateSearchParams(
                                    "category",
                                    value === "All" ? "" : value
                                );
                                setMobileFiltersOpen(false);
                            }}
                        />
                    </div>
                )}
            </section>

            {/* Price filter */}
            <section className="border-t border-gray-200 py-4">
                <button
                    type="button"
                    onClick={() => setPriceExpanded((value) => !value)}
                    aria-expanded={priceExpanded}
                    className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-gray-900"
                >
                    <span>Price</span>
                    <span aria-hidden="true">
                        {priceExpanded ? "−" : "+"}
                    </span>
                </button>

                {priceExpanded && (
                    <div className="mt-3 min-w-0 [&>div>h2]:hidden">
                        <PriceFilter
                            selectedPrice={selectedPrice}
                            onPriceChange={(value) => {
                                const priceValue =
                                    value === "All"
                                        ? ""
                                        : value === "Under ₹2000"
                                            ? "under-2000"
                                            : value === "₹2000 - ₹3999"
                                                ? "2000-3999"
                                                : "4000-plus";

                                updateSearchParams("price", priceValue);
                                setMobileFiltersOpen(false);
                            }}
                        />
                    </div>
                )}
            </section>

            {/* Sorting */}
            <section className="border-t border-gray-200 py-4">
                <button
                    type="button"
                    onClick={() => setSortExpanded((value) => !value)}
                    aria-expanded={sortExpanded}
                    className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-gray-900"
                >
                    <span>Sort by</span>
                    <span aria-hidden="true">
                        {sortExpanded ? "−" : "+"}
                    </span>
                </button>

                {sortExpanded && (
                    <div className="mt-3 w-full min-w-0">
                        <SortSelect
                            sortBy={sortFromUrl}
                            onSortChange={(value) => {
                                updateSearchParams(
                                    "sort",
                                    value === "default" ? "" : value
                                );
                                setMobileFiltersOpen(false);
                            }}
                        />
                    </div>
                )}
            </section>
        </div>
    );

    return (
        <main className="min-h-screen overflow-x-clip bg-gray-50">
            <div className="mx-auto w-full max-w-[1800px] px-3 py-5 sm:px-5 lg:px-8">
                {productsLoading && (
                    <p className="mb-4 text-sm text-gray-500" role="status">
                        Refreshing products…
                    </p>
                )}

                {productsError && (
                    <div
                        className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                        role="status"
                    >
                        <p>{productsError}</p>

                        <button
                            type="button"
                            onClick={() => void loadStoreProducts()}
                            className="mt-2 font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Results toolbar */}
                <div className="mb-4 flex items-center justify-between gap-3">
                    <p
                        className="min-w-0 text-sm text-gray-600"
                        aria-live="polite"
                    >
                        {sortedProducts.length}{" "}
                        {sortedProducts.length === 1 ? "product" : "products"}

                        {searchFromUrl && (
                            <>
                                {" "}for{" "}
                                <span className="font-semibold text-gray-900">
                                    “{searchFromUrl}”
                                </span>
                            </>
                        )}
                    </p>

                    <div className="flex shrink-0 items-center gap-2">
                        {activeFilterCount > 0 && (
                            <span className="hidden rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 sm:inline-flex">
                                {activeFilterCount} active
                            </span>
                        )}

                        {/* Mobile shortcut; the header menu also opens this drawer. */}
                        <button
                            type="button"
                            onClick={() => setMobileFiltersOpen(true)}
                            aria-label="Open product filters"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100 lg:hidden"
                        >
                            <span aria-hidden="true">☷</span>
                            Filters

                            {activeFilterCount > 0 && (
                                <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-xs text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Desktop sidebar and product grid */}
                <div className="flex min-w-0 items-start gap-4 xl:gap-5">
                    {sidebarExpanded && (
                        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-56 shrink-0 self-start overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:block xl:w-64 2xl:w-72">
                            {filterPanel}
                        </aside>
                    )}

                    <section className="min-w-0 flex-1">
                        {/* Active filter chips */}
                        {(categoryFromUrl !== "All" ||
                            priceFromUrl !== "All" ||
                            sortFromUrl !== "default") && (
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    {categoryFromUrl !== "All" && (
                                        <button
                                            type="button"
                                            onClick={() => updateSearchParams("category", "")}
                                            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                        >
                                            {categoryFromUrl} ×
                                        </button>
                                    )}

                                    {priceFromUrl !== "All" && (
                                        <button
                                            type="button"
                                            onClick={() => updateSearchParams("price", "")}
                                            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                        >
                                            {selectedPrice} ×
                                        </button>
                                    )}

                                    {sortFromUrl !== "default" && (
                                        <button
                                            type="button"
                                            onClick={() => updateSearchParams("sort", "")}
                                            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                        >
                                            Sort applied ×
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="px-2 py-1.5 text-xs font-semibold text-gray-600 underline hover:text-black"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                        {paginatedProducts.length > 0 ? (
                            <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {paginatedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center">
                                <p className="text-lg font-semibold text-gray-800">
                                    {productsLoading ? "Loading products…" : "No products found"}
                                </p>

                                <p className="mt-2 text-sm text-gray-600">
                                    Try another search or clear your filters.
                                </p>

                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <Pagination
                                    currentPage={safePage}
                                    totalPages={totalPages}
                                    onPageChange={(page: number) =>
                                        updateSearchParams("page", String(page))
                                    }
                                />
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Mobile filter drawer */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <button
                        type="button"
                        aria-label="Close filters"
                        onClick={() => setMobileFiltersOpen(false)}
                        className="absolute inset-0 bg-black/40"
                    />

                    <aside
                        role="dialog"
                        aria-modal="true"
                        aria-label="Product filters"
                        className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col overflow-y-auto overscroll-contain bg-white p-5 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
                            <h2 className="text-lg font-bold text-gray-950">
                                Filters
                            </h2>

                            <button
                                type="button"
                                onClick={() => setMobileFiltersOpen(false)}
                                aria-label="Close filters"
                                className="rounded-lg p-2 text-xl text-gray-600 hover:bg-gray-100"
                            >
                                ×
                            </button>
                        </div>

                        {filterPanel}

                        <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-gray-200 bg-white py-4">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            >
                                Clear all
                            </button>

                            <button
                                type="button"
                                onClick={() => setMobileFiltersOpen(false)}
                                className="flex-1 rounded-lg bg-black px-3 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                View products
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </main>
    );
}

// Suspense prevents useSearchParams() from breaking static prerendering.
export default function ProductListing({
    products,
}: ProductListingProps) {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 px-4 py-8">
                    <div className="mx-auto max-w-7xl animate-pulse" role="status">
                        <div className="mb-6 h-6 w-40 rounded bg-gray-200" />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-80 rounded-xl border border-gray-200 bg-white"
                                />
                            ))}
                        </div>

                        <span className="sr-only">Loading products…</span>
                    </div>
                </main>
            }
        >
            <ProductListingContent products={products} />
        </Suspense>
    );
}
