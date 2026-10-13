
"use client";

import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

type AddToCartButtonProps = {
    product: Product;
};

export default function AddToCartButton({
    product,
}: AddToCartButtonProps) {
    const { addToCart } = useCart();

    return (
        <button
            type="button"
            onClick={() => addToCart(product)}
            className="w-full rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
            Add to Cart
        </button>
    );
}
