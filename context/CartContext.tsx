"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { Product } from "@/data/products";
import { getProductStock } from "@/lib/stock";
import { useToast } from "@/context/ToastContext";

export type CartItem = Product & {
    quantity: number;
};

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: number) => void;
    increaseQuantity: (productId: number) => void;
    decreaseQuantity: (productId: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { showToast } = useToast();

    // Load and validate the saved cart.
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem("shopping-cart");

            if (savedCart) {
                const parsed: unknown = JSON.parse(savedCart);

                if (Array.isArray(parsed)) {
                    const merged = parsed.reduce<CartItem[]>((result, item) => {
                        if (
                            !item ||
                            typeof item !== "object" ||
                            typeof item.id !== "number" ||
                            typeof item.quantity !== "number" ||
                            !Number.isFinite(item.quantity) ||
                            typeof item.price !== "number"
                        ) {
                            return result;
                        }

                        const stock = getProductStock(item.id);
                        const quantity = Math.min(
                            Math.floor(item.quantity),
                            stock
                        );

                        if (quantity < 1 || stock < 1) {
                            return result;
                        }

                        const existing = result.find(
                            (current) => current.id === item.id
                        );

                        if (existing) {
                            existing.quantity = Math.min(
                                existing.quantity + quantity,
                                stock
                            );
                        } else {
                            result.push({ ...item, quantity } as CartItem);
                        }

                        return result;
                    }, []);

                    setCartItems(merged);
                }
            }
        } catch (error) {
            console.error("Failed to load cart:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save changes after the initial load.
    useEffect(() => {
        if (!isLoaded) return;

        try {
            localStorage.setItem("shopping-cart", JSON.stringify(cartItems));
        } catch (error) {
            console.error("Failed to save cart:", error);
        }
    }, [cartItems, isLoaded]);

    // Add one or more units, checking the latest cart state.
    const addToCart = useCallback(
        (product: Product, quantity = 1) => {
            const requested = Math.floor(quantity);

            if (!Number.isFinite(requested) || requested < 1) {
                showToast("Please select a valid quantity.", "error");
                return;
            }

            const stock = getProductStock(product.id);

            if (stock < 1) {
                showToast("This product is out of stock!", "error");
                return;
            }

            let message = "";

            setCartItems((currentItems) => {
                const existing = currentItems.find(
                    (item) => item.id === product.id
                );
                const currentQuantity = existing?.quantity ?? 0;
                const available = stock - currentQuantity;

                if (available < 1) {
                    message = `Stock limit reached. Only ${stock} available.`;
                    return currentItems;
                }

                if (requested > available) {
                    message = `Only ${available} more unit(s) can be added.`;
                    return currentItems;
                }

                message =
                    requested === 1
                        ? "Added to cart!"
                        : `${requested} units added to cart!`;

                if (existing) {
                    return currentItems.map((item) =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + requested }
                            : item
                    );
                }

                return [...currentItems, { ...product, quantity: requested }];
            });

            // Show success or limit feedback after the state update is scheduled.
            // React applies the functional update using the latest state.
            // The message is updated by the updater above.
            queueMicrotask(() => {
                if (message) {
                    showToast(
                        message,
                        message.startsWith("Added") || message.includes("units added")
                            ? "success"
                            : "error"
                    );
                }
            });
        },
        [showToast]
    );

    const removeFromCart = useCallback((productId: number) => {
        setCartItems((items) =>
            items.filter((item) => item.id !== productId)
        );
    }, []);

    const increaseQuantity = useCallback(
        (productId: number) => {
            let limitReached = false;

            setCartItems((items) =>
                items.map((item) => {
                    if (item.id !== productId) return item;

                    const stock = getProductStock(productId);

                    if (item.quantity >= stock) {
                        limitReached = true;
                        return item;
                    }

                    return { ...item, quantity: item.quantity + 1 };
                })
            );

            // Notify when the requested increment cannot be applied.
            queueMicrotask(() => {
                if (limitReached) {
                    showToast(
                        `Stock limit reached. Only ${getProductStock(productId)} available.`,
                        "error"
                    );
                }
            });
        },
        [showToast]
    );

    const decreaseQuantity = useCallback((productId: number) => {
        setCartItems((items) =>
            items.map((item) =>
                item.id === productId && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const cartCount = useMemo(
        () => cartItems.reduce((total, item) => total + item.quantity, 0),
        [cartItems]
    );

    const cartTotal = useMemo(
        () => cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        ),
        [cartItems]
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                increaseQuantity,
                decreaseQuantity,
                clearCart,
                cartCount,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside CartProvider");
    }

    return context;
}
