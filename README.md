# TillAir

**Sell Airtime. Earn Commission.**

TillAir is a simple offline-first PWA for airtime sellers using a Safaricom till.

## How it works

1. Open **Settings** and save your Safaricom store number.
2. Set your starting till balance. The default commission rate is **5%**.
3. Open **Sell Airtime**.
4. Enter the customer's phone number and airtime amount.
5. Tap **Buy Airtime**.
6. TillAir opens the phone dialer with this prepared USSD sequence:

   `*234*2*STORE_NUMBER*5*PHONE*AMOUNT#`

7. Complete the remaining Safaricom prompts on the phone.
8. Return to TillAir and confirm the sale **only if it succeeded**.

Confirmed sales are stored locally on the device. There is no login, server, Supabase database, or required internet connection.

## Offline and installation

The app uses IndexedDB for local records and a service worker for offline app-shell caching. It includes a web app manifest and PNG icons for installation on supported browsers.

The actual USSD transaction still requires the phone's mobile network and phone dialer.

## Development

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Logo

Replace `public/logo-placeholder.svg` with your final TillAir logo when ready. Replace the PNG icons too if you want the installed app icon to match the final logo.
