"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartButton() {
    const { cartCount } = useCart();

    return (
        <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-semibold text-white shadow-md transition hover:bg-gray-800"
        >
            🛒 Cart ({cartCount})
        </Link>
    );
}