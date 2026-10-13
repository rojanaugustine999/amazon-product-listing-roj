# Amazon Product Listing

A responsive e-commerce product listing application built with **Next.js, React, TypeScript, and Tailwind CSS**. The project demonstrates product browsing, search and filtering, shopping cart management, wishlist functionality, stock validation, and a demo checkout flow.

## 🚀 Live Demo

[View the Live Application](https://amazon-product-listing-1c9oxinke.vercel.app/)

## ✨ Features

- **Product Listing:** Browse products in a responsive grid layout.
- **Search:** Find products by name.
- **Category Filtering:** Filter products by category.
- **Price Filtering:** Browse products within selected price ranges.
- **Sorting:** Sort products using available sorting options.
- **Pagination:** Navigate through product listings.
- **Product Details:** View product images, prices, ratings, and stock availability.
- **Shopping Cart:** Add and remove products, update quantities, and calculate totals.
- **Wishlist:** Save and manage favorite products.
- **Stock Validation:** Prevent quantities from exceeding available demo stock.
- **Checkout:** Enter customer information, delivery address, and select a demo payment method.
- **Order Confirmation:** Display a confirmation page after a successful demo order.
- **API Error Handling:** Use local fallback product data when the external product API fails.
- **Loading and Error States:** Provide feedback during loading and when errors occur.
- **Responsive Design:** Support desktop, tablet, and mobile layouts.
- **Persistent State:** Preserve cart and wishlist data using browser local storage.

## 🛠️ Technologies Used

- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- Fake Store API
- React Context API
- Browser Local Storage
- Git and GitHub
- Vercel

## 📂 Project Structure

```text
amazon-product-listing-roj/
├── app/
│   ├── api-test/
│   ├── cart/
│   ├── checkout/
│   ├── order-success/
│   ├── products/
│   │   └── [id]/
│   ├── wishlist/
│   ├── error.tsx
│   ├── loading.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AddToCartButton.tsx
│   ├── CartButton.tsx
│   ├── CategoryFilter.tsx
│   ├── Pagination.tsx
│   ├── PriceFilter.tsx
│   ├── ProductCard.tsx
│   ├── ProductListing.tsx
│   ├── QuantitySelector.tsx
│   ├── SearchBar.tsx
│   └── SortSelect.tsx
├── context/
│   ├── CartContext.tsx
│   ├── ToastContext.tsx
│   └── WishlistContext.tsx
├── data/
│   └── products.ts
├── lib/
│   ├── api.ts
│   └── stock.ts
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/rojanaugustine999/amazon-product-listing-roj.git
```

### 2. Open the project directory

```bash
cd amazon-product-listing-roj
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create a production build

```bash
npm run build
```

## 🔌 API and Fallback Data

The application uses the [Fake Store API](https://fakestoreapi.com/) to retrieve product data.

If the external API is unavailable or returns invalid data, the application can use local fallback products to keep the product listing available.

## 🛒 Demo Checkout

The checkout flow demonstrates customer form validation, delivery details, payment method selection, order confirmation, and cart clearing.

**Note:** This is a frontend demonstration project. It does not process real payments or provide a production order-management backend.

## 🌐 Deployment

The application is deployed using Vercel.

Live URL: https://amazon-product-listing-1c9oxinke.vercel.app/

## 📚 What I Learned

- Building reusable React components.
- Using the Next.js App Router and dynamic routes.
- Managing shared state with the React Context API.
- Persisting shopping cart and wishlist data with local storage.
- Fetching and validating API data with TypeScript.
- Handling API failures with fallback data.
- Implementing responsive layouts with Tailwind CSS.
- Managing loading, error, and not-found states.
- Deploying a Next.js application with Vercel.

## 👨‍💻 Author

**Rojan Augustine**

GitHub: [rojanaugustine999](https://github.com/rojanaugustine999)

---

If you find this project useful, feel free to explore the source code and try the live demo.
