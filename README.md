# Amazon Product Listing

A responsive e-commerce frontend built with **Next.js, React, TypeScript, and Tailwind CSS**. This project demonstrates product browsing, search and filtering, shopping cart management, wishlist functionality, stock validation, and a demo checkout experience.

## Live Demo

**[View Live Application](https://amazon-product-listing-1c9oxinke.vercel.app/)**

## Screenshots

### 1. Home Page — Product Listing

Browse products, search by name, filter by category and price, sort results, and navigate between pages.

![Home Page](public/screenshots/home-page.png)

### 2. Product Details

View product images, prices, ratings, availability, and add products to the cart.

![Product Details](public/screenshots/product-details.png)

### 3. Shopping Cart

Manage quantities, remove products, check stock limits, and view the automatically calculated order total.

![Shopping Cart](public/screenshots/shopping-cart.png)

### 4. Wishlist

Save favourite products, remove saved items, and add products to the cart.

![Wishlist](public/screenshots/wishlist.png)

### 5. Checkout

Enter customer information and delivery details, select a demo payment method, and validate the form before placing an order.

![Checkout](public/screenshots/checkout.png)

### 6. Order Success

Display the order confirmation page after a successful demo checkout.

![Order Success](public/screenshots/order-success.png)

## Features

- **Product Listing:** Display products in a responsive grid.
- **Search:** Search products by name.
- **Category Filtering:** Filter products by category.
- **Price Filtering:** Filter products by price range.
- **Sorting:** Sort products using the available sorting options.
- **Pagination:** Navigate through product listing pages.
- **Product Details:** View individual products using dynamic routes.
- **Stock Management:** Display stock availability and prevent quantities from exceeding demo inventory.
- **Shopping Cart:** Add, remove, and update product quantities.
- **Cart Persistence:** Preserve cart data using browser local storage.
- **Wishlist:** Save and remove favourite products with local storage persistence.
- **Toast Notifications:** Display feedback for user actions.
- **Checkout:** Collect customer and delivery information with form validation.
- **Order Confirmation:** Display a success page after demo order placement.
- **Loading and Error States:** Handle loading, missing products, and application errors.
- **Responsive UI:** Support desktop and mobile screen sizes.

## Tech Stack

- **Next.js** — App Router and application routing
- **React** — Component-based user interface
- **TypeScript** — Type safety
- **Tailwind CSS** — Responsive styling
- **Fake Store API / local product data** — Product data source, depending on the configured environment
- **React Context API** — Shared cart, wishlist, and notification state
- **Browser localStorage** — Client-side persistence
- **Vercel** — Deployment

## Project Structure

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
│   ├── page.tsx
│   └── globals.css
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
├── public/
│   └── screenshots/
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (a version supported by your installed Next.js release)
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/rojanaugustine999/amazon-product-listing-roj.git
```

### 2. Open the project folder

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

### 5. Open the application

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create a production build

```bash
npm run build
```

## Key Learning Outcomes

Through this project, I practised:

- Building reusable React components.
- Using TypeScript with React and Next.js.
- Managing shared state with the React Context API.
- Implementing dynamic routes with the Next.js App Router.
- Fetching and transforming API data.
- Handling loading, error, and not-found states.
- Managing cart quantities and inventory constraints.
- Persisting client-side state with localStorage.
- Implementing responsive layouts with Tailwind CSS.
- Validating checkout forms and building a complete demo shopping flow.
- Deploying a Next.js application using Vercel.

## Important Notes

- This is a **frontend demonstration project**, not a production-ready e-commerce platform.
- Cart, wishlist, and inventory data use client-side persistence or demo data; they are not backed by a production database.
- Checkout and payment methods are for demonstration only. No real payment is processed.
- Product API availability may affect the live application's product listing.

## Future Improvements

- Add a backend and database for products, inventory, and orders.
- Implement user authentication.
- Integrate a secure payment gateway in a test environment.
- Add automated unit and end-to-end tests.
- Improve accessibility and performance monitoring.

## Author

**Rojan Augustine**

- GitHub: [@rojanaugustine999](https://github.com/rojanaugustine999)
- Live Project: [Amazon Product Listing](https://amazon-product-listing-1c9oxinke.vercel.app/)

---

*Built as a practical project to strengthen my React and Next.js frontend development skills.*