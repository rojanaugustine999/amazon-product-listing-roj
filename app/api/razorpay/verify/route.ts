
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
    console.log("[DIAGNOSTIC] Razorpay verify endpoint called");
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.warn("[DIAGNOSTIC] Verification failed: stage=auth_check, status=401");
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
            console.warn("[DIAGNOSTIC] Verification failed: stage=payload_validation, status=400");
            return NextResponse.json(
                { error: "Invalid payment verification details." },
                { status: 400 }
            );
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error("[DIAGNOSTIC] Verification failed: stage=config_missing, status=500");
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
            console.warn("[DIAGNOSTIC] Verification failed: stage=signature_verification, status=400");
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
            console.error("[DIAGNOSTIC] Verification failed: stage=order_lookup_error, status=500, message=", orderError.message);

            return NextResponse.json(
                { error: "Could not verify the order." },
                { status: 500 }
            );
        }

        if (!order) {
            console.warn("[DIAGNOSTIC] Verification failed: stage=order_not_found, status=404");
            return NextResponse.json(
                { error: "Order not found." },
                { status: 404 }
            );
        }

        if (order.razorpay_order_id !== razorpayOrderId) {
            console.warn("[DIAGNOSTIC] Verification failed: stage=order_id_mismatch, status=400", {
                expectedRazorpayOrderId: order.razorpay_order_id,
                receivedRazorpayOrderId: razorpayOrderId,
            });
            return NextResponse.json(
                { error: "Payment does not match this order." },
                { status: 400 }
            );
        }

        // Allow safe retries after a successful verification.
        if (order.payment_status === "paid") {
            if (order.razorpay_payment_id === razorpayPaymentId) {
                console.log("[DIAGNOSTIC] Verification idempotent success: stage=already_verified, status=200");
                return NextResponse.json({
                    success: true,
                    message: "Payment was already verified.",
                });
            }

            console.warn("[DIAGNOSTIC] Verification failed: stage=already_paid_mismatched_payment_id, status=409");
            return NextResponse.json(
                { error: "This order has already been paid." },
                { status: 409 }
            );
        }

        if (
            !["unpaid", "pending"].includes(order.payment_status)
        ) {
            console.warn("[DIAGNOSTIC] Verification failed: stage=invalid_payment_status, status=409, currentStatus=", order.payment_status);
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
            console.warn("[DIAGNOSTIC] Verification failed: stage=payment_fetch_mismatch, status=400");
            return NextResponse.json(
                { error: "Payment details do not match the order." },
                { status: 400 }
            );
        }

        if (payment.status !== "captured") {
            console.warn("[DIAGNOSTIC] Verification failed: stage=payment_not_captured, status=409, paymentStatus=", payment.status);
            return NextResponse.json(
                {
                    error:
                        "Payment is not captured yet. Please check the payment status before retrying.",
                },
                { status: 409 }
            );
        }

        const adminSupabase = createAdminClient();

        const { data: updatedOrder, error: updateError } =
            await adminSupabase
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
            console.error("[DIAGNOSTIC] Verification failed: stage=order_update_error, status=500, message=", updateError.message);

            return NextResponse.json(
                {
                    error:
                        "Payment was verified, but the order update failed. Please contact support before retrying payment.",
                },
                { status: 500 }
            );
        }

        if (!updatedOrder) {
            console.warn("[DIAGNOSTIC] Verification failed: stage=order_update_zero_rows, status=409");
            return NextResponse.json(
                {
                    error:
                        "The order status changed. Please refresh and check your order.",
                },
                { status: 409 }
            );
        }

        console.log("[DIAGNOSTIC] Verification succeeded: stage=completed, status=200, orderId=", updatedOrder.id);
        return NextResponse.json({
            success: true,
            message: "Payment verified successfully.",
            orderId: updatedOrder.id,
        });
    } catch (error) {
        console.error("[DIAGNOSTIC] Verification failed: stage=exception, status=500, error=", error instanceof Error ? error.message : "Unknown error");

        return NextResponse.json(
            { error: "Could not verify payment. Please try again." },
            { status: 500 }
        );
    }
}
