# Xcode Project Setup for HealthKit

## ⚠️ IMPORTANT: Required Steps to Enable HealthKit

The code is ready, but Xcode project configuration is required before HealthKit will work.

### Step 1: Add the Entitlements File to Xcode Project

The file `FamilyGoals/FamilyGoals.entitlements` has been created, but you need to add it to the Xcode project:

1. Open `FamilyGoals.xcodeproj` in Xcode
2. In the **Project Navigator** (left sidebar), right-click on the **FamilyGoals** folder (the blue one)
3. Select **Add Files to "FamilyGoals"...**
4. Navigate to and select `FamilyGoals/FamilyGoals.entitlements`
5. Make sure **"Copy items if needed"** is **UNCHECKED** (it's already in the right place)
6. Make sure **"FamilyGoals" target** is **CHECKED**
7. Click **Add**

### Step 2: Configure Build Settings

1. Select the **FamilyGoals project** in the navigator (the very top item)
2. Select the **FamilyGoals target** (under Targets)
3. Go to the **Build Settings** tab
4. Search for "Code Signing Entitlements"
5. Set the value to: `FamilyGoals/FamilyGoals.entitlements`

### Step 3: Verify Signing & Capabilities

1. Still in the **FamilyGoals target**, switch to the **Signing & Capabilities** tab
2. You should see **HealthKit** listed under capabilities
3. If it's not there:
   - Click **+ Capability**
   - Search for "HealthKit"
   - Add it

The capabilities section should look like:
```
Signing & Capabilities
├─ Automatic Signing
│  ├─ Team: [Your Team]
│  └─ Bundle Identifier: com.yourcompany.FamilyGoals
└─ HealthKit
   └─ ✓ com.apple.developer.healthkit enabled
```

### Step 4: Clean and Rebuild

1. **Clean Build Folder**: Product → Clean Build Folder (⌘⇧K)
2. **Rebuild**: Product → Build (⌘B)
3. **Run on Device**: Select your iPhone as the destination and click Run (⌘R)

## Verification Checklist

Before running the app, verify these files exist:

- [x] `FamilyGoals/Info.plist` - Contains NSHealthShareUsageDescription
- [x] `FamilyGoals/FamilyGoals.entitlements` - Enables HealthKit capability
- [x] `FamilyGoals/HealthKitManager.swift` - HealthKit integration code
- [x] `FamilyGoals/Views/DashboardView.swift` - Sync button UI

## Testing on Device

**Note:** HealthKit does NOT work in the iOS Simulator. You MUST test on a physical device.

1. Connect your iPhone via USB
2. Select your iPhone as the build destination in Xcode
3. Click Run (⌘R)
4. If prompted, trust the developer certificate on your iPhone:
   - Settings → General → VPN & Device Management → Developer App
   - Trust the certificate
5. Launch the app
6. When prompted, grant HealthKit permissions
7. Tap the "Sync Health Data" button on the dashboard

## Console Logs

To view detailed logs:
1. In Xcode, open the **Debug Area** (View → Debug Area → Show Debug Area)
2. Look for logs with these markers:
   - 🔄 SYNC STEPS STARTED
   - ✅ SYNC STEPS COMPLETED
   - ❌ SYNC STEPS FAILED

## Common Errors and Fixes

### Error: "This app has crashed because it attempted to access privacy-sensitive data without a usage description"

**Fix:** Info.plist is missing NSHealthShareUsageDescription
- Check that Info.plist is properly included in the target
- Clean and rebuild

### Error: Sync button says "Connect Health App" instead of "Sync Health Data"

**Cause:** HealthKit authorization not granted
**Fix:**
1. Tap "Connect Health App"
2. Grant permissions
3. Or check: Settings → Privacy & Security → Health → Family Goals

### Error: "HealthKit is not available on this device"

**Cause:** Running on iOS Simulator
**Fix:** Run on a physical iPhone

### Error: Syncs but shows 0 steps

**Cause:** No step data in Health app
**Fix:**
1. Walk around with your iPhone
2. Or manually add step data in Health app
3. Wait a few minutes for iPhone to record steps

## Project Structure

```
ios/FamilyGoals/
├── FamilyGoals.xcodeproj/       ← Open this in Xcode
└── FamilyGoals/
    ├── FamilyGoalsApp.swift     ← App entry point
    ├── Info.plist               ← Privacy descriptions
    ├── FamilyGoals.entitlements ← HealthKit capability ⚠️
    ├── HealthKitManager.swift   ← HealthKit integration
    ├── APIService.swift         ← API communication
    ├── Models.swift             ← Data models
    └── Views/
        ├── DashboardView.swift  ← Main screen with sync button
        ├── MemberDetailView.swift
        └── ...
```

## What the Entitlements File Does

The `FamilyGoals.entitlements` file tells iOS that your app needs permission to access HealthKit data. Without it:
- iOS will block HealthKit access at the system level
- Authorization requests will fail silently
- The app may crash when trying to use HealthKit

This file is **required** for HealthKit to work, even if all the code is correct.

## Next Steps After Configuration

1. Run the app on your iPhone
2. Grant HealthKit permissions when prompted
3. Check the console logs to see the sync process
4. If it fails, share the console output to diagnose the issue

The logs will clearly show:
- ✅ Authorization status
- 👟 Steps fetched from HealthKit
- 🌐 API sync request
- ❌ Any errors that occur
