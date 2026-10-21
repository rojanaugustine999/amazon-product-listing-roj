
import type { Metadata } from "next";
import "./globals.css";

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import { SidebarProvider } from "@/context/SidebarContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Amazon Product Listing",
  description:
    "Browse products, manage your wishlist, and shop with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <SidebarProvider>
                <Navbar />
                {children}
              </SidebarProvider>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
        <Footer />
      </body>
    </html>
  );
}
