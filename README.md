# 🛒 Hyperlocal Commerce & Store Management Engine
### Built by Manish Kumar ([@Mani1454](https://github.com/Mani1454))

[🌐 **Try Customer App in Browser**](https://apna-kirana-admin.vercel.app/customer.html) • [📱 **Download Android APK**](https://expo.dev/artifacts/eas/nIR4dlW04PeJZp0LaFZju5f3hkO6WbqFClKTO0V7uAU.apk) • [💻 **Store Counter Tablet**](https://apna-kirana-admin.vercel.app) • [🔄 **Dual Split Demo**](https://apna-kirana-admin.vercel.app/live_demo.html)

A full-stack hyperlocal ordering and store management system I designed and engineered from the ground up to solve a real challenge faced by Indian local retail businesses: **how to deliver quick-commerce convenience to local customers without losing 15% to 30% of profit margins to aggregator platforms.**

Whether you are a store owner wanting to run your own direct delivery channel, or a business looking for a reliable developer to build a custom on-demand ordering platform for your industry, this repository serves as a live, production-ready foundation.

---

## ⚡ Try the Live Demo Right Now

I believe in working software over slide decks. You can test both sides of the ecosystem right now:

### 🌐 1. Customer App (Instant Web Demo — No Download Required)
* **[Open Customer App Web View](https://apna-kirana-admin.vercel.app/customer.html)**
* *Designed for clients on iPhone, Mac, Windows, or Android who want to experience the customer ordering journey immediately without downloading an APK.*
* *Features full category navigation, live search, cart calculations, address input, UPI payment flow, and delivery timeline tracking.*

### 📱 2. Customer Android App (v1.0.4 APK)
* **[Download Android APK (Direct Link)](https://expo.dev/artifacts/eas/nIR4dlW04PeJZp0LaFZju5f3hkO6WbqFClKTO0V7uAU.apk)**
* **EAS Cloud Build Verification**: [Expo Build #6](https://expo.dev/accounts/manis8873/projects/apna-kirana/builds/73551fc8-fa7e-4f41-90f2-c9b1921a54c8)
* **How to test**:
  1. Install the `.apk` on any Android smartphone.
  2. Enter any 10-digit mobile number and tap **⚡ "Tap here to auto-fill 123456 & Proceed"** to log in instantly.
  3. Browse items, add to cart, and choose **UPI** at checkout.
  4. Tapping **"Pay & Place Order"** will automatically trigger your installed UPI app (GPay / PhonePe / Paytm) with the merchant UPI ID (`8873679268@apl`) and exact total pre-filled.

### 💻 3. Store Counter Tablet (Web POS)
* **[Open Store Counter POS](https://apna-kirana-admin.vercel.app)**
* **Login Phone**: `+918873679268`
* **Counter PIN**: `8873`
* **How to test**:
  1. Open this link on a laptop, tablet, or secondary phone while placing an order on the customer app.
  2. You will hear the built-in **Hindi Voice Soundbox** announce the new order aloud: *"नया ऑर्डर प्राप्त हुआ। राशि ₹... रुपये।"*
  3. Verify the customer's 12-digit UTR reference, change order status (Preparing, Out for Delivery, Delivered), and see the customer app update in under a second.

### 🔄 4. Side-by-Side Dual Demo (Split Screen)
* **[Launch Side-by-Side Live Demo](https://apna-kirana-admin.vercel.app/live_demo.html)**
* *Displays both the Customer Smartphone on the left and the Shopkeeper Counter on the right in a single browser window for quick client presentations.*

---

## 💡 Why This Beats Aggregators (Blinkit, Zepto, Swiggy)

1. **Zero Commission (100% Direct Profit)**: Aggregators charge 15% to 35% cut per order. In this system, payments go directly to the merchant's bank account via standard UPI intent. No middleman fees.
2. **Instant Settlement**: No waiting for weekly payouts. The money lands in the shopkeeper's account immediately.
3. **Customer Ownership**: The merchant owns their customer database, phone numbers, and buying habits — not an aggregator algorithm.
4. **Built-in Voice Soundbox**: Eliminates the monthly rental fee of external hardware soundboxes by utilizing speech synthesis on the counter screen.

---

## 🎯 Adaptable to Any Industry or Domain

I built this codebase with modularity in mind. If you are a client in another sector, I can adapt and rebrand this platform for your exact workflow in **3 to 5 days**:

* 💊 **Pharmacies & Medical Stores**: Add doctor prescription uploads, schedule monthly chronic medicine refills.
* 🍕 **Restaurants & Cloud Kitchens**: Table QR digital menus, Kitchen Display Systems (KDS), takeaway vs delivery toggle.
* 🍰 **Bakeries & Sweet Shops**: Weight-based pricing (250g / 500g / 1kg) and custom message-on-cake inputs.
* 🥩 **Meat & Fresh Fish Stores**: Cut selection (curry cut, boneless) and temperature-sensitive rapid dispatch.
* 🚰 **Water Delivery & Tiffin Services**: Daily subscription calendars and empty can/tiffin return tracking.
* 👗 **Boutiques & Apparel**: Size/color variants, lookbook catalogs, and direct WhatsApp inquiry buttons.

---

## 🛠️ Architecture & Tech Stack

```
   ┌────────────────────────────────┐         ┌────────────────────────────────┐
   │      Customer Mobile App       │         │      Store Counter Tablet      │
   │  React Native (Expo SDK 52)    │         │      React 18 + Tailwind       │
   └───────────────┬────────────────┘         └────────────────▲───────────────┘
                   │                                           │
                   │         1. Places Order via UPI           │
                   ▼                                           │
   ┌───────────────────────────────────────────────────────────┴───────────────┐
   │                        Google Cloud Firestore                             │
   │      • Sub-second real-time sync across devices                           │
   │      • Automated session management & order state machine                 │
   └───────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                      Vercel Serverless Edge API                           │
   │      • /api/send-otp   • /api/verify-otp   • Webhook Verification         │
   └───────────────────────────────────────────────────────────────────────────┘
```

* **Mobile App**: React Native, Expo 52, TypeScript, React Navigation, Native Linking (UPI Deep-Links).
* **Counter Web POS**: React 18, Tailwind CSS, Lucide Icons, Web Speech API (Hindi/English soundbox announcements), AudioContext chimes.
* **Backend & Cloud Sync**: Firebase Cloud Firestore, Vercel Serverless Functions.
* **Payments**: NPCI Standard UPI Intent (`upi://pay`), BharatQR, 12-digit UTR bank ledger.
* **White-Label Script**: Includes `scripts/whitelabel.js` to automatically rebrand store name, colors, app package ID, and icons in a single command.

---

## 🤝 Let's Work Together

I am available for:
1. **Full White-Label Deployment**: Setting up this complete app + web dashboard for your retail business with your branding, Play Store release, and custom domain.
2. **Custom Software Development**: Building tailored web and mobile applications from scratch for your business or startup.
3. **Source Code Purchase**: Licensing this complete production-tested codebase for your own team or clients.

### Contact Me
* **Name**: Manish Kumar
* **GitHub**: [@Mani1454](https://github.com/Mani1454)
* **Email**: [manish290503@gmail.com](mailto:manish290503@gmail.com)
* **Location**: Bihar, India (Available for remote contracts worldwide)
