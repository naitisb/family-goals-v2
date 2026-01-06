# 🎯 Family Goals

A beautiful, full-stack goal tracking app for families built with Next.js, TypeScript, and SwiftUI.

## ✨ Features

### 👨‍👩‍👧‍👦 Family-Focused
- **2-10 Family Members**: Flexible family size
- **Password Protected**: Family-level password + individual 4-digit PINs
- **View Each Other's Progress**: See how everyone is doing

### 💧 Water Tracking
- **Customizable Goal**: Set your own target (ml, L, oz, cups)
- **Cumulative Entry**: Add water intake throughout the day
- **Visual Progress**: Beautiful water glass animation

### 🏃 Exercise Tracking
- **Goal: 30 Minutes Daily**: Stay active together
- **Log Activities**: Enter duration, activity type, and notes
- **Custom Exercises**: Create and save your own exercise types

### 👟 Step Tracking (iOS HealthKit Integration)
- **Customizable Daily Goal**: Set your own target (default 10,000 steps)
- **iOS Health Sync**: Automatic one-way sync from iOS Health app
- **Manual Entry**: Log steps manually on web and mobile
- **Hybrid Sync**: Auto-sync on app open + manual refresh
- **Visual Progress**: Progress rings and step history
- **Source Tracking**: Differentiate between HealthKit and manual entries

### 🎯 Personal Goals
- **Daily Goals**: Up to 4 custom daily goals
- **Weekly Goals**: Up to 4 custom weekly goals
- **Assigned Goals**: Family members assign goals to each other
- **Timing & Notifications**: Set due times and reminders

### 🎨 Personalization
- **Avatar Colors**: 42+ preset colors
- **Profile Photos**: Upload custom profile pictures
- **Theme Customization**: 6 gradient themes + custom backgrounds
- **Drag-to-Position**: Custom background image positioning

### 📸 Photo Albums
- **Goal Photos**: Track progress visually
- **Nested Albums**: Photos organized by member → goal
- **Family Album**: View all photos from one place

### 📊 Stats & History
- **Weekly View**: Daily breakdown with completion percentages
- **Monthly View**: Calendar heatmap
- **Yearly View**: Trend charts

## 🛠 Tech Stack

### Web App (Next.js)
- **Next.js 14+** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Turso** - SQLite-compatible database
- **Vercel Blob** - Photo storage

### iOS App (SwiftUI)
- **SwiftUI** - Native iOS UI
- **Swift 5** - Programming language
- **HealthKit** - Step tracking integration
- **URLSession** - Networking

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm
- Turso account (free tier available)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/naitisb/family-goals-v2.git
   cd family-goals-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Turso database**
   ```bash
   turso db create family-goals
   turso db show family-goals --url
   turso db tokens create family-goals
   ```

4. **Create `.env.local`**
   ```env
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token
   JWT_SECRET=your-secret-key
   BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
   ```

5. **Initialize the database**
   ```bash
   curl -X POST http://localhost:3000/api/init
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)**

### iOS App Setup

1. Open `ios/FamilyGoals/FamilyGoals.xcodeproj` in Xcode
2. Update the API URL in `APIService.swift`
3. **Configure HealthKit** (for step tracking):
   - Select project → Target "FamilyGoals" → Signing & Capabilities
   - Click "+ Capability" → Add "HealthKit"
   - Add to Info.plist:
     ```xml
     <key>NSHealthShareUsageDescription</key>
     <string>Family Goals would like to access your step count to help you track your daily activity goals.</string>
     ```
4. Build and run on simulator or device

**Note**: HealthKit step tracking only works on physical iOS devices, not in the simulator.

## ☁️ Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   - `BLOB_READ_WRITE_TOKEN`
4. Deploy!

## 📁 Project Structure

```
family-goals/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication
│   │   │   ├── dashboard/    # Dashboard data
│   │   │   ├── goals/        # Goal CRUD
│   │   │   ├── water/        # Water tracking
│   │   │   ├── exercise/     # Exercise tracking
│   │   │   ├── steps/        # Step tracking
│   │   │   ├── notifications/# Notifications
│   │   │   ├── photos/       # Photo management
│   │   │   ├── settings/     # Theme settings
│   │   │   ├── stats/        # Statistics
│   │   │   └── upload/       # File uploads
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main app component
│   ├── lib/
│   │   ├── auth.ts           # JWT utilities
│   │   ├── db.ts             # Database client
│   │   └── utils.ts          # Helper functions
│   └── types/
│       └── index.ts          # TypeScript types
├── ios/
│   └── FamilyGoals/          # SwiftUI iOS app
├── public/
│   └── manifest.json         # PWA manifest
└── package.json
```

## 🔒 Security

- **Family Password**: Protects access to family data
- **Individual PINs**: 4-digit PIN per member
- **JWT Tokens**: 30-day expiry
- **Password Hashing**: bcrypt

## 📄 License

MIT License - feel free to use this for your own family!

---

Made with ❤️ for families who want to build healthy habits together
