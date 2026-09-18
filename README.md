<div align="center">

# ✦ O B S I D I A N ✦
### *Next-Generation Autonomous E-Commerce Engine & Editorial Showcase*

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Blazing_Fast-0284c7?style=for-the-badge&logo=vercel&logoColor=white)](https://turbo.build/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br />

**OBSIDIAN** is a luxury, full-stack digital commerce monolith and high-precision merchant operations suite. Combining architectural editorial aesthetics with instant storefront deployment, interactive SVG analytics, and screen-fit glassmorphism dashboard management.

[Explore Dashboard](#-merchant-command-center) • [Storefront Engine](#-dynamic-buyer-storefront) • [Quick Start](#-quick-start) • [Architecture](#-architectural-stack)

---

</div>

<br />

## 🌟 Executive Overview

OBSIDIAN bridges the gap between **high-fashion digital storytelling** and **practical e-commerce operations**. Built from the ground up on **Next.js 16 (App Router)** and **React 19**, it delivers an uncompromising experience for both the merchant and the consumer:

* **⚡ Ultra-Responsive Merchant Hub:** An executive glassmorphic dashboard optimized to fit viewport dimensions perfectly with zero wasteful scrolling.
* **🛍️ Automated Storefront Generation:** Instant deployment of custom branded buyer-facing storefronts with dynamic slug routing (`/store/[slug]`).
* **📊 Real-Time SVG Analytical Engine:** Interactive revenue charts with dynamic timeframe projection (`Daily`, `Weekly`, `Monthly`, `Yearly`), instant volume calculation, and stock intelligence.
* **🏛️ Monumental Editorial Landing:** Lenis kinetic physics-based smooth scrolling, custom velocity-tracking reticle cursor, and cinematic typography.

---

## ⚡ Core Feature Matrix

### 🎛️ Merchant Command Center
* **Single-Screen Viewport Fit:** Engineered with a compact two-column layout (`1.55fr : 1fr`) that nests all critical metrics, graphs, active orders, and tools within standard desktop and laptop displays.
* **SVG Gross Sales Area Graph:** Interactive spline visualization rendered in pure SVG with dynamic timeframe filtering, glowing gradient fills, and live tooltip markers.
* **Multi-State Order Lifecycle:** Live status toggle (`Completed`, `Processing`, `Pending`, `Shipped`), order deletion, customer avatar initials, and real-time total order counts.
* **Low-Stock Detection & 1-Click Restock:** Automated inventory health monitoring with direct `Restock (+10)` action and visual safety thresholds.
* **Integrated Storefront Hub:** Live storefront URL generator, one-click clipboard copy, dedicated QR code modal generator, and 2×2 quick action launcher.
* **Sample Catalog Chooser & Simulation:** Built-in curated catalog templates (Luxury Fashion, Tech Essentials, Minimalist Living) and one-click demo order simulation for stress testing.

### 🛍️ Dynamic Buyer Storefront
* **Zero-Setup Routing:** Each merchant instantly unlocks a customer-facing portal at `/store/[slug]` with persistent catalog synchronization.
* **Interactive Shopping Bag:** Real-time quantity adjustments, price calculations, and subtotal aggregation.
* **Streamlined Checkout Flow:** Modal-driven checkout with customer address collection, order summary validation, and instant receipt confirmation.

### 🎨 Editorial Front-Of-House
* **Physics-Based Kinetic Cursor:** Custom magnetic reticle with velocity tracking, directional compass ticks, and ambient stardust trail emission.
* **Inertial Smooth Scrolling:** Lenis engine integration providing fluid, liquid-like momentum.
* **Haute-Couture Typography & Contrast:** Harmonious pairing of Cormorant Garamond editorial serif with high-readability modern geometric sans.

---

## 🏗️ Architectural Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) + Turbopack | Sub-millisecond HMR, server-side streaming, and optimized code splitting |
| **Frontend Core** | React 19, TypeScript | Strict type safety, concurrent rendering, and resilient component architecture |
| **Styling & Theme** | Tailwind CSS v4 + Vanilla CSS Modules | Glassmorphic blur filters, custom design tokens, and luxury white & dark themes |
| **Data Engine** | LocalStorage Persistence API | Reactive state synchronization between merchant updates and buyer storefronts |
| **Motion & Physics** | Lenis Scroll, Framer Motion, GSAP | Fluid scroll interpolation, layout transitions, and interactive visual feedback |

---

## 📁 Repository Structure

```ascii
OBSIDIAN/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML shell, font declarations, and metadata
│   │   ├── page.tsx                # High-fashion editorial landing showcase
│   │   ├── globals.css             # Design tokens, kinetic cursor styles, and animations
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Executive merchant command center (Overview, Orders, Products, Settings)
│   │   │   └── dashboard.css       # Glassmorphic layout grid, screen-fit utility system, and theme tokens
│   │   ├── store/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Dynamic customer storefront & checkout interface
│   │   └── home/
│   │       └── page.tsx            # Store creation hub and merchant onboarding
│   └── components/
│       ├── CustomCursor.tsx        # Velocity-tracking reticle pointer & particle emitter
│       ├── SiteHeader.tsx          # Stealth navigation bar & editorial masthead
│       ├── HeroSection.tsx         # Monolithic hero showcase with perspective depth
│       ├── StorySection.tsx        # Asymmetric editorial story layout
│       ├── VisionSection.tsx       # Golden foil typography & brand pillars
│       ├── DetailSection.tsx       # Macro product showcase & precision cards
│       ├── SmoothScroll.tsx        # Lenis momentum physics engine wrapper
│       └── SiteFooter.tsx          # Architectural editorial footer
├── public/                         # Static assets, fonts, icons, and SVG graphics
├── tailwind.config.js              # Tailwind tokens, typography, and container plugins
└── package.json                    # Workspace dependencies and lifecycle scripts
```

---

## 🚀 Quick Start

### Prerequisites
* **Node.js**: `v18.17.0` or higher
* **npm**: `v9.0.0` or higher

### 1. Ingestion
Clone the repository to your local workspace:

```bash
git clone https://github.com/duttaranit135-cmyk/OBSIDIAN.git
cd OBSIDIAN
```

### 2. Ignition
Install the project dependencies:

```bash
npm install
```

### 3. Manifestation
Launch the local development server powered by Turbopack:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Direct Route Navigation
| Route | Description |
| :--- | :--- |
| [`/`](http://localhost:3000) | Editorial Landing Page & Monolithic Experience |
| [`/dashboard`](http://localhost:3000/dashboard) | Glassmorphic Executive Merchant Operations Hub |
| [`/store/demo-store`](http://localhost:3000/store/demo-store) | Customer-facing Dynamic Storefront |
| [`/home`](http://localhost:3000/home) | Store Generator & Onboarding |

---

## 🧪 Build & Verification

Verify TypeScript compliance and production asset compilation:

```bash
# Type-check with zero emit
npx tsc --noEmit

# Production build
npm run build
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for further details.

<br />

<div align="center">
<sub>Crafted with obsessive precision for modern digital commerce.</sub>
</div>
