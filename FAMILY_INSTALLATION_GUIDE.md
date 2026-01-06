# Family Goals - Family Installation Guide

This guide explains how to install the Family Goals app on your family members' iPhones.

## Prerequisites

Before you can install on family devices, you need:
- ✅ Mac with Xcode installed
- ✅ Working Family Goals iOS project (completed)
- ✅ Apple ID (free or paid developer account)
- ✅ USB cable to connect iPhones to your Mac

## Option 1: Direct Installation (Free - Recommended for Testing)

This method is **free** but apps expire after 7 days with a free Apple ID.

### Step 1: Prepare Your Mac

1. **Open Xcode project:**
   ```bash
   cd /Users/Naiti/Documents/Documents_NBMacBookPro/family-goals/ios
   open FamilyGoals.xcodeproj
   ```

2. **Sign in with your Apple ID:**
   - Xcode → Settings (⌘,)
   - Go to **Accounts** tab
   - Click **+** → Sign in with Apple ID
   - Close Settings

### Step 2: Configure Code Signing

1. In Xcode, select **FamilyGoals** project (top of navigator)
2. Select **FamilyGoals** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple ID)
6. Verify **Bundle Identifier** is unique (e.g., `com.yourname.FamilyGoals`)

### Step 3: Install on Family Member's iPhone

**For Each Family Member:**

1. **Connect their iPhone to your Mac** with USB cable

2. **Trust the computer:**
   - On their iPhone: Tap "Trust This Computer"
   - Enter their iPhone passcode

3. **Select their device in Xcode:**
   - Click the device selector (top toolbar, near Run button)
   - Select their iPhone from the list

4. **Build and Run:**
   - Click the **Run button** (▶️) or press **⌘R**
   - Wait for build to complete (1-2 minutes first time)
   - Xcode will install and launch the app

5. **Trust the Developer Certificate:**
   - On their iPhone, you'll see an error: "Untrusted Developer"
   - Go to **Settings** → **General** → **VPN & Device Management**
   - Under "Developer App", tap your Apple ID email
   - Tap **Trust "[Your Name]"**
   - Tap **Trust** again to confirm

6. **Launch the app:**
   - The app icon will appear on their home screen
   - Open the app normally

### Step 4: Repeat for Each Device

Repeat Step 3 for each family member's iPhone. The app will be installed separately on each device.

### Important Notes (Free Apple ID):

**App Expiration:**
- Apps expire after **7 days**
- After 7 days, you'll need to reconnect the iPhone and reinstall
- All app data (goals, progress) is stored on the server, so it won't be lost

**Device Limit:**
- Free accounts can only install on **3 devices** at a time
- To add a 4th device, you'll need to remove one or upgrade to paid account

**Workaround for 7-Day Limit:**
- Set a calendar reminder every 6 days to reinstall
- Or upgrade to Apple Developer Program ($99/year) for 1-year certificates

---

## Option 2: Apple Developer Program (Paid - Best Long-Term)

If you plan to use this app long-term with your family, I recommend upgrading to the Apple Developer Program.

### Benefits:
- ✅ Apps last **1 year** before needing reinstall
- ✅ Support for **unlimited devices**
- ✅ TestFlight distribution (easier for family)
- ✅ App Store publishing (if you want to share publicly)

### How to Upgrade:

1. **Enroll in Apple Developer Program:**
   - Visit: https://developer.apple.com/programs/
   - Click **Enroll**
   - Sign in with your Apple ID
   - Complete enrollment ($99/year)
   - Wait for approval (usually 24-48 hours)

2. **Use TestFlight for Distribution:**

   Once enrolled, you can use TestFlight instead of direct installation:

   **Setup (One Time):**
   1. Open https://appstoreconnect.apple.com
   2. Create new app listing
   3. Upload build from Xcode (Archive → Distribute)
   4. Go to TestFlight tab
   5. Add family members by email

   **For Family Members:**
   1. Install TestFlight app from App Store
   2. Check email for invitation
   3. Tap invitation link
   4. Install Family Goals from TestFlight

   **Benefits:**
   - No USB cable needed
   - Automatic updates when you push new versions
   - Apps last 90 days, auto-renewed when you upload new build
   - Much easier for non-technical family members

---

## Option 3: Ad Hoc Distribution (Advanced)

For developers comfortable with provisioning profiles and .ipa files.

### Requirements:
- Apple Developer Program ($99/year)
- Device UDIDs registered in Developer Portal
- Ad Hoc provisioning profile

### Steps:

1. **Get Device UDIDs:**
   - Connect each iPhone to Mac
   - Open Finder → Select iPhone → Click device info until UDID appears
   - Copy UDID for each device

2. **Register Devices:**
   - Go to https://developer.apple.com/account/resources/devices
   - Click **+** → Register each device with UDID

3. **Create Provisioning Profile:**
   - Go to Profiles section
   - Create new **Ad Hoc** profile
   - Select all registered devices
   - Download profile

4. **Archive and Export:**
   - In Xcode: Product → Archive
   - Select archive → Distribute App
   - Choose **Ad Hoc**
   - Export .ipa file

5. **Install on Devices:**
   - Use Apple Configurator 2 (Mac App Store)
   - Or use third-party tools like AltStore, Sideloadly

**Pros:** Apps last 1 year, no Xcode needed after export
**Cons:** More technical setup, requires managing provisioning profiles

---

## Troubleshooting

### "Could not launch [App Name]"
**Solution:** Trust the developer certificate in Settings → General → VPN & Device Management

### "App expired" (after 7 days with free account)
**Solution:** Reconnect iPhone to Mac and rebuild/run in Xcode

### "Unable to verify app"
**Cause:** iPhone lost internet connection during first launch
**Solution:** Connect to WiFi and tap "Verify App" in Settings

### "This app cannot be installed because its integrity could not be verified"
**Solution:** Delete app, rebuild with latest Xcode, reinstall

### "No code signing identities found"
**Solution:**
1. Xcode → Settings → Accounts
2. Select your Apple ID → Manage Certificates
3. Click **+** → iOS Development
4. Try building again

### Device shows as "Unavailable" in Xcode
**Cause:** Device iOS version is newer than Xcode supports
**Solution:** Update Xcode to latest version, or lower deployment target

---

## Quick Reference

### Free Apple ID
- **Cost:** Free
- **Install method:** USB + Xcode
- **App duration:** 7 days
- **Device limit:** 3
- **Best for:** Testing, short-term use

### Paid Developer Program
- **Cost:** $99/year
- **Install method:** TestFlight (easiest) or USB + Xcode
- **App duration:** 1 year (direct) or 90 days auto-renewed (TestFlight)
- **Device limit:** Unlimited
- **Best for:** Long-term family use, multiple devices

---

## Getting Started

**Immediate Next Steps:**

1. **Build and install on YOUR iPhone first** to test everything works
2. **If it works well**, install on 1-2 family member devices to test
3. **After successful testing**, decide:
   - Keep using free method (reinstall weekly)
   - Upgrade to paid account for easier distribution

**Need Help?**
- Check the main README for app usage instructions
- See XCODE_SETUP.md for Xcode configuration help
- See HEALTHKIT_TROUBLESHOOTING.md for HealthKit issues

---

## Summary

**Simplest path for most families:**
1. Start with **free direct installation** to test
2. If you like the app and use it regularly → **upgrade to Developer Program**
3. Set up **TestFlight** for easy distribution to family
4. Enjoy automatic updates and no reinstall hassles

Good luck, and enjoy tracking your family goals together!
