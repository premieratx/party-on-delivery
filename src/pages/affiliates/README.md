# Affiliate Custom Landing Pages

This directory contains custom landing pages for different affiliate partners. Each page can be completely customized with different branding, colors, messaging, and functionality.

## Available Custom Pages

### Austin Events Co
- **URL**: `/custom/austin-events`
- **Theme**: Blue/Teal gradient
- **Focus**: Austin-specific event planning

### Corporate Solutions  
- **URL**: `/custom/corporate-solutions`
- **Theme**: Professional gray/blue
- **Focus**: Business and corporate events

### Wedding Specialists
- **URL**: `/custom/wedding-specialists` 
- **Theme**: Rose/Pink romantic
- **Focus**: Wedding and special occasion services

## How to Add New Affiliate Pages

1. **Add Configuration**: Edit `src/pages/AffiliateCustomLanding.tsx` and add a new entry to the `affiliateConfigs` object:

```typescript
'your-affiliate-slug': {
  name: 'Your Affiliate Name',
  bgImage: yourBackgroundImage,
  primaryColor: 'from-color-600 to-color-600',
  welcomeText: 'Your Custom Welcome Message',
  description: 'Your custom description'
}
```

2. **Access Your Page**: Visit `/custom/your-affiliate-slug`

3. **Customize Further**: Each page can have completely different:
   - Background images/videos
   - Color schemes
   - Text and messaging
   - Product catalogs
   - Pricing structures
   - Checkout flows

## Advanced Customization

For deeper customization, you can create completely separate page files:
- `src/pages/affiliates/AustinEventsLanding.tsx`
- `src/pages/affiliates/CorporateLanding.tsx`
- etc.

Then add individual routes in `App.tsx` for each one.