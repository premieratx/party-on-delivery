# Party on Delivery Template Setup Guide

This guide will help you recreate this project as a template in a new Lovable project and Supabase database.

## Prerequisites

- Lovable account
- Supabase account
- Shopify store with admin API access
- Stripe account
- Google Maps API key
- Resend account for emails

## Step 1: Create New Lovable Project

1. Go to [lovable.dev](https://lovable.dev)
2. Click "Create New Project"
3. Choose a template or start from scratch

## Step 2: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and configure project settings
4. Wait for project to be created

## Step 3: Set Up Database Schema

1. In your new Supabase project, go to SQL Editor
2. Copy and run the contents of `supabase/migrations/00000000000000_template_setup.sql`
3. This will create all tables, policies, triggers, and functions

## Step 4: Copy Code to New Lovable Project

Copy all files from this project to your new Lovable project, paying special attention to:

### Core Application Files
- `src/` - All React components and hooks
- `supabase/functions/` - All edge functions
- `supabase/config.toml` - Supabase configuration
- `tailwind.config.ts` - Design system configuration
- `index.css` - Design tokens and styles

### Assets
- `src/assets/` - All images and static files

## Step 5: Configure Supabase Integration

1. Update `src/integrations/supabase/client.ts` with your new project details:
   - SUPABASE_URL
   - SUPABASE_PUBLISHABLE_KEY

## Step 6: Set Up Supabase Secrets

In your new Supabase project, go to Settings > Edge Functions and add these secrets:

### Required Secrets
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN` - Shopify Admin API token
- `SHOPIFY_STORE_URL` - Your Shopify store URL
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Shopify Storefront API token
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `RESEND_API_KEY` - Resend API key for emails
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SUPABASE_DB_URL` - Your Supabase database URL

## Step 7: Update Stripe Configuration

Update `src/components/payment/StripeProvider.tsx` with your new Stripe publishable key.

## Step 8: Configure Edge Functions

The following edge functions will be automatically deployed:
- `calculate-delivery-distance`
- `create-checkout`
- `create-payment-intent`
- `create-shopify-order`
- `fetch-shopify-products`
- `get-all-collections`
- `send-order-confirmation`

Ensure all are properly configured in `supabase/config.toml`.

## Step 9: Test the Setup

1. Deploy your new Lovable project
2. Test basic functionality:
   - Product loading from Shopify
   - Address input and validation
   - Cart functionality
   - Checkout flow
   - Payment processing
   - Order confirmation emails

## Key Features Included

### Frontend
- React + TypeScript
- Tailwind CSS with custom design system
- Responsive design for mobile and desktop
- Address autocomplete with Google Places
- Real-time delivery fee calculation
- Stripe payment integration
- Order tracking and history

### Backend (Supabase)
- Product caching from Shopify
- Customer profiles and delivery addresses
- Order grouping for delivery bundling
- Distance-based delivery pricing
- Email confirmations via Resend
- 30-day data persistence
- Automatic cache cleanup

### Business Logic
- Dynamic delivery fee calculation based on distance
- Order bundling for efficient delivery
- Customer address management
- Product collection management
- Collection rules system for cross-build consistency

## Collection Rules System

The template includes a `collection_rules` table to share business rules across builds:

**Rule #1**: All collections in use should be refreshed as soon as they're added to ensure up-to-date contents, newly re-synced with Shopify.

Add new rules as needed using the Supabase dashboard.

## Support

For questions about this template setup, refer to:
- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- Template-specific issues can be resolved by examining the original project structure

---

**Note**: This template is designed for alcohol/beverage delivery with age verification, but can be adapted for other delivery services by modifying the product categories and verification flows.