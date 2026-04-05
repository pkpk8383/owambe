# Owambe Mobile App

React Native + Expo SDK 51 app for iOS and Android.

## Architecture

```
apps/mobile/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (auth)/            # Auth screens — welcome, login, register
│   ├── (tabs)/            # Consumer/planner tabs — home, plan, vendors, bookings, profile
│   ├── (vendor)/          # Vendor tabs — overview, bookings, calendar, earnings, settings
│   ├── vendor/[slug].tsx  # Public vendor profile + booking modal
│   ├── booking/[id].tsx   # Booking detail + in-app messaging
│   ├── ticket/[qr].tsx    # Animated QR ticket display
│   ├── checkin.tsx        # QR scanner (expo-camera) with live stats
│   ├── dayof.tsx          # Day-of coordinator — live clock, runsheet, vendor contacts
│   ├── events.tsx         # Planner event list
│   └── analytics.tsx      # Planner analytics with SVG charts
├── src/
│   ├── services/
│   │   ├── api.ts         # Axios client with auto token refresh
│   │   └── notifications.ts  # Push notification registration
│   ├── store/
│   │   └── auth.store.ts  # Zustand + SecureStore persistence
│   ├── hooks/
│   │   ├── useSocket.ts   # Socket.io check-in + messages
│   │   └── useData.ts     # React Query hooks
│   ├── components/
│   │   └── ui.tsx         # Button, Card, Input, Badge, Avatar, Spinner, etc.
│   └── utils/
│       ├── theme.ts       # Colors, typography, spacing, shadows
│       └── helpers.ts     # Date formatting, validation, currency
├── app.json               # Expo config (iOS + Android)
├── eas.json               # EAS Build profiles
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

## Setup

```bash
cd apps/mobile
npm install
```

Create a `.env` file:
```
EXPO_PUBLIC_API_URL=https://api.owambe.com/api
EXPO_PUBLIC_APP_ENV=production
```

## Development

```bash
# Start dev server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android

# Install Expo Go on your phone and scan the QR code to test on device
```

## Building for App Store + Play Store

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure project: Update `eas.json` with your Apple Team ID and Google Play credentials

### Build

```bash
# Build for both stores
npm run build:all

# Or individually
eas build --platform ios
eas build --platform android
```

### Submit

```bash
# Submit to both stores
eas submit --platform ios
eas submit --platform android
```

## Key Screens

| Screen | Description |
|--------|-------------|
| Welcome | 4-slide onboarding with brand colours |
| Login / Register | Email/password, role selector |
| Home (consumer) | Category grid, AI planning CTA |
| Home (planner) | Event stats, recent events list |
| **AI Plan** | Flagship: conversational chat → 3-plan output → deposit payment |
| Vendors | Search grid with category filters and photo thumbnails |
| Vendor Profile | Photo carousel, packages, reviews, book/RFQ bottom sheet |
| Bookings | Status-filtered list with payment state |
| **Check-in Scanner** | Live camera QR scanning with real-time stats bar |
| **Day-of Coordinator** | Live clock, runsheet timeline, vendor call/message/map |
| Ticket | Animated QR code display with event details |
| Booking Detail | Full booking info + in-app chat with vendor |
| Vendor Overview | Revenue stats, recent bookings |
| Vendor Calendar | Tap-to-select availability calendar |
| Vendor Earnings | Payout schedule with escrow status |

## Environment Variables

| Key | Description |
|-----|-------------|
| `EXPO_PUBLIC_API_URL` | API base URL — `https://api.owambe.com/api` |
| `EXPO_PUBLIC_APP_ENV` | `development`, `preview`, or `production` |

## Notes

- Push notifications work on physical devices only (not simulators)
- QR scanner requires camera permission (requested on first use)
- Location access for venue detection in AI plan screen
- SecureStore persists auth tokens across app restarts
- React Query caches all API data for 60 seconds by default
- Socket.io connects automatically on login and reconnects on background→foreground
