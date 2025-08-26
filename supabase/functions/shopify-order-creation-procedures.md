# Shopify Order Creation Standard Operating Procedures

## Document Information
- **Version**: 1.0
- **Last Updated**: 2025-01-26  
- **Created By**: System Admin
- **Purpose**: Comprehensive procedures for accurate Shopify order creation

## Overview
This document outlines the standard procedures for creating Shopify orders from delivery app purchases to ensure accurate calculations, proper inventory tracking, and complete order information.

## Critical Requirements

### 1. Financial Accuracy
**Problem Solved**: Shopify showing "refund owed" due to missing fee components in line items

**Solution**: All payment components MUST be included as separate line items:
- ✅ Product subtotal (actual products)
- ✅ Delivery fee (even if $0) 
- ✅ Driver tip (if > $0)
- ✅ Sales tax (if > $0)

**Implementation**:
```javascript
// Add delivery fee as line item
if (deliveryFeeInDollars >= 0) {
  lineItems.push({
    title: "Delivery Fee",
    price: deliveryFeeInDollars.toFixed(2),
    quantity: 1,
    requires_shipping: false,
    taxable: false
  });
}

// Add driver tip as line item  
if (tipAmountInDollars > 0) {
  lineItems.push({
    title: "Driver Tip",
    price: tipAmountInDollars.toFixed(2),
    quantity: 1,
    requires_shipping: false,
    taxable: false
  });
}

// Add sales tax as line item
if (orderAmounts.sales_tax > 0) {
  lineItems.push({
    title: "Sales Tax", 
    price: orderAmounts.sales_tax.toFixed(2),
    quantity: 1,
    requires_shipping: false,
    taxable: false
  });
}
```

### 2. Address Information
**Problem Solved**: Missing delivery address in Shopify shipping address field

**Solution**: 
- Parse delivery address into street, city, state, zip components
- Populate both shipping_address and billing_address fields
- Format delivery address properly in order notes

**Implementation**:
```javascript
// Parse delivery address
const addressParts = deliveryAddress.split(',').map(p => p.trim());
const street = addressParts[0] || '';
const city = addressParts[1] || '';
const stateZip = addressParts[2] || '';
const stateParts = stateZip.split(' ');
const state = stateParts[0] || '';
const zip = stateParts.slice(1).join(' ') || '';

// Set shipping and billing addresses
shipping_address: {
  first_name: firstName,
  last_name: lastName,
  address1: street,
  city: city,
  province: state,
  country: "US", 
  zip: zip,
  phone: customerPhone
}
```

### 3. Customer Contact Information
**Problem Solved**: Missing customer contact details in Shopify

**Solution**:
- Ensure email field is populated
- Ensure phone field is populated  
- Ensure first_name and last_name are properly parsed and set

### 4. Product Inventory Tracking
**Critical Requirement**: Real Shopify products must be matched to ensure:
- ✅ Inventory tracking and updates
- ✅ Real product photos in order details
- ✅ Up-to-date pricing
- ✅ Proper product/variant identification

**Implementation**:
```javascript
// Handle Shopify product/variant IDs (clean up GIDs)
if (item.id && typeof item.id === 'string') {
  if (item.id.includes('gid://shopify/Product/')) {
    const productId = item.id.replace('gid://shopify/Product/', '');
    if (!isNaN(parseInt(productId))) {
      lineItem.product_id = parseInt(productId);
    }
  }
}

if (item.variant && typeof item.variant === 'string') {
  if (item.variant.includes('gid://shopify/ProductVariant/')) {
    const variantId = item.variant.replace('gid://shopify/ProductVariant/', '');
    if (!isNaN(parseInt(variantId))) {
      lineItem.variant_id = parseInt(variantId);
      delete lineItem.product_id; // Use variant_id instead
    }
  }
}
```

## Order Notes Format
**Standard format for delivery order notes**:

```
DELIVERY ORDER (CST) - {deliveryDate} at {deliveryTime}

📍 DELIVERY ADDRESS: 
{street}
{city}, {state} {zip}
🗒️ SPECIAL INSTRUCTIONS: {deliveryInstructions}

💰 PAYMENT BREAKDOWN:
• Subtotal: ${subtotal}
• Delivery Fee: ${deliveryFee}  
• Tax: ${salesTax}
• Driver Tip: ${tipAmount}
• TOTAL PAID: ${totalAmount}

💳 STRIPE CONFIRMATION: {paymentIntentId}
🤝 AFFILIATE: {affiliateCode}

⚠️ NOTE: Driver tip (${tipAmount}) included in total payment - not a line item.
```

## Quality Assurance Checklist

Before deploying any changes to Shopify order creation:

### Pre-Deployment Checks
- [ ] All fee components added as line items
- [ ] Shipping address properly parsed and populated
- [ ] Customer contact info (email, phone, name) populated
- [ ] Product IDs/variant IDs properly matched to Shopify catalog
- [ ] Order notes formatted with all required information
- [ ] Delivery address formatted properly in notes

### Post-Deployment Verification
- [ ] Test order shows correct total in Shopify (no refund owed)
- [ ] Shipping address populated in Shopify order details
- [ ] Customer contact info accessible in Shopify
- [ ] Real product photos visible in Shopify order
- [ ] Inventory properly decremented for ordered products
- [ ] All fee line items visible and properly categorized

## Error Prevention

### Common Issues to Avoid
1. **Missing line items**: Always include delivery fee, tip, and tax as line items
2. **Address parsing errors**: Handle various address formats gracefully
3. **Product ID mismatches**: Ensure GID cleanup and proper ID extraction
4. **Decimal precision errors**: Use .toFixed(2) for all monetary amounts
5. **Missing customer data**: Validate all required customer fields before order creation

### Validation Requirements
- Verify payment amount matches sum of all line items
- Validate address components before creating order
- Confirm product/variant IDs exist in Shopify before adding to line items
- Check that all required metadata fields are present

## Monitoring and Maintenance

### Regular Review Items
- Monitor for "refund owed" alerts in Shopify
- Verify inventory tracking accuracy
- Check customer satisfaction with delivery address accuracy
- Review order notes for completeness and formatting

### Key Metrics to Track
- Percentage of orders with accurate totals (target: 100%)
- Customer complaints about incorrect delivery information (target: 0%)
- Inventory discrepancies (target: <1%)
- Order processing errors (target: <0.1%)

## Emergency Procedures

### If Calculation Errors Occur
1. Immediately check if all fee components are included as line items
2. Verify decimal precision in all monetary calculations
3. Check for recent changes to pricing logic
4. Escalate to development team for code review

### If Address Information Missing
1. Verify address parsing logic in create-shopify-order function
2. Check metadata extraction from payment intent
3. Validate delivery address format requirements
4. Update address parsing logic if needed

---

**Document Status**: Active
**Next Review Date**: 2025-02-26
**Owner**: Development Team
**Approval**: System Admin