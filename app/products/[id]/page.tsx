"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import type { Product } from "@/data/products";
import { getProductStock } from "@/lib/stock";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";

type CustomerReview = {
    id: string;
    name: string;
    rating: number;
    date: string;
    comment: string;
};

type SupabaseReview = {
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
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

export default function ProductDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;

    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [reviewerName, setReviewerName] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittedReviews, setSubmittedReviews] = useState<CustomerReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadProduct() {
            if (!id || !/^\d+$/.test(id)) {
                setProduct(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const supabase = createClient();

                const { data, error: queryError } = await supabase
                    .from("products")
                    .select(
                        "id, name, category, price, original_price, rating, reviews, image"
                    )
                    .eq("id", Number(id))
                    .maybeSingle();

                if (queryError) {
                    throw queryError;
                }

                if (!data) {
                    if (active) {
                        setProduct(null);
                    }
                    return;
                }

                const item = data as SupabaseProduct;

                const mappedProduct: Product = {
                    id: Number(item.id),
                    name: item.name,
                    category: item.category,
                    price: Number(item.price),
                    originalPrice: Number(item.original_price),
                    rating: Number(item.rating),
                    reviews: Number(item.reviews),
                    image: item.image,
                };

                if (active) {
                    setProduct(mappedProduct);
                    setQuantity(1);
                }
            } catch (err) {
                console.error("Failed to load product details:", err);

                if (active) {
                    setError(
                        "Unable to load this product. Please try again."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadProduct();

        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        let active = true;

        async function loadReviews() {
            if (!id || !/^\d+$/.test(id)) {
                setSubmittedReviews([]);
                setReviewsLoading(false);
                return;
            }

            setReviewsLoading(true);
            try {
                const supabase = createClient();
                const { data, error: reviewsError } = await supabase
                    .from("product_reviews")
                    .select("id, customer_name, rating, comment, created_at")
                    .eq("product_id", id)
                    .order("created_at", { ascending: false });

                if (reviewsError) throw reviewsError;

                if (active) {
                    const rows = (data ?? []) as SupabaseReview[];
                    setSubmittedReviews(rows.map((review) => ({
                        id: review.id,
                        name: review.customer_name,
                        rating: Number(review.rating),
                        date: new Date(review.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }),
                        comment: review.comment,
                    })));
                }
            } catch (err) {
                console.error("Failed to load product reviews:", err);
                if (active) showToast("Unable to load customer reviews.", "error");
            } finally {
                if (active) setReviewsLoading(false);
            }
        }

        void loadReviews();
        return () => { active = false; };
    }, [id, showToast]);

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
                <div className="text-center" role="status">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
                    <p className="mt-4 text-sm text-gray-600">
                        Loading product details...
                    </p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-[60vh] bg-gray-50 px-4 py-12">
                <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold text-gray-900">
                        Unable to load product
                    </h1>

                    <p className="mt-3 text-sm text-red-700" role="alert">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => router.refresh()}
                        className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800"
                    >
                        Try again
                    </button>

                    <div>
                        <Link
                            href="/"
                            className="mt-4 inline-block text-sm font-medium text-gray-600 underline"
                        >
                            Back to Products
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-bold">Product not found</h1>
                    <Link
                        href="/"
                        className="mt-4 inline-block text-blue-600 hover:underline"
                    >
                        Back to products
                    </Link>
                </div>
            </main>
        );
    }

    const stock = getProductStock(product.id);
    const outOfStock = stock <= 0;
    const saved = isInWishlist(product.id);

    const formatPrice = (price: number) =>
        `₹${price.toLocaleString("en-IN")}`;

    const discount =
        product.originalPrice > product.price
            ? Math.round(
                ((product.originalPrice - product.price) /
                    product.originalPrice) *
                100
            )
            : 0;

    const savings = product.originalPrice - product.price;
    const customerReviewCount = submittedReviews.length;
    const customerAverageRating = customerReviewCount
        ? submittedReviews.reduce((total, review) => total + review.rating, 0) / customerReviewCount
        : 0;

    // FIX 1: Check that product exists before adding it to the cart.
    function handleAddToCart() {
        if (!product) {
            showToast("Product not found.", "error");
            return;
        }

        if (outOfStock) {
            showToast("This product is out of stock!", "error");
            return;
        }

        if (quantity > stock) {
            showToast(`Only ${stock} unit(s) available!`, "error");
            return;
        }

        // CartContext accepts one product per call.
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }

        showToast(
            quantity === 1
                ? "Added to cart!"
                : `${quantity} units added to cart!`,
            "success"
        );
    }

    // FIX 2: Check that product exists before Buy Now.
    function handleBuyNow() {
        if (!product) {
            showToast("Product not found.", "error");
            return;
        }

        if (outOfStock) {
            showToast("This product is out of stock!", "error");
            return;
        }

        if (quantity > stock) {
            showToast(`Only ${stock} unit(s) available!`, "error");
            return;
        }

        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }

        router.push("/cart");
    }

    async function handleSubmitReview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // Capture and validate the product before any asynchronous work.
        // TypeScript can then safely use this stable value after await calls.
        const currentProduct = product;

        if (!currentProduct) {
            showToast("Product not found. Please refresh and try again.", "error");
            return;
        }

        const name = reviewerName.trim();
        const comment = reviewComment.trim();

        if (!name || comment.length < 5) {
            showToast("Enter your name and a review of at least 5 characters.", "error");
            return;
        }

        setReviewSubmitting(true);
        try {
            const supabase = createClient();
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                showToast("Please log in to submit a review.", "error");
                router.push(
                    `/login?next=${encodeURIComponent(
                        `/products/${currentProduct.id}#reviews`
                    )}`
                );
                return;
            }

            const { data, error: insertError } = await supabase
                .from("product_reviews")
                .insert({
                    product_id: String(currentProduct.id),
                    user_id: user.id,
                    customer_name: name,
                    rating: reviewRating,
                    comment,
                })
                .select("id, customer_name, rating, comment, created_at")
                .single();

            if (insertError) throw insertError;

            if (!data) {
                throw new Error("The review was not returned after saving.");
            }

            const savedReview = data as SupabaseReview;
            const newReview: CustomerReview = {
                id: savedReview.id,
                name: savedReview.customer_name,
                rating: Number(savedReview.rating),
                date: new Date(savedReview.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }),
                comment: savedReview.comment,
            };

            setSubmittedReviews((current) => [newReview, ...current]);
            setReviewerName("");
            setReviewRating(5);
            setReviewComment("");
            showToast("Your review was saved successfully!", "success");
        } catch (err) {
            console.error("Failed to submit product review:", err);
            showToast("Could not save your review. Please try again.", "error");
        } finally {
            setReviewSubmitting(false);
        }
    }

    // FIX 3: Check that product exists before changing the wishlist.
    function handleWishlist() {
        if (!product) {
            showToast("Product not found.", "error");
            return;
        }

        toggleWishlist(product);

        showToast(
            saved ? "Removed from wishlist!" : "Added to wishlist!",
            "success"
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-3 py-5 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-7xl">
                {/* Breadcrumbs */}
                <nav
                    aria-label="Breadcrumb"
                    className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500"
                >
                    <Link href="/" className="transition hover:text-black">
                        Home
                    </Link>

                    <span>/</span>

                    <Link
                        href={`/?category=${encodeURIComponent(product.category)}#products`}
                        className="transition hover:text-black"
                    >
                        {product.category}
                    </Link>

                    <span>/</span>

                    <span className="max-w-[220px] truncate font-medium text-gray-900">
                        {product.name}
                    </span>
                </nav>

                {/* Main product panel */}
                <section className="grid overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-2">
                    {/* Product image */}
                    <div className="border-b border-gray-100 p-4 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
                        <div className="relative mx-auto aspect-square w-full max-w-[600px] overflow-hidden rounded-xl bg-gray-50">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                priority
                                sizes="(max-width: 1023px) 100vw, 50vw"
                                className="object-contain p-5 sm:p-8"
                            />

                            {discount > 0 && (
                                <span className="absolute left-4 top-4 rounded-md bg-black px-3 py-1.5 text-xs font-bold text-white">
                                    {discount}% OFF
                                </span>
                            )}
                        </div>

                        <p className="mt-3 text-center text-xs text-gray-500">
                            Product image
                        </p>
                    </div>

                    {/* Product details */}
                    <div className="flex flex-col p-5 sm:p-8 lg:p-10">
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                            {product.category}
                        </p>

                        <h1 className="mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-900">
                                {product.rating}
                            </span>

                            <span
                                className="text-amber-500"
                                aria-label="Rating"
                            >
                                ★★★★★
                            </span>

                            <span className="text-gray-500">
                                ({product.reviews.toLocaleString("en-IN")} reviews)
                            </span>
                        </div>

                        <div className="my-6 border-t border-gray-200" />

                        {/* Pricing */}
                        <p className="text-sm text-gray-500">Price</p>

                        <div className="mt-1 flex flex-wrap items-baseline gap-3">
                            <span className="text-3xl font-extrabold text-gray-950">
                                {formatPrice(product.price)}
                            </span>

                            {product.originalPrice > product.price && (
                                <span className="text-base text-gray-500 line-through">
                                    {formatPrice(product.originalPrice)}
                                </span>
                            )}
                        </div>

                        {discount > 0 && (
                            <p className="mt-1 text-sm font-semibold text-green-700">
                                Save {formatPrice(savings)} ({discount}% off)
                            </p>
                        )}

                        {/* Stock status */}
                        <div className="mt-6 rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${outOfStock
                                        ? "bg-red-500"
                                        : stock <= 3
                                            ? "bg-orange-500"
                                            : "bg-green-600"
                                        }`}
                                />

                                <p
                                    className={`text-sm font-semibold ${outOfStock
                                        ? "text-red-600"
                                        : stock <= 3
                                            ? "text-orange-600"
                                            : "text-green-700"
                                        }`}
                                >
                                    {outOfStock
                                        ? "Out of stock"
                                        : stock <= 3
                                            ? `Only ${stock} left in stock`
                                            : `In stock (${stock} available)`}
                                </p>
                            </div>
                        </div>

                        {/* Quantity selector */}
                        {!outOfStock && (
                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Quantity
                                </label>

                                <div className="inline-flex h-11 items-center overflow-hidden rounded-lg border border-gray-300">
                                    <button
                                        type="button"
                                        aria-label="Decrease quantity"
                                        disabled={quantity <= 1}
                                        onClick={() =>
                                            setQuantity((current) =>
                                                Math.max(1, current - 1)
                                            )
                                        }
                                        className="h-full px-4 text-lg transition hover:bg-gray-100 disabled:opacity-40"
                                    >
                                        −
                                    </button>

                                    <span
                                        aria-live="polite"
                                        className="min-w-12 px-3 text-center text-sm font-semibold"
                                    >
                                        {quantity}
                                    </span>

                                    <button
                                        type="button"
                                        aria-label="Increase quantity"
                                        disabled={quantity >= stock}
                                        onClick={() =>
                                            setQuantity((current) =>
                                                Math.min(stock, current + 1)
                                            )
                                        }
                                        className="h-full px-4 text-lg transition hover:bg-gray-100 disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Cart and Buy Now actions */}
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                disabled={outOfStock}
                                onClick={handleAddToCart}
                                className="min-h-12 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                {outOfStock ? "Out of Stock" : "🛒 Add to Cart"}
                            </button>

                            <button
                                type="button"
                                disabled={outOfStock}
                                onClick={handleBuyNow}
                                className="min-h-12 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Buy Now
                            </button>
                        </div>

                        {/* Wishlist */}
                        <button
                            type="button"
                            onClick={handleWishlist}
                            aria-pressed={saved}
                            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50"
                        >
                            <span
                                className={
                                    saved ? "text-red-600" : "text-gray-700"
                                }
                            >
                                {saved ? "♥" : "♡"}
                            </span>

                            {saved
                                ? "Remove from Wishlist"
                                : "Add to Wishlist"}
                        </button>

                        {/* Delivery and returns */}
                        <div className="mt-6 grid gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <span className="text-xl" aria-hidden="true">
                                    🚚
                                </span>

                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Delivery
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-gray-500">
                                        Delivery options can be confirmed during checkout.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="text-xl" aria-hidden="true">
                                    ↩
                                </span>

                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Returns
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-gray-500">
                                        Check the applicable return policy before ordering.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Customer reviews */}
                <section
                    id="reviews"
                    className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
                >
                    <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Customer feedback
                            </p>
                            <h2 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                                Customer reviews
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Reviews and ratings for {product.name}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 px-5 py-4 sm:min-w-40">
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-extrabold text-gray-900">
                                    {customerReviewCount ? customerAverageRating.toFixed(1) : "—"}
                                </span>
                                <span className="text-xl text-amber-500" aria-label={`${customerReviewCount ? customerAverageRating.toFixed(1) : 0} out of 5 stars`}>
                                    ★★★★★
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Based on {customerReviewCount} customer {customerReviewCount === 1 ? "review" : "reviews"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
                        {/* Review list */}
                        <div>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-bold text-gray-900">
                                    Recent feedback
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {reviewsLoading ? "Loading…" : `${customerReviewCount} saved`}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {submittedReviews.map((review) => (
                                    <article
                                        key={review.id}
                                        className="rounded-xl border border-gray-200 p-4"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {review.name}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {review.date}
                                                </p>
                                            </div>
                                            <span
                                                className="text-sm tracking-wide text-amber-500"
                                                aria-label={`${review.rating} out of 5 stars`}
                                            >
                                                {"★".repeat(review.rating)}
                                                <span className="text-gray-300">
                                                    {"★".repeat(5 - review.rating)}
                                                </span>
                                            </span>
                                        </div>
                                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                            {review.comment}
                                        </p>
                                        <span className="mt-3 inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                            Saved review
                                        </span>
                                    </article>
                                ))}

                                {!reviewsLoading && submittedReviews.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
                                        <p className="font-semibold text-gray-800">No customer reviews yet</p>
                                        <p className="mt-1 text-sm text-gray-500">Be the first to share your experience with this product.</p>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Review form */}
                        <div className="h-fit rounded-xl border border-gray-200 p-4 sm:p-5">
                            <h3 className="text-lg font-bold text-gray-900">
                                Write a review
                            </h3>
                            <p className="mt-1 text-sm leading-5 text-gray-600">
                                Share your feedback about this product.
                            </p>

                            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
                                <div>
                                    <label
                                        htmlFor="reviewer-name"
                                        className="mb-1.5 block text-sm font-semibold text-gray-800"
                                    >
                                        Your name
                                    </label>
                                    <input
                                        id="reviewer-name"
                                        name="reviewerName"
                                        type="text"
                                        required
                                        maxLength={60}
                                        value={reviewerName}
                                        onChange={(event) => setReviewerName(event.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                                    />
                                </div>

                                <fieldset>
                                    <legend className="mb-2 text-sm font-semibold text-gray-800">
                                        Your rating
                                    </legend>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                aria-label={`Rate ${star} out of 5`}
                                                aria-pressed={reviewRating === star}
                                                onClick={() => setReviewRating(star)}
                                                className={`rounded p-1 text-2xl transition focus:outline-none focus:ring-2 focus:ring-gray-300 ${star <= reviewRating
                                                    ? "text-amber-500"
                                                    : "text-gray-300"
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                        <span className="ml-2 text-sm text-gray-600">
                                            {reviewRating}/5
                                        </span>
                                    </div>
                                </fieldset>

                                <div>
                                    <label
                                        htmlFor="review-comment"
                                        className="mb-1.5 block text-sm font-semibold text-gray-800"
                                    >
                                        Your review
                                    </label>
                                    <textarea
                                        id="review-comment"
                                        name="reviewComment"
                                        required
                                        minLength={5}
                                        maxLength={1000}
                                        rows={5}
                                        value={reviewComment}
                                        onChange={(event) => setReviewComment(event.target.value)}
                                        placeholder="What did you like or dislike?"
                                        className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                                    />
                                    <p className="mt-1 text-right text-xs text-gray-500">
                                        {reviewComment.length}/1000
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={reviewSubmitting}
                                    className="w-full rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {reviewSubmitting ? "Saving review…" : "Submit review"}
                                </button>
                            </form>

                            <p className="mt-3 text-xs leading-5 text-gray-500">
                                You must be signed in to submit a review. Reviews are saved to Supabase and remain available after refreshing the page.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Product information */}
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                    <h2 className="text-xl font-bold text-gray-900">
                        Product information
                    </h2>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Product name
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                                {product.name}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Category
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                                {product.category}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Rating
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                                ★ {product.rating} out of 5
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Reviews
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                                {product.reviews.toLocaleString("en-IN")} reviews
                            </p>
                        </div>
                    </div>

                    <Link
                        href={`/?category=${encodeURIComponent(product.category)}#products`}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline underline-offset-4 transition hover:text-gray-600"
                    >
                        Browse more {product.category} products →
                    </Link>
                </section>

                {/* Back to products */}
                <div className="mt-6">
                    <Link
                        href="/#products"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
                    >
                        ← Back to all products
                    </Link>
                </div>
            </div>
        </main>
    );
}