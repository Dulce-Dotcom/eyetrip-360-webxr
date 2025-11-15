# Google Analytics 4 Setup Instructions

## ✅ What's Already Done

Google Analytics 4 tracking code has been added to:
- ✅ index.html (landing page)
- ✅ video1.html (Matrix Caracas Sphere)
- ✅ video2.html (Scraptangle)
- ✅ video3.html (Shroom Zoom)
- ✅ video4.html (Stumpy Waves)
- ✅ dev.html (Development page)

## 🎯 What's Being Tracked

### Automatic Events:
- Page views (all pages)
- Page load time (performance)

### Custom VR Engagement Events:
- **intro_completed** - User clicks "Start Experience"
- **intro_skipped** - User skips the intro
- **hotspot_discovered** - User finds a hidden sound hotspot
- **all_hotspots_completed** - User finds all 10 hotspots in one video
- **vr_session_start** - User enters VR mode (Meta Quest)
- **vr_session_end** - User exits VR mode

## 📝 Setup Steps

### 1. Create Google Analytics 4 Property (10 minutes)

1. Go to https://analytics.google.com
2. Sign in with your Google account
3. Click **Admin** (gear icon in bottom left)
4. Under "Account" column, create a new account or select existing
5. Under "Property" column, click **Create Property**
6. Fill in:
   - Property name: `EyeTrip VR`
   - Time zone: Your time zone
   - Currency: USD
7. Click **Next**
8. Fill in business details (or skip)
9. Click **Create**

### 2. Get Your Measurement ID

1. In the new property, click **Data Streams**
2. Click **Add stream** → **Web**
3. Fill in:
   - Website URL: `https://eyetripvr.com`
   - Stream name: `EyeTrip VR Website`
4. Click **Create stream**
5. Copy your **Measurement ID** (looks like `G-XXXXXXXXXX`)

### 3. Update Your Code

Replace `G-XXXXXXXXXX` with your actual Measurement ID in these files:
- index.html (line ~84)
- video1.html (line ~24)
- video2.html (line ~24)
- video3.html (line ~24)
- video4.html (line ~24)
- dev.html (line ~12)

**Find and replace:**
```bash
cd /Users/dulce303/eyetrip-360-webxr/public_html
find . -name "*.html" -type f -exec sed -i '' 's/G-XXXXXXXXXX/G-YOUR-ACTUAL-ID/g' {} +
```

Replace `G-YOUR-ACTUAL-ID` with your real ID.

### 4. Deploy Changes

```bash
cd /Users/dulce303/eyetrip-360-webxr/public_html
yes y | bash deploy-siteground.sh
```

### 5. Test Tracking (5 minutes)

1. Go to GA4 → **Reports** → **Realtime**
2. Visit your site: https://eyetripvr.com
3. You should see yourself as an active user
4. Try clicking around, discovering hotspots
5. Check **Events** in Realtime to see your custom events

## 📊 What You'll See in GA4

### Standard Reports:
- **Realtime**: Live visitors right now
- **Engagement**: Page views, time on page, scrolls
- **User Acquisition**: How people find your site
- **Demographics**: Age, gender, location
- **Technology**: Browser, device, OS

### Custom VR Events:
Go to **Reports** → **Engagement** → **Events** to see:
- intro_completed (how many start the experience)
- hotspot_discovered (total hotspot finds)
- all_hotspots_completed (completion rate)
- vr_session_start (VR adoption rate)
- vr_session_end (average VR session time)

## 🎯 For Chroma Awards Submission

Include these metrics in your submission:
1. Total unique visitors
2. Average time on site
3. VR session conversion rate (% who enter VR)
4. Hotspot discovery rate (average hotspots per session)
5. Completion rate (% who find all 10 hotspots)

## 🔧 Advanced: Create Custom Reports

1. Go to **Explore** in GA4
2. Click **Create new exploration**
3. Add these dimensions:
   - Event name
   - Page path
   - Device category
4. Add these metrics:
   - Event count
   - Total users
   - Session duration

## 🚨 Troubleshooting

**Not seeing any data?**
- Wait 24-48 hours for full data processing
- Check that you replaced ALL instances of `G-XXXXXXXXXX`
- Clear your browser cache
- Test in incognito mode

**Events not showing?**
- Open browser console (F12)
- Look for "📊 Tracking:" logs
- Check for any JavaScript errors
- Make sure adblockers are disabled for testing

## 📱 Social Preview Image

Your social preview image is set to:
`https://eyetripvr.com/assets/thumbnails/eyetripvr-preview.png`

This will show when people share your site on:
- Twitter
- Facebook
- LinkedIn
- Slack
- Discord

Make sure this image is:
- 1200 x 630 pixels
- Under 1MB file size
- Eye-catching with clear branding

---

**Need help?** Open the browser console (F12) to see tracking logs when you interact with the site.
