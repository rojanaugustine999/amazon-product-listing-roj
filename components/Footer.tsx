
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="mt-12 border-t border-gray-200 bg-gray-50 px-4 py-8">
            <div className="mx-auto max-w-7xl text-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                    Amazon
                </Link>

                <p className="mt-2 text-sm text-gray-600">
                    Your one-stop shop for everyday essentials.
                </p>

                <nav className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
                    <Link href="/" className="hover:underline">
                        Home
                    </Link>
                    <Link href="/account" className="hover:underline">
                        My Account
                    </Link>
                    <Link href="/cart" className="hover:underline">
                        Cart
                    </Link>
                    <Link href="/wishlist" className="hover:underline">
                        Wishlist
                    </Link>
                </nav>

                <div className="mt-6 border-t border-gray-200 pt-4 text-xs text-gray-500">
                    © 2026 Amazon Product Listing. Designed & Developed by Rojan Augustine.
                </div>
            </div>
        </footer>
    );
}
