
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    original_price: number;
    rating: number;
    reviews: number;
    image: string;
};

type ProductForm = {
    name: string;
    category: string;
    price: string;
    original_price: string;
    rating: string;
    reviews: string;
    image: string;
};

const EMPTY_FORM: ProductForm = {
    name: "",
    category: "",
    price: "",
    original_price: "",
    rating: "0",
    reviews: "0",
    image: "",
};

function formatPrice(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value));
}

export default function AdminProductsPage() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formOpen, setFormOpen] = useState(false);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.replace("/login?next=%2Fadmin%2Fproducts");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) {
                throw new Error("Could not verify administrator access.");
            }

            if (profile?.role !== "admin") {
                router.replace("/");
                return;
            }

            const { data, error: productsError } = await supabase
                .from("products")
                .select(
                    "id, name, category, price, original_price, rating, reviews, image"
                )
                .order("id", { ascending: true });

            if (productsError) {
                throw new Error(productsError.message);
            }

            setProducts((data ?? []) as Product[]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load products."
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    function openAddForm() {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setError("");
        setNotice("");
        setFormOpen(true);
    }

    function openEditForm(product: Product) {
        setEditingId(product.id);
        setForm({
            name: product.name,
            category: product.category,
            price: String(product.price),
            original_price: String(product.original_price),
            rating: String(product.rating),
            reviews: String(product.reviews),
            image: product.image,
        });
        setError("");
        setNotice("");
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
    }

    async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setNotice("");

        const price = Number(form.price);
        const originalPrice = Number(form.original_price);
        const rating = Number(form.rating);
        const reviews = Number(form.reviews);

        if (
            !form.name.trim() ||
            !form.category.trim() ||
            !form.image.trim()
        ) {
            setError("Name, category, and image URL are required.");
            return;
        }

        if (
            !Number.isFinite(price) ||
            !Number.isFinite(originalPrice) ||
            price < 0 ||
            originalPrice < 0
        ) {
            setError("Enter valid, non-negative prices.");
            return;
        }

        if (
            !Number.isFinite(rating) ||
            rating < 0 ||
            rating > 5 ||
            !Number.isFinite(reviews) ||
            reviews < 0 ||
            !Number.isInteger(reviews)
        ) {
            setError("Rating must be 0–5 and reviews a non-negative integer.");
            return;
        }

        if (
            !/^https?:\/\/\S+$/i.test(form.image.trim())
        ) {
            setError("Enter a valid image URL starting with http:// or https://.");
            return;
        }

        setSaving(true);

        try {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.replace("/login?next=%2Fadmin%2Fproducts");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError || profile?.role !== "admin") {
                throw new Error("Administrator access is required.");
            }

            const productData = {
                name: form.name.trim(),
                category: form.category.trim(),
                price,
                original_price: originalPrice,
                rating,
                reviews,
                image: form.image.trim(),
                updated_at: new Date().toISOString(),
            };

            if (editingId !== null) {
                const { data, error: updateError } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editingId)
                    .select(
                        "id, name, category, price, original_price, rating, reviews, image"
                    )
                    .maybeSingle();

                if (updateError) {
                    throw new Error(updateError.message);
                }

                if (!data) {
                    throw new Error(
                        "No product was updated. Check your administrator permissions."
                    );
                }

                setProducts((current) =>
                    current.map((product) =>
                        product.id === editingId ? (data as Product) : product
                    )
                );

                setNotice("Product updated successfully.");
            } else {
                const { data, error: insertError } = await supabase
                    .from("products")
                    .insert(productData)
                    .select(
                        "id, name, category, price, original_price, rating, reviews, image"
                    )
                    .single();

                if (insertError) {
                    throw new Error(insertError.message);
                }

                setProducts((current) =>
                    [...current, data as Product].sort((a, b) => a.id - b.id)
                );

                setNotice("Product added successfully.");
            }

            closeForm();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not save the product."
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteProduct(product: Product) {
        const confirmed = window.confirm(
            `Delete "${product.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");
        setDeletingId(product.id);

        try {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.replace("/login?next=%2Fadmin%2Fproducts");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError || profile?.role !== "admin") {
                throw new Error("Administrator access is required.");
            }

            const { data, error: deleteError } = await supabase
                .from("products")
                .delete()
                .eq("id", product.id)
                .select("id")
                .maybeSingle();

            if (deleteError) {
                throw new Error(deleteError.message);
            }

            if (!data) {
                throw new Error(
                    "No product was deleted. Check permissions or whether it still exists."
                );
            }

            setProducts((current) =>
                current.filter((item) => item.id !== product.id)
            );
            setNotice("Product deleted successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not delete the product."
            );
        } finally {
            setDeletingId(null);
        }
    }

    const filteredProducts = products.filter((product) => {
        const query = search.trim().toLowerCase();

        return (
            !query ||
            product.name.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query) ||
            String(product.id).includes(query)
        );
    });

    return (
        <div className="mx-auto max-w-7xl">
            <Link
                href="/admin"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
                ← Back to Dashboard
            </Link>

            <div className="mb-8 mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-medium text-amber-600">
                        PRODUCT MANAGEMENT
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">
                        Products
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Add, edit, and manage your store products.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => void loadProducts()}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>
                    <button
                        type="button"
                        onClick={openAddForm}
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        + Add Product
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total products</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {products.length}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Categories</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {new Set(products.map((product) => product.category)).size}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Search results</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {filteredProducts.length}
                    </p>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                >
                    {notice}
                </div>
            )}

            {formOpen && (
                <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingId === null ? "Add Product" : "Edit Product"}
                        </h2>
                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>

                    <form onSubmit={saveProduct} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Product name *
                                <input
                                    required
                                    maxLength={150}
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({ ...form, name: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                                    placeholder="Wireless Headphones"
                                />
                            </label>

                            <label className="block text-sm font-medium text-gray-700">
                                Category *
                                <input
                                    required
                                    maxLength={80}
                                    value={form.category}
                                    onChange={(event) =>
                                        setForm({ ...form, category: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                                    placeholder="Electronics"
                                />
                            </label>

                            <label className="block text-sm font-medium text-gray-700">
                                Selling price (₹) *
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(event) =>
                                        setForm({ ...form, price: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                                    placeholder="2999"
                                />
                            </label>

                            <label className="block text-sm font-medium text-gray-700">
                                Original price (₹) *
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.original_price}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            original_price: event.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                                    placeholder="3999"
                                />
                            </label>

                            <label className="block text-sm font-medium text-gray-700">
                                Rating (0–5)
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={form.rating}
                                    onChange={(event) =>
                                        setForm({ ...form, rating: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                                />
                            </label>

                            <label className="block text-sm font-medium text-gray-700">
                                Review count
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.reviews}
                                    onChange={(event) =>
                                        setForm({ ...form, reviews: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                                />
                            </label>

                            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                                Image URL *
                                <input
                                    required
                                    type="url"
                                    value={form.image}
                                    onChange={(event) =>
                                        setForm({ ...form, image: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                                    placeholder="https://example.com/product.jpg"
                                />
                            </label>
                        </div>

                        {form.image.trim().startsWith("https://") && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    Image preview
                                </p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={form.image}
                                    alt="Product preview"
                                    className="h-28 w-28 rounded-lg border border-gray-200 object-contain"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : editingId === null
                                    ? "Add Product"
                                    : "Save Changes"}
                        </button>
                    </form>
                </section>
            )}

            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
                <label
                    htmlFor="product-search"
                    className="mb-2 block text-sm font-medium text-gray-700"
                >
                    Search products
                </label>
                <input
                    id="product-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by product name, category, or ID..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
            </div>

            {loading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-600">
                    Loading products...
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                    <p className="text-lg font-bold text-gray-900">
                        No products found
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                        {products.length === 0
                            ? "Add your first product to get started."
                            : "Try a different search term."}
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-4">Product</th>
                                    <th className="px-4 py-4">Category</th>
                                    <th className="px-4 py-4">Price</th>
                                    <th className="px-4 py-4">Rating</th>
                                    <th className="px-4 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-14 w-14 rounded-lg border border-gray-200 bg-white object-contain"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {product.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        ID: {product.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {product.category}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-gray-900">
                                                {formatPrice(product.price)}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500 line-through">
                                                {formatPrice(product.original_price)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            <p>★ {Number(product.rating).toFixed(1)}</p>
                                            <p className="mt-1 text-xs">
                                                {product.reviews} reviews
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(product)}
                                                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void deleteProduct(product)}
                                                    disabled={deletingId === product.id}
                                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    {deletingId === product.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <p className="mt-5 text-sm text-gray-500">
                Showing {filteredProducts.length} of {products.length} products.
            </p>
        </div>
    );
}
