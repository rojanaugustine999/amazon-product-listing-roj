
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Please log in to verify payment." },
                { status: 401 }
            );
        }

        const body = await request.json();

        const orderId = body?.orderId;
        const razorpayOrderId = body?.razorpay_order_id;
        const razorpayPaymentId = body?.razorpay_payment_id;
        const razorpaySignature = body?.razorpay_signature;

        if (
            typeof orderId !== "string" ||
            typeof razorpayOrderId !== "string" ||
            typeof razorpayPaymentId !== "string" ||
            typeof razorpaySignature !== "string" ||
            !/^pay_[a-zA-Z0-9]+$/.test(razorpayPaymentId) ||
            !/^order_[a-zA-Z0-9]+$/.test(razorpayOrderId) ||
            !/^[a-f0-9]{64}$/i.test(razorpaySignature)
        ) {
            return NextResponse.json(
                { error: "Invalid payment verification details." },
                { status: 400 }
            );
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return NextResponse.json(
                { error: "Payment configuration is missing." },
                { status: 500 }
            );
        }

        // Verify the signature using the server-only secret.
        const expectedSignature = createHmac("sha256", keySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest();

        const receivedSignature = Buffer.from(
            razorpaySignature,
            "hex"
        );

        if (
            expectedSignature.length !== receivedSignature.length ||
            !timingSafeEqual(expectedSignature, receivedSignature)
        ) {
            return NextResponse.json(
                { error: "Payment signature verification failed." },
                { status: 400 }
            );
        }

        // Only the authenticated customer's own order can be updated.
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(
                "id, user_id, total, currency, payment_status, razorpay_order_id, razorpay_payment_id"
            )
            .eq("id", orderId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (orderError) {
            console.error("Order lookup failed:", orderError.message);

            return NextResponse.json(
                { error: "Could not verify the order." },
                { status: 500 }
            );
        }

        if (!order) {
            return NextResponse.json(
                { error: "Order not found." },
                { status: 404 }
            );
        }

        if (order.razorpay_order_id !== razorpayOrderId) {
            return NextResponse.json(
                { error: "Payment does not match this order." },
                { status: 400 }
            );
        }

        // Allow safe retries after a successful verification.
        if (order.payment_status === "paid") {
            if (order.razorpay_payment_id === razorpayPaymentId) {
                return NextResponse.json({
                    success: true,
                    message: "Payment was already verified.",
                });
            }

            return NextResponse.json(
                { error: "This order has already been paid." },
                { status: 409 }
            );
        }

        if (
            !["unpaid", "pending"].includes(order.payment_status)
        ) {
            return NextResponse.json(
                { error: "This order is not awaiting payment." },
                { status: 409 }
            );
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Confirm the payment with Razorpay's server, not just the browser.
        const payment = await razorpay.payments.fetch(razorpayPaymentId);

        const expectedAmount = Math.round(Number(order.total) * 100);

        if (
            payment.order_id !== razorpayOrderId ||
            payment.amount !== expectedAmount ||
            payment.currency !== "INR" ||
            order.currency !== "INR"
        ) {
            return NextResponse.json(
                { error: "Payment details do not match the order." },
                { status: 400 }
            );
        }

        if (payment.status !== "captured") {
            return NextResponse.json(
                {
                    error:
                        "Payment is not captured yet. Please check the payment status before retrying.",
                },
                { status: 409 }
            );
        }

        const { data: updatedOrder, error: updateError } =
            await supabase
                .from("orders")
                .update({
                    payment_status: "paid",
                    razorpay_payment_id: razorpayPaymentId,
                })
                .eq("id", orderId)
                .eq("user_id", user.id)
                .eq("razorpay_order_id", razorpayOrderId)
                .in("payment_status", ["unpaid", "pending"])
                .select("id")
                .maybeSingle();

        if (updateError) {
            console.error(
                "Payment status update failed:",
                updateError.message
            );

            return NextResponse.json(
                {
                    error:
                        "Payment was verified, but the order update failed. Please contact support before retrying payment.",
                },
                { status: 500 }
            );
        }

        if (!updatedOrder) {
            return NextResponse.json(
                {
                    error:
                        "The order status changed. Please refresh and check your order.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified successfully.",
            orderId: updatedOrder.id,
        });
    } catch (error) {
        console.error("Payment verification failed:", error);

        return NextResponse.json(
            { error: "Could not verify payment. Please try again." },
            { status: 500 }
        );
    }
}
