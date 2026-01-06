# Family Goals - Family Installation Guide

This guide explains how to install the Family Goals app on your family members' iPhones.

## ✅ You're Enrolled in Apple Developer Program

Great! With your Apple Developer Program membership ($99/year), you have the best distribution options available.

## Recommended: TestFlight Distribution (Easiest for Family)

TestFlight is Apple's official beta testing platform - perfect for distributing to family members.

### Why TestFlight?
- ✅ **No USB cable needed** - family installs via link
- ✅ **Apps last 90 days** (auto-renewed with each build)
- ✅ **Automatic updates** when you push new versions
- ✅ **Unlimited devices** - entire family can install
- ✅ **Professional experience** - looks like App Store
- ✅ **Easy for non-technical users**

---

## Part 1: Set Up TestFlight (One-Time Setup)

### Step 1: Prepare Your App in Xcode

1. **Open Xcode project:**
   ```bash
   cd /Users/Naiti/Documents/Documents_NBMacBookPro/family-goals/ios
   open FamilyGoals.xcodeproj
   ```

2. **Configure Signing:**
   - Select **FamilyGoals** project in navigator
   - Select **FamilyGoals** target
   - Go to **Signing & Capabilities** tab
   - Check **"Automatically manage signing"**
   - Select your **Team** (Apple Developer Program account)
   - Verify **Bundle Identifier** is unique (e.g., `com.yourname.FamilyGoals`)

3. **Set Version and Build Number:**
   - In **General** tab, set:
     - **Version**: 1.0.0 (your app version)
     - **Build**: 1 (increment this with each upload)

### Step 2: Create App Store Connect Listing

1. **Go to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com
   - Sign in with your Apple Developer account

2. **Create New App:**
   - Click **My Apps** → **+ (Add)** → **New App**
   - Fill in:
     - **Platform**: iOS
     - **Name**: Family Goals
     - **Primary Language**: English
     - **Bundle ID**: Select your bundle ID from dropdown
     - **SKU**: familygoals (unique identifier)
     - **User Access**: Full Access
   - Click **Create**

3. **Complete Required Information:**
   - Go to **App Information** section
   - Set:
     - **Category**: Productivity or Health & Fitness
     - **Privacy Policy URL**: (optional for TestFlight)
   - Save changes

### Step 3: Archive and Upload Your App

1. **In Xcode, select destination:**
   - Top toolbar: Select **Any iOS Device (arm64)** (not a specific device or simulator)

2. **Archive the app:**
   - **Product** → **Archive** (or ⌘⇧B then Product → Archive)
   - Wait for archive to complete (2-5 minutes)
   - Xcode Organizer window will open automatically

3. **Distribute the archive:**
   - Click **Distribute App**
   - Select **TestFlight & App Store**
   - Click **Next**
   - Select **Upload** (not Export)
   - Click **Next** through all screens (keep defaults)
   - Click **Upload**
   - Wait for upload to complete (5-10 minutes)

4. **Wait for Processing:**
   - Go back to App Store Connect
   - Click your app → **TestFlight** tab
   - Under **iOS Builds**, you'll see your build processing
   - Wait for status to change from "Processing" to "Ready to Test" (10-30 minutes)

### Step 4: Set Up TestFlight Beta Testing

1. **Create Internal Testing Group (Optional - for immediate testing):**
   - In **TestFlight** tab, click **Internal Testing** (left sidebar)
   - Click **+** to create group
   - Name it "Family" or "Internal Testers"
   - Add build by clicking **+** next to Builds
   - Select your build (e.g., 1.0.0d (1))
   - Add testers (must have "Admin", "App Manager", or "Developer" role in App Store Connect)

2. **Create External Testing Group (For family members):**
   - Click **External Testing** (left sidebar)
   - Click **+** to create group
   - Name it "Family Testers"
   - Add build by clicking **+** next to Builds
   - Select your build

3. **Add Family Members as Testers:**
   - In your External Testing group, click **Add Testers**
   - Enter email addresses of family members (one per line)
   - Click **Add**
   - Family members will receive invitation emails

---

## Part 2: Family Members Install the App

### For Each Family Member:

1. **Install TestFlight App:**
   - Open **App Store** on their iPhone
   - Search for **"TestFlight"**
   - Install the official TestFlight app (blue icon with plane)

2. **Accept Invitation:**
   - Check email for "You're Invited to Test Family Goals"
   - Tap **View in TestFlight** button
   - Or tap the invitation link you shared with them

3. **Install Family Goals:**
   - TestFlight app will open
   - Tap **Accept** to join the beta
   - Tap **Install**
   - Wait for installation to complete

4. **Launch the App:**
   - App icon appears on home screen (has orange dot indicating beta)
   - Open normally like any App Store app
   - Create account or sign in

### That's It!
- No USB cables needed
- No developer certificate trusting required
- App works just like App Store apps

---

## Part 3: Updating the App (Pushing New Versions)

When you fix bugs or add features:

1. **Increment Build Number:**
   - In Xcode: **General** tab → **Build** field
   - Increase by 1 (e.g., 1 → 2, 2 → 3)
   - Version can stay same (e.g., 1.0.0) unless it's a major update

2. **Archive and Upload:**
   - Repeat "Archive and Upload" steps from Part 1, Step 3
   - Select **Any iOS Device (arm64)**
   - Product → Archive
   - Distribute App → TestFlight & App Store → Upload

3. **Family Members Get Update:**
   - TestFlight will notify them of the update
   - They can enable auto-update in TestFlight settings
   - Or manually tap **Update** in TestFlight app

---

## Alternative: Direct Installation (USB Cable Method)

If you need to test on a device immediately (before TestFlight processing completes), you can still use direct installation:

### Quick Direct Install Steps:

1. **Connect iPhone to Mac** with USB cable
2. **In Xcode**: Select the connected iPhone in device selector
3. **Click Run** (▶️) or press **⌘R**
4. **On iPhone**: Settings → General → VPN & Device Management → Trust developer
5. **Launch app** from home screen

**Note:** With Apple Developer Program:
- Apps last **1 year** (not 7 days like free accounts)
- **Unlimited devices** supported
- Good for immediate testing, but TestFlight is better for long-term

---

## Troubleshooting

### "No signing certificate found"
**Solution:**
1. Xcode → Settings → Accounts
2. Select your Apple ID
3. Click **Manage Certificates**
4. Click **+** → **Apple Distribution**
5. Try archiving again

### "Build processing failed" in App Store Connect
**Solution:**
1. Check email for details from Apple
2. Usually an issue with:
   - Missing app icon sizes
   - Invalid provisioning profile
   - Code signing issues
3. Fix issues in Xcode, increment build number, re-archive and upload

### Family member can't install from TestFlight
**Solution:**
- Verify their email is added as a tester in App Store Connect
- Check if they received invitation email (check spam folder)
- Make sure they have iOS 16+ installed
- Resend invitation from App Store Connect

### "This beta is full"
**Solution:**
- TestFlight allows 10,000 external testers - you won't hit this limit
- If you see this, check you've added them to the correct testing group

### App expired after 90 days
**Solution:**
- Upload a new build to App Store Connect (same version, just new build number)
- Family members will automatically get extended access
- Or publish to App Store for unlimited duration

---

## Going Further: App Store Release (Optional)

If you want to publish Family Goals to the public App Store:

1. **Complete App Information:**
   - Screenshots (required - take from iPhone)
   - App description
   - Keywords
   - Support URL
   - Privacy policy

2. **Submit for Review:**
   - In App Store Connect: Select your app
   - Go to **App Store** tab (not TestFlight)
   - Add screenshots and details
   - Select build
   - Click **Submit for Review**

3. **Review Process:**
   - Takes 1-3 days typically
   - Apple will test your app
   - If approved, you can release to App Store

4. **Benefits:**
   - Anyone can download
   - No expiration
   - Professional distribution
   - Searchable in App Store

---

## Quick Reference

### TestFlight Limits:
- **External testers**: 10,000 max (way more than you need)
- **Internal testers**: 100 max (only for App Store Connect team members)
- **Build expiration**: 90 days (auto-renewed with new build)
- **iOS version**: Requires iOS 16+ (same as your app)

### Best Practices:
1. **Start with TestFlight** - easiest for family
2. **Upload new builds regularly** to keep 90-day timer fresh
3. **Enable auto-update** for family members in TestFlight
4. **Increment build number** with each upload
5. **Add release notes** in TestFlight so family knows what changed

---

## Summary

**Recommended Path:**

1. ✅ **Set up TestFlight** (one-time setup, ~1 hour)
2. ✅ **Archive and upload** first build (~30 minutes)
3. ✅ **Add family as testers** (~5 minutes)
4. ✅ **Family installs TestFlight** and app (~5 minutes per person)
5. ✅ **Update when needed** by uploading new builds

**Benefits:**
- Professional distribution
- No USB cables
- Automatic updates
- Unlimited devices
- No reinstall hassles
- Just like App Store experience

Enjoy tracking goals with your family! 🎉
