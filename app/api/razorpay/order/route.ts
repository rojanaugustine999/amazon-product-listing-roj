
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CheckoutRequest = {
    items: { id: number | string; quantity: number }[];
    paymentMethod: "upi" | "card";
    shipping: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pinCode: string;
    };
};

export async function POST(request: Request) {
    let supabase: Awaited<ReturnType<typeof createClient>> | undefined;
    let createdOrderId: string | undefined;

    try {
        supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Please log in to continue." },
                { status: 401 }
            );
        }

        let body: CheckoutRequest;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid request body." },
                { status: 400 }
            );
        }

        const { items, shipping, paymentMethod } = body;

        if (!["upi", "card"].includes(paymentMethod)) {
            return NextResponse.json(
                { error: "Choose UPI or card payment." },
                { status: 400 }
            );
        }

        if (
            !shipping ||
            !shipping.fullName?.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email ?? "") ||
            !/^\d{10}$/.test(shipping.phone ?? "") ||
            !shipping.address?.trim() ||
            !shipping.city?.trim() ||
            !shipping.state?.trim() ||
            !/^\d{6}$/.test(shipping.pinCode ?? "")
        ) {
            return NextResponse.json(
                { error: "Please provide valid delivery details." },
                { status: 400 }
            );
        }

        if (
            !Array.isArray(items) ||
            items.length === 0 ||
            items.length > 100
        ) {
            return NextResponse.json(
                { error: "Your cart is empty or invalid." },
                { status: 400 }
            );
        }

        const quantities = new Map<string, number>();

        for (const item of items) {
            const id = String(item?.id ?? "");
            const quantity = item?.quantity;

            if (
                !/^\d+$/.test(id) ||
                !Number.isSafeInteger(Number(id)) ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 99
            ) {
                return NextResponse.json(
                    { error: "Invalid cart item." },
                    { status: 400 }
                );
            }

            quantities.set(
                id,
                (quantities.get(id) ?? 0) + quantity
            );
        }

        if ([...quantities.values()].some((q) => q > 99)) {
            return NextResponse.json(
                { error: "Maximum quantity is 99 per product." },
                { status: 400 }
            );
        }

        const productIds = [...quantities.keys()];

        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("id, name, price, image")
            .in("id", productIds.map(Number));

        if (
            productsError ||
            !products ||
            products.length !== productIds.length
        ) {
            return NextResponse.json(
                { error: "Some products are unavailable." },
                { status: 400 }
            );
        }

        const productById = new Map(
            products.map((product) => [String(product.id), product])
        );

        const orderItems = productIds.map((id) => {
            const product = productById.get(id)!;
            const quantity = quantities.get(id)!;
            const unitPrice = Number(product.price);
            const lineTotal = Math.round(unitPrice * 100) * quantity;

            return {
                product_id: id,
                product_name: product.name,
                image_url: product.image,
                quantity,
                unit_price: unitPrice,
                line_total: Number((lineTotal / 100).toFixed(2)),
            };
        });

        const totalPaise = orderItems.reduce(
            (sum, item) =>
                sum + Math.round(item.unit_price * 100) * item.quantity,
            0
        );

        if (!Number.isSafeInteger(totalPaise) || totalPaise <= 0) {
            return NextResponse.json(
                { error: "Invalid order amount." },
                { status: 400 }
            );
        }

        const total = Number((totalPaise / 100).toFixed(2));

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error("Razorpay test keys are not configured.");
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const receipt = `rcpt_${user.id.replace(/-/g, "").slice(0, 10)}_${Date.now()}`.slice(0, 40);

        const razorpayOrder = await razorpay.orders.create({
            amount: totalPaise,
            currency: "INR",
            receipt,
            notes: {
                user_id: user.id,
            },
        });

        console.log("[DIAGNOSTIC] Razorpay order creation result:", {
            success: Boolean(razorpayOrder?.id),
            razorpayOrderId: razorpayOrder.id,
        });

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_id: user.id,
                status: "pending",
                currency: "INR",
                subtotal: total,
                total,
                shipping_name: shipping.fullName.trim(),
                shipping_email: shipping.email.trim(),
                shipping_phone: shipping.phone,
                shipping_address: [
                    shipping.address.trim(),
                    shipping.city.trim(),
                    shipping.state.trim(),
                    shipping.pinCode.trim(),
                ].join(", "),
                payment_method: paymentMethod,
                payment_status: "unpaid",
                razorpay_order_id: razorpayOrder.id,
            })
            .select("id")
            .single();

        if (orderError || !order) {
            throw new Error(
                orderError?.message || "Could not create your order."
            );
        }

        createdOrderId = order.id;

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(
                orderItems.map((item) => ({
                    ...item,
                    order_id: order.id,
                }))
            );

        if (itemsError) {
            throw new Error(
                `Could not save order items: ${itemsError.message}`
            );
        }

        console.log("[DIAGNOSTIC] Order and items created successfully:", {
            supabaseOrderId: order.id,
            razorpayOrderId: razorpayOrder.id,
        });

        return NextResponse.json({
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId,
        });
    } catch (error) {
        console.error("Razorpay order creation failed:", error);

        // Best-effort cleanup of an incomplete Supabase order.
        if (supabase && createdOrderId) {
            const { error: cleanupError } = await supabase
                .from("orders")
                .delete()
                .eq("id", createdOrderId);

            if (cleanupError) {
                console.error(
                    "Could not clean up incomplete order:",
                    cleanupError.message
                );
            }
        }

        return NextResponse.json(
            { error: "Could not start payment. Please try again." },
            { status: 500 }
        );
    }
}
