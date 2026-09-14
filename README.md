<div align="center">

# 🛒 Hyperlocal E-Commerce & Kirana Platform
### Full-Stack Retail App • Smart Counter Kiosk • Zero-Commission UPI • Cloud-Synced

[![React Native](https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo%2052-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Web POS](https://img.shields.io/badge/POS%20Web-React%2018%20%7C%20Tailwind-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Cloud-Firebase%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel%20Edge-black?logo=vercel&logoColor=white)](https://apna-kirana-admin.vercel.app)
[![UPI](https://img.shields.io/badge/Payments-NPCI%20BharatQR%20%2F%20UPI-097939?logo=googlepay&logoColor=white)](https://npci.org.in)
[![License](https://img.shields.io/badge/License-Commercial%20%2F%20Custom-orange.svg)](mailto:manish290503@gmail.com)

<p align="center">
  <b>A turnkey, white-label hyperlocal commerce solution designed to empower local businesses to compete directly with Blinkit, Zepto, and Instamart — with 0% commission and 100% direct bank settlements.</b>
</p>

[📱 Download Android Demo APK](https://expo.dev/artifacts/eas/nIR4dlW04PeJZp0LaFZju5f3hkO6WbqFClKTO0V7uAU.apk) • [💻 Launch Live Store Counter Tablet](https://apna-kirana-admin.vercel.app) • [💼 Hire / Request Custom App](#-custom-development--contact)

</div>

---

## 🌟 Why Clients Love This Platform

| Feature | Aggregator Apps (Swiggy / Zomato / Blinkit) | This Platform |
| :--- | :--- | :--- |
| **Commissions** | ❌ **15% to 35% cut** on every order | ✅ **0% Commission** — 100% direct to your bank |
| **Payment Settlement** | ❌ Delayed weekly or bi-weekly | ✅ **Instant UPI settlement** to merchant VPA |
| **Customer Data** | ❌ Aggregator owns customer contacts | ✅ **You own 100% of your customer database** |
| **Branding** | ❌ Listed among competitors | ✅ **Your own dedicated branded app & identity** |
| **Audio Notification** | ❌ Paid third-party soundbox devices | ✅ **Built-in Voice Soundbox in Hindi/English** |

---

## 🚀 Live Working Demos

Experience the complete ecosystem live right now:

### 1. 📱 Customer Android Mobile App (v1.0.4)
Experience the customer journey from catalog browsing to 1-tap checkout:
* **[Download Android APK (Direct Link)](https://expo.dev/artifacts/eas/nIR4dlW04PeJZp0LaFZju5f3hkO6WbqFClKTO0V7uAU.apk)**
* **EAS Cloud Build Verification**: [Expo Build #6](https://expo.dev/accounts/manis8873/projects/apna-kirana/builds/73551fc8-fa7e-4f41-90f2-c9b1921a54c8)
* *Testing Guide*: Enter any mobile number -> tap **⚡ "Tap here to auto-fill 123456 & Proceed"** -> add items -> checkout via UPI.

### 2. 💻 Merchant Counter Tablet (Live Web POS)
The shopkeeper's command center for managing orders and inventory:
* **[Open Live Web Admin Kiosk](https://apna-kirana-admin.vercel.app)**
* **Demo Store Login Phone**: `+918873679268`
* **Demo Counter PIN**: `8873`
* *Features*: Live incoming order queue, soundbox voice announcements, 12-digit UTR payment verification, and printable KOT receipts.

---

## 🎯 Adaptable to Any Retail or Service Industry

While demonstrated for grocery & kirana stores, **this architecture can be customized and rebranded for any domain in 48-72 hours**:

| Domain | Tailored Capabilities |
| :--- | :--- |
| 💊 **Pharmacy & Medical Stores** | Prescription upload, dosage instructions, scheduled refills |
| 🍕 **Restaurants & Cloud Kitchens** | Dine-in QR menu, live kitchen display (KDS), takeaway pickup |
| 🍰 **Bakeries & Sweet Shops** | Weight-based ordering (250g, 500g, 1kg), custom cake requests |
| 🥩 **Fresh Meat & Seafood** | Cut & cleaning customization, cold-chain rapid delivery |
| 🚰 **Water Can Delivery** | Daily subscription schedules, empty can return tracking |
| 👗 **Fashion & Boutiques** | Size/color variants, lookbooks, WhatsApp direct checkout |
| 🔨 **Hardware & Electrical** | Bulk contractor discounts, technical specs catalog |

---

## ⚡ Key Technical Highlights

```
┌─────────────────────────┐          ┌───────────────────────────┐
│   Customer Mobile App   │          │  Merchant Counter Tablet  │
│   (React Native/Expo)   │          │   (React + Tailwind POS)  │
└────────────┬────────────┘          └─────────────▲─────────────┘
             │                                     │
             │   1. Realtime Order Placement       │
             ▼                                     │
┌──────────────────────────────────────────────────┴─────────────┐
│                 Google Cloud Firestore Engine                  │
│       • Sub-second synchronization • Realtime Listeners        │
│       • Ephemeral OTP sessions     • Encrypted Store Data      │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                   Vercel Serverless Gateway                    │
│   • /api/send-otp   • /api/verify-otp   • Webhook Verification │
└────────────────────────────────────────────────────────────────┘
```

### 1. Zero-Commission UPI Intent Payment Flow
* Automatically launches installed UPI apps on Android (**Google Pay, PhonePe, Paytm, BHIM**) via NPCI standard deep-links (`upi://pay`).
* Generates dynamic BharatQR for desktop/tablet scanning.
* Verifies customer payments via 12-digit Bank Reference (UTR) numbers before fulfillment.

### 2. Built-in Hindi & English Voice Soundbox
* Built right into the web POS counter — eliminates the need to rent or buy expensive external soundbox hardware.
* Speaks incoming order details aloud in real time:
  > *"नया ऑर्डर प्राप्त हुआ। राशि ₹450 रुपये।"*

### 3. Complete White-Label Engine
Includes an automated rebranding script (`scripts/whitelabel.js`):
```bash
node scripts/whitelabel.js --name "Sharma Supermarket" --phone "+919876543210" --color "#0D9488"
```
Instantly updates branding, primary colors, app bundle identifiers, package names, and localized metadata.

---

## 🛠️ Tech Stack & Architecture

- **Mobile Frontend**: React Native, Expo SDK 52, TypeScript, React Navigation
- **Counter POS Web**: React 18, Tailwind CSS, Lucide Icons, HTML5 Web Audio API, Web Speech Synthesis
- **Database & Sync**: Firebase Cloud Firestore (NoSQL, sub-second latency)
- **Authentication**: Phone OTP Verification with automated session TTL & role provisioning
- **Cloud Infrastructure**: Vercel Serverless Functions, Expo Application Services (EAS Cloud)
- **Payments**: NPCI UPI Deep Linking, BharatQR Standard, UTR Ledger

---

## 💼 Custom Development & Contact

Are you looking to:
1. **Purchase this complete codebase** with full rights and deployment?
2. **Rebrand this app** for your own retail store or supermarket?
3. **Build a custom mobile & web platform** for your specific industry or startup?

Let's discuss your project requirements!

* **Developer**: Manish Kumar
* **GitHub**: [@Mani1454](https://github.com/Mani1454)
* **Email**: [manish290503@gmail.com](mailto:manish290503@gmail.com)
* **Location**: Bihar, India / Remote Worldwide
* **Turnaround Time**: 3 to 7 days for customized white-label deployment

---

<div align="center">
  <sub>Built with ❤️ for Indian local commerce & global entrepreneurs.</sub>
</div>
