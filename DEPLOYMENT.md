# Deployment Guide for RainInsight

## Social Media Preview Setup

### What's Already Done ✅
- Open Graph meta tags configured
- Twitter Card meta tags configured
- Custom Open Graph image created (`/public/og-image.svg`)
- Favicon created (`/public/favicon.svg`)
- Comprehensive metadata setup

### What You Need to Update Before Deployment

#### 1. Update Domain URLs
In `app/layout.tsx`, replace the placeholder URLs with your actual domain:

```typescript
metadataBase: new URL('https://your-actual-domain.vercel.app'),
// and
url: 'https://your-actual-domain.vercel.app',
```

#### 2. Update Twitter Handles (Optional)
If you have Twitter accounts, update these in `app/layout.tsx`:

```typescript
creator: '@yourtwitterhandle',
site: '@yourtwitterhandle',
```

#### 3. Google Search Console Verification (Optional)
If you want to verify your site with Google Search Console, add your verification code:

```typescript
verification: {
  google: 'your-google-verification-code',
},
```

### How Social Media Previews Work

When someone shares your website link on:
- **Facebook/LinkedIn**: Shows the Open Graph image with title and description
- **Twitter**: Shows the Twitter Card with large image preview
- **WhatsApp/Telegram**: Shows the Open Graph image and description
- **Discord/Slack**: Shows the Open Graph image and description

### Preview Your Social Media Cards

You can test how your links will appear using these tools:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Files Created
- `public/og-image.svg` - Social media preview image (1200x630px)
- `public/favicon.svg` - Website favicon
- Updated `app/layout.tsx` with comprehensive metadata

### Deployment Steps
1. Update the domain URLs in `app/layout.tsx`
2. Deploy to Vercel
3. Test social media previews using the tools above
4. Share your link and enjoy beautiful previews! 🎉

## Features Included
- ✅ Professional Open Graph image
- ✅ Twitter Card support
- ✅ Favicon for browsers
- ✅ SEO-optimized metadata
- ✅ Search engine indexing
- ✅ Mobile-friendly previews 