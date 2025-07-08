# Mapbox Setup Guide for Walkly

This guide will help you set up Mapbox integration for Walkly's map features including route generation, real-time tracking, and moment pinning.

## 1. Create a Mapbox Account

1. Visit [mapbox.com](https://mapbox.com)
2. Sign up for a free account
3. Navigate to your [Account Dashboard](https://account.mapbox.com/)

## 2. Get Your Access Token

1. In your Mapbox dashboard, go to **Access Tokens**
2. Copy your **Default Public Token** or create a new one
3. For production, consider creating a token with restricted scopes

### Token Scopes (Recommended)
- `styles:read` - For map styling
- `fonts:read` - For map fonts  
- `datasets:read` - For custom data
- `directions:read` - For route generation

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Mapbox access token:
   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbG...
   ```

3. Add your Supabase credentials (if not already configured):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## 4. Apply Database Migrations

Run the database migration to create the necessary tables:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and run the contents of `migrations/enhance_profile_features.sql`

This will create:
- `walks_enhanced` table for tracking walks
- `walk_moments` table for storing moment pins
- Proper RLS policies for data security

## 5. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/map` in your application
3. Allow location permissions when prompted
4. Verify the map loads correctly

## Troubleshooting Network Issues

### Common Error: `ERR_CONNECTION_RESET`

If you're seeing connection reset errors when trying to load the map or generate routes, try these solutions:

#### **Immediate Solutions:**
1. **Check your internet connection**
   ```bash
   # Test basic connectivity
   ping google.com
   ping api.mapbox.com
   ```

2. **Disable VPN/Proxy temporarily**
   - Many VPNs and corporate proxies block map service APIs
   - Try disabling VPN and testing again

3. **Switch networks**
   - Try switching from WiFi to mobile data (or vice versa)
   - Corporate/school networks often block external APIs

4. **Clear browser cache and restart**
   - Clear browser cache, cookies, and restart the browser
   - Try in incognito/private mode

#### **Advanced Diagnostics:**

1. **Test Mapbox API directly:**
   ```bash
   # Replace YOUR_TOKEN with your actual token
   curl -I "https://api.mapbox.com/styles/v1/mapbox?access_token=YOUR_TOKEN"
   ```

2. **DNS Issues:**
   ```bash
   # Try alternative DNS servers
   nslookup api.mapbox.com 8.8.8.8
   ```

3. **Firewall/Corporate Network:**
   - Contact your network administrator
   - Mapbox APIs need access to:
     - `api.mapbox.com` (port 443)
     - `events.mapbox.com` (port 443)

#### **Network-Specific Solutions:**

**Corporate Networks:**
- Add `*.mapbox.com` to allowlist
- Configure proxy settings if required
- May need to request API access from IT department

**Public WiFi:**
- Try mobile data instead
- Some public networks block map APIs

**International Users:**
- Some countries may block or restrict map services
- Try using a reliable VPN server in a different region

#### **Browser-Specific Issues:**

**Chrome/Edge:**
- Check Developer Tools → Console for detailed errors
- Disable extensions that might block requests
- Clear site data for localhost

**Firefox:**
- Check if Enhanced Tracking Protection is blocking requests
- Go to about:config and check network settings

**Safari:**
- Check Intelligent Tracking Prevention settings
- Allow cross-site tracking for development

### **Developer Testing Tools:**

Add this to your browser console to test Mapbox connectivity:

```javascript
// Test basic Mapbox API connectivity
fetch('https://api.mapbox.com/ping')
  .then(response => console.log('Mapbox API Status:', response.status))
  .catch(error => console.error('Mapbox API Error:', error));

// Test your specific token
const token = 'YOUR_MAPBOX_TOKEN_HERE';
fetch(`https://api.mapbox.com/styles/v1/mapbox?access_token=${token}`)
  .then(response => console.log('Token Status:', response.status))
  .catch(error => console.error('Token Error:', error));
```

### **Environment-Specific Solutions:**

**Windows:**
- Check Windows Firewall settings
- Ensure Windows Defender isn't blocking requests
- Try running as administrator

**macOS:**
- Check System Preferences → Security & Privacy
- Ensure Little Snitch (if installed) isn't blocking connections

**Linux:**
- Check iptables/ufw firewall rules
- Verify DNS resolution: `systemd-resolve --status`

## Features Included

### ✅ Map Display
- Responsive Mapbox GL JS integration
- Light/dark theme support
- User location tracking with custom marker
- Enhanced error handling and network diagnostics

### ✅ Route Generation
- Circular walking routes based on duration
- Mapbox Directions API integration
- Multiple complexity levels (simple, medium, complex)
- Retry mechanisms and timeout handling

### ✅ Real-time Walk Tracking
- Live GPS breadcrumb trail
- Walk session management (start/pause/resume/end)
- Live statistics (time, distance, pace, speed)

### ✅ Moment Pinning
- Tap-to-pin moments during walks
- Photo upload support (via Supabase Storage)
- Descriptive notes for each moment

### ✅ Data Persistence
- All walks saved to Supabase
- Walk history and statistics
- Moment photos stored securely

### ✅ Network Resilience
- Automatic connectivity detection
- Retry mechanisms with exponential backoff
- User-friendly error messages
- Offline state handling

## API Limits

### Mapbox Free Tier
- 50,000 map loads per month
- 100,000 Directions API requests per month
- 200,000 geocoding requests per month

For production apps with high usage, consider upgrading to a paid plan.

## Next Steps

1. **Customize Map Styling**: Create custom map styles in Mapbox Studio
2. **Add Offline Support**: Implement map caching for offline usage
3. **Enhanced Analytics**: Add more detailed walk analytics and insights
4. **Social Features**: Enable walk sharing and community features

## Need Help?

- Check the [Mapbox documentation](https://docs.mapbox.com/)
- Review Supabase setup at [supabase.com/docs](https://supabase.com/docs)
- Test network connectivity using the diagnostic tools above
- Open an issue in this repository for Walkly-specific problems 