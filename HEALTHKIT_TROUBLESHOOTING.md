# HealthKit Step Sync Troubleshooting Guide

## Common Issues and Solutions

### 1. HealthKit Capability Not Enabled in Xcode

**Symptom:** App crashes when trying to access HealthKit, or authorization dialog never appears.

**Solution:**
1. Open `ios/FamilyGoals/FamilyGoals.xcodeproj` in Xcode
2. Select the **FamilyGoals** project in the navigator
3. Select the **FamilyGoals** target
4. Go to **Signing & Capabilities** tab
5. Click **+ Capability** button
6. Add **HealthKit** capability
7. This will automatically create `FamilyGoals.entitlements` file

**What it should look like:**
```
Signing & Capabilities
├─ Automatic Signing (enabled)
└─ HealthKit
   └─ Clinical Health Records (optional)
```

### 2. Info.plist Missing or Incorrect

**Symptom:** App crashes when requesting HealthKit authorization with message about missing usage description.

**Verification:** Check that `/ios/FamilyGoals/FamilyGoals/Info.plist` contains:
```xml
<key>NSHealthShareUsageDescription</key>
<string>Family Goals would like to read your step count and water intake to help you track your daily activity and hydration goals.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Family Goals would like to save your water intake to the Health app so all your health data stays in sync.</string>
```

**Status:** ✅ This is already configured correctly

### 3. HealthKit Authorization Not Granted

**Symptom:** "Connect Health App" button appears instead of "Sync Health Data"

**Solution:**
1. Tap the "Connect Health App" button
2. Grant permission for Steps (Read) and Water (Read/Write)
3. The button should change to "Sync Health Data"

**Manual check:**
1. Open **Settings** app on iPhone
2. Go to **Privacy & Security** → **Health**
3. Select **Family Goals**
4. Verify:
   - Steps: **Allow to Read** ✓
   - Water: **Allow to Read and Write** ✓

### 4. No Step Data in Health App

**Symptom:** Sync completes successfully but shows 0 steps

**Solution:**
1. Open **Health** app on iPhone
2. Go to **Browse** → **Activity** → **Steps**
3. Verify there is step data for today
4. If no data:
   - iPhone needs to be carried/moved to track steps
   - Or manually add step data: Tap **Add Data** in Health app

### 5. API Server Not Configured

**Symptom:** Logs show "HealthKit returned X steps" but then API sync fails

**Solution:**
1. In the app, go to **Settings** (if available) or check console logs
2. Verify the API base URL is set correctly:
   - For production: `https://your-app.vercel.app/api`
   - For local testing: `http://localhost:3000/api`
3. Update in code: `APIService.swift` → `setBaseURL(_:)` method

**Check console logs for:**
```
🌐 Base URL: http://localhost:3000/api  ← Should be your Vercel URL
```

### 6. Authentication Token Missing

**Symptom:** API returns 401 Unauthorized error

**Console output:**
```
🔑 Token present: false  ← Should be true
❌ Error: Unauthorized
```

**Solution:**
1. Log out and log back in to refresh the token
2. Check that login flow properly stores the token in UserDefaults

## How to View Console Logs

### Method 1: Xcode Console (Recommended)
1. Connect iPhone to Mac via USB
2. Open Xcode
3. Run the app from Xcode (⌘R)
4. View logs in the bottom console panel
5. Filter by typing "HealthKit" or "SYNC STEPS"

### Method 2: Console App
1. Connect iPhone to Mac via USB
2. Open **Console.app** (in Applications/Utilities/)
3. Select your iPhone from the sidebar
4. Filter by process name: "FamilyGoals"
5. Tap sync button in app and watch logs

## Expected Log Flow for Successful Sync

```
📊 HealthKit authorization status: 2
✅ HealthKit authorization: AUTHORIZED
HealthKit authorized: true

🔄 ========== SYNC STEPS STARTED ==========
👤 Member ID: [uuid]
🔐 HealthKit authorized: true
📱 Calling fetchTodaySteps()...
📱 fetchTodaySteps() called
👟 Fetching steps for date: 2026-01-06 12:00:00 +0000
📅 Query range: 2026-01-06 00:00:00 +0000 to 2026-01-07 00:00:00 +0000
🔍 Executing HealthKit query...
✅ HealthKit returned 5432 steps
📱 fetchTodaySteps() returning 5432 steps
✅ Fetched 5432 steps from HealthKit
📤 Syncing to server: memberId=[uuid], steps=5432, date=2026-01-06
🌐 API syncSteps() called
   📋 Parameters: memberId=[uuid], steps=5432, date=2026-01-06, source=healthkit
   🔑 Token present: true
   🌐 Base URL: https://your-app.vercel.app/api
✅ API syncSteps() success: ["success": true, "id": "[uuid]"]
✅ Successfully synced steps to server
🔄 Reloading dashboard...
✅ Dashboard reloaded
✅ ========== SYNC STEPS COMPLETED ==========
```

## Quick Checklist

Before testing, verify:

- [ ] HealthKit capability added in Xcode Signing & Capabilities
- [ ] Info.plist contains NSHealthShareUsageDescription and NSHealthUpdateUsageDescription
- [ ] App is running on a **physical device** (HealthKit doesn't work in Simulator)
- [ ] iPhone has step data in Health app for today
- [ ] User granted HealthKit permissions when prompted
- [ ] API base URL is configured correctly (not localhost if testing production)
- [ ] User is logged in (auth token present)
- [ ] Steps goal exists for the user in database

## Most Likely Issue

Based on the implementation, the **most common issue** is:

**HealthKit capability not added in Xcode project settings**

Even though we have:
- ✅ Info.plist configured
- ✅ Code implementation complete
- ✅ Authorization flow implemented

We still need to:
- ⚠️ Add HealthKit capability in Xcode (Signing & Capabilities tab)
- ⚠️ This creates the required entitlements file
- ⚠️ Without this, iOS will block HealthKit access

## Testing Steps

1. **Add HealthKit capability** in Xcode (if not already done)
2. **Clean build** (⌘⇧K) and rebuild (⌘B)
3. **Install fresh** on device
4. **Grant permissions** when prompted
5. **Tap "Sync Health Data"** button
6. **Check console logs** to see where it fails
7. **Share the logs** so we can identify the exact issue

## Additional Notes

- HealthKit sync is **one-way** for steps: Health app → Family Goals app
- Water sync is **bidirectional**: You can log water in the app and it saves to Health app too
- Step counts are **cumulative** for the day (HealthKit provides total)
- The API replaces previous HealthKit step entries for the same date (not additive)
