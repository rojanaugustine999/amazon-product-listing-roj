"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-8">
                <p className="text-sm font-medium text-amber-600">
                    ADMINISTRATION
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">
                    Dashboard
                </h1>
                <p className="mt-2 text-gray-600">
                    Welcome to your Amazon Product Listing admin panel.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">Order Management</p>
                    <h2 className="mt-3 text-xl font-bold text-gray-900">
                        Manage Orders
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Review customer orders and their current status.
                    </p>
                    <Link
                        href="/admin/orders"
                        className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        View Orders →
                    </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">User Management</p>
                    <h2 className="mt-3 text-xl font-bold text-gray-900">
                        Manage Users
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Review customer accounts and manage administrator roles.
                    </p>
                    <Link
                        href="/admin/users"
                        className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        View Users →
                    </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">Storefront</p>
                    <h2 className="mt-3 text-xl font-bold text-gray-900">
                        Customer Store
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Open your existing product listing website.
                    </p>
                    <Link
                        href="/"
                        className="mt-5 inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                        View Store →
                    </Link>
                </div>
            </div>
        </div>
    );
}