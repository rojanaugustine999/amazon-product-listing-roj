import Link from "next/link";

export default function OrderSuccessPage() {
    const orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-16">
            <div className="mx-auto max-w-2xl rounded-xl bg-white p-10 text-center shadow-sm">

                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
                    ✓
                </div>

                <h1 className="text-3xl font-bold">
                    Order Placed Successfully!
                </h1>

                <p className="mt-4 text-gray-600">
                    Thank you for your order.
                </p>

                <div className="mt-6 rounded-lg bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                        Order ID
                    </p>

                    <p className="mt-1 text-xl font-bold">
                        {orderId}
                    </p>
                </div>

                <p className="mt-6 text-gray-600">
                    Your order has been received and will be processed shortly.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/"
                        className="rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
                    >
                        Continue Shopping
                    </Link>

                    <Link
                        href="/cart"
                        className="rounded-lg border px-6 py-3 font-semibold hover:bg-gray-100"
                    >
                        View Cart
                    </Link>
                </div>

            </div>
        </main>
    );
}