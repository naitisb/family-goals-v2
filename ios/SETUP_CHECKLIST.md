# Xcode Project Setup Checklist

✅ **COMPLETED:**
- [x] Created new Xcode project at `/ios/FamilyGoals/`
- [x] Copied all Swift source files to project folder
- [x] All files are in correct locations:
  - APIService.swift
  - ContentView.swift
  - FamilyGoalsApp.swift
  - HealthKitManager.swift
  - Info.plist
  - FamilyGoals.entitlements
  - Models.swift
  - Views/ folder with all view files

## 📋 NEXT STEPS IN XCODE:

### 1. Add Files to Xcode Target
Open Xcode and make sure all files are added to the target:

1. Open `/ios/FamilyGoals/FamilyGoals.xcodeproj` in Xcode
2. In **Project Navigator** (left sidebar), check if you see:
   - ✓ FamilyGoalsApp.swift
   - ✓ APIService.swift
   - ✓ HealthKitManager.swift
   - ✓ Models.swift
   - ✓ ContentView.swift
   - ✓ Views/ folder
   - ✓ FamilyGoals.entitlements
   - ✓ Info.plist

3. **If any files are missing:**
   - Right-click the **FamilyGoals** folder (blue icon)
   - Select **"Add Files to FamilyGoals..."**
   - Navigate to the file
   - **UNCHECK** "Copy items if needed"
   - **CHECK** "FamilyGoals" target
   - Click **Add**

### 2. Add HealthKit Capability

1. Select **FamilyGoals** project in navigator (top item)
2. Select **FamilyGoals** target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability** (top left)
5. Search for "HealthKit"
6. Add **HealthKit**

You should see:
```
HealthKit
  ✓ com.apple.developer.healthkit
```

### 3. Configure Build Settings for Entitlements

1. Still in **FamilyGoals** target
2. Go to **Build Settings** tab
3. Search for: **"Code Signing Entitlements"**
4. Set value to: `FamilyGoals/FamilyGoals.entitlements`

### 4. Verify Info.plist Configuration

1. In **FamilyGoals** target
2. Go to **Info** tab
3. Verify these keys exist (or add them):
   - **Privacy - Health Share Usage Description**
     - Value: "Family Goals would like to read your step count and water intake to help you track your daily activity and hydration goals."
   - **Privacy - Health Update Usage Description**
     - Value: "Family Goals would like to save your water intake to the Health app so all your health data stays in sync."

If they don't appear in the Info tab, the Info.plist file should already have them.

### 5. Clean and Build

1. **Product** → **Clean Build Folder** (⌘⇧K)
2. **Product** → **Build** (⌘B)
3. Fix any build errors (there shouldn't be any)

### 6. Run on iPhone

1. Connect your iPhone via USB
2. Select your iPhone in the destination selector (top bar)
3. Click **Run** (▶️) or press ⌘R
4. If prompted, trust the developer on your iPhone:
   - **Settings** → **General** → **VPN & Device Management**
   - Tap your developer account
   - Tap **Trust**
5. Run the app again

### 7. Grant HealthKit Permissions

When the app launches:
1. It should immediately show a HealthKit permission dialog
2. **Turn ON:**
   - Steps (Read)
   - Water (Read and Write)
3. Tap **Allow**

### 8. Test Step Sync

1. Make sure you have step data in the Health app (walk around or add manually)
2. Go to the dashboard in the app
3. You should see **"Sync Health Data"** button
4. Tap it
5. Open Xcode console (⌘⇧Y) to see detailed logs

### 9. Check Console Logs

Look for these messages in the Xcode console:

**Success:**
```
✅ HealthKit authorization: AUTHORIZED
🔄 ========== SYNC STEPS STARTED ==========
✅ HealthKit returned [number] steps
✅ Successfully synced steps to server
✅ ========== SYNC STEPS COMPLETED ==========
```

**If you see errors:**
```
❌ HealthKit is NOT available on this device
   → You're on Simulator - use real iPhone

❌ HealthKit authorization: Denied by user
   → Settings → Privacy → Health → Family Goals → Enable

❌ HealthKit is not authorized
   → Tap "Connect Health App" button
```

## 🎯 Common Issues

### Issue: "Connect Health App" button instead of "Sync Health Data"
**Solution:** HealthKit not authorized - tap the button to grant permission

### Issue: Build fails with "Missing entitlements"
**Solution:** Check Build Settings → Code Signing Entitlements is set correctly

### Issue: App crashes on launch
**Solution:** Check Info.plist has HealthKit usage descriptions

### Issue: Sync shows 0 steps
**Solution:** Add step data in Health app or walk around with your iPhone

## 📱 API Configuration

Don't forget to set the API base URL! The app defaults to `http://localhost:3000/api`.

For production, you'll need to update it to your Vercel URL:
- Check `APIService.swift` line 27-29
- The app reads from UserDefaults key `"apiBaseURL"`
- You may need to add a settings screen to let users configure this

Or hardcode it temporarily:
```swift
private var baseURL: String {
    "https://your-app.vercel.app/api"  // Your actual Vercel URL
}
```

## ✅ Success Criteria

You'll know it's working when:
- [x] App builds without errors
- [x] App runs on your iPhone
- [x] HealthKit permission dialog appears on first launch
- [x] Dashboard shows "Sync Health Data" button
- [x] Tapping sync shows your actual step count from Health app
- [x] Console logs show successful sync messages
- [x] Steps appear in the dashboard UI after sync

Good luck! 🚀
