# Shopify Order Structure Standard
## MANDATORY ORDER PROCESSING DOCUMENTATION

**⚠️ CRITICAL: This is the ONLY approved method for creating Shopify orders. NO deviations allowed.**

---

## Overview
This document defines the exact structure and requirements for all Shopify order creation to ensure consistent information transfer and proper order breakdown display.

## Required Order Breakdown Structure

### Visual Reference
Orders MUST display exactly as shown in customer receipts:
- **Subtotal**: Product prices only (no fees, tips, or taxes)
- **Shipping**: Delivery fee only  
- **Taxes**: Sales tax only (8.25%)
- **Tip**: Driver tip as separate line item
- **Total**: Sum of all above components

### Example Breakdown
```
Subtotal: $441.88  (products only)
Shipping: $30.00   (delivery fee)
Taxes: $38.59      (sales tax 8.25%)
Tip: $50.00        (driver tip - separate line)
Total: $560.47     (calculated total)
```

---

## Shopify API Structure (MANDATORY)

### 1. Line Items Structure
```typescript
line_items: [
  // ONLY actual products
  ...productLineItems,
  // Driver tip as separate line item (makes it show as "Tip")
  ...(tipAmount > 0 ? [{
    title: "Driver Tip",
    price: tipAmount.toFixed(2),
    quantity: 1,
    requires_shipping: false,
    taxable: false,
    gift_card: false
  }] : [])
]
```

### 2. Order Totals
```typescript
// Products subtotal ONLY (no tip included)
subtotal_price: productSubtotal.toFixed(2),
// Full total including all components  
total_price: grandTotal.toFixed(2)
```

### 3. Tax Lines (Sales Tax ONLY)
```typescript
tax_lines: salesTax > 0 ? [{
  title: "Sales Tax 8.25%", 
  price: salesTax.toFixed(2),
  rate: 0.0825
}] : []
```

### 4. Shipping Lines (Delivery Fee ONLY)
```typescript
shipping_lines: deliveryFee > 0 ? [{
  title: "Delivery Fee",
  price: deliveryFee.toFixed(2),
  code: "LOCAL_DELIVERY"
}] : []
```

---

## Address Handling Requirements

### Address Parsing Priority
1. **Object format** (JSON parsed or direct object)
2. **JSON string** (starts with '{')  
3. **Comma-separated string** (street, city, state zip)
4. **Plain text fallback**

### Required Address Fields
```typescript
// Shipping Address (MANDATORY)
shipping_address: {
  first_name: firstName,
  last_name: lastName,
  company: `🚚 DELIVERY: ${deliveryDate} at ${deliveryTime}`,
  address1: street,
  address2: deliveryInstructions || undefined,
  city: city,
  province: state,
  country: "US",
  zip: zip,
  phone: customerPhone
}
```

### Address Validation
- **NEVER** leave address fields empty
- Always provide fallback: "Address not provided" if parsing fails
- Log all address parsing attempts and results

---

## Order Notes & Attributes (MANDATORY)

### Note Attributes (Additional Details Section)
```typescript
note_attributes: [
  {
    name: "🚚 Delivery Date", 
    value: deliveryDate
  },
  {
    name: "🕐 Delivery Time",
    value: deliveryTime
  },
  {
    name: "📍 Full Delivery Address",
    value: fullAddressString
  },
  {
    name: "📋 Special Instructions",
    value: deliveryInstructions || "None"
  },
  {
    name: "💰 Driver Tip Amount",
    value: `$${tipAmount.toFixed(2)}`
  },
  {
    name: "💳 Stripe Payment ID",
    value: paymentIntentId || sessionId
  }
]
```

### Order Notes (Comprehensive Summary)
```typescript
note: `🚚 DELIVERY ORDER (CST) - ${deliveryDate} at ${deliveryTime}

📍 DELIVERY ADDRESS:
${fullAddressString}
📞 Customer Phone: ${customerPhone}
✉️ Customer Email: ${customerEmail}
📋 SPECIAL INSTRUCTIONS: ${deliveryInstructions || 'None'}

💰 PAYMENT BREAKDOWN (MATCHES STRIPE EXACTLY):
• Subtotal (Products): $${productSubtotal.toFixed(2)}
• Sales Tax 8.25%: $${salesTax.toFixed(2)}
• Delivery Fee: $${deliveryFee.toFixed(2)}
• Driver Tip: $${tipAmount.toFixed(2)}
• TOTAL PAID: $${grandTotal.toFixed(2)}

💳 STRIPE PAYMENT CONFIRMATION:
Payment ID: ${paymentIntentId || sessionId}
Status: PAID ✅
${affiliateCode ? `🤝 AFFILIATE CODE: ${affiliateCode}` : ''}

⚠️ IMPORTANT: Driver tip ($${tipAmount.toFixed(2)}) appears as separate line item in order totals above.
📦 ORDER FULFILLMENT: Prepare for delivery on ${deliveryDate} between ${deliveryTime}`
```

---

## Logging Requirements (MANDATORY)

### Required Logging Steps
1. **Raw Data Received**: Log all metadata from Stripe
2. **Address Parsing**: Log parsing attempts and results
3. **Final Order Data**: Log complete order structure being sent
4. **Shopify Response**: Log success/failure with order ID

### Example Logging
```typescript
logStep("Raw delivery address data received", {
  delivery_address: metadata.delivery_address,
  delivery_date: deliveryDate,
  delivery_time: deliveryTime,
  type: typeof metadata.delivery_address
});

logStep("Address parsing completed", {
  finalAddressData: { 
    street, city, state, zip, fullAddressString,
    willGoToShopifyAs: fullAddressString
  }
});
```

---

## Error Handling & Fallbacks

### Address Parsing Failures
- Log the error with original data
- Use raw string as fallback
- Never leave fields empty

### Missing Data Handling
- Delivery Date: Use "Date not provided"
- Delivery Time: Use "Time not provided"  
- Instructions: Use "None"
- Phone: Use customer email if available

### Shopify API Failures
- Log full error response
- Include order data that failed to create
- Maintain order record in local database

---

## Validation Checklist

Before ANY Shopify order creation, verify:

- [ ] Products in `line_items` (not in tax/shipping lines)
- [ ] Driver tip as separate line item (if applicable)
- [ ] Sales tax ONLY in `tax_lines`
- [ ] Delivery fee ONLY in `shipping_lines`  
- [ ] Complete address in `shipping_address`
- [ ] All note attributes populated
- [ ] Comprehensive order notes included
- [ ] Proper logging throughout process

---

## Implementation Example

```typescript
// CORRECT order structure (MANDATORY)
const orderData = {
  order: {
    line_items: [
      ...productLineItems,
      ...(tipAmount > 0 ? [{
        title: "Driver Tip",
        price: tipAmount.toFixed(2),
        quantity: 1,
        requires_shipping: false,
        taxable: false
      }] : [])
    ],
    subtotal_price: productSubtotal.toFixed(2),
    total_price: grandTotal.toFixed(2),
    tax_lines: salesTax > 0 ? [{
      title: "Sales Tax 8.25%", 
      price: salesTax.toFixed(2),
      rate: 0.0825
    }] : [],
    shipping_lines: deliveryFee > 0 ? [{
      title: "Delivery Fee",
      price: deliveryFee.toFixed(2),
      code: "LOCAL_DELIVERY"
    }] : [],
    // ... address and note attributes as specified above
  }
};
```

---

## FINAL DIRECTIVE

**This structure is LOCKED and PERMANENT. Any deviation from this standard is prohibited. All future Shopify order implementations MUST follow this exact specification.**

**Last Updated**: Current Implementation
**Status**: MANDATORY STANDARD
**Approval**: FINAL - NO CHANGES ALLOWED