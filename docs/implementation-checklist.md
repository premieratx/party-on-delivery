# Shopify Integration Implementation Checklist
## MANDATORY VERIFICATION BEFORE DEPLOYMENT

**⚠️ USE THIS CHECKLIST FOR EVERY SHOPIFY ORDER IMPLEMENTATION**

---

## Pre-Implementation Verification

### 1. Order Structure Compliance
- [ ] Products ONLY in `line_items` array
- [ ] Driver tip as separate line item (not in tax_lines)
- [ ] `subtotal_price` = products only (no tip)
- [ ] `total_price` = complete total including tip
- [ ] Sales tax ONLY in `tax_lines`
- [ ] Delivery fee ONLY in `shipping_lines`

### 2. Address Handling
- [ ] Multi-format parsing implemented (object, JSON string, plain text)
- [ ] Fallback handling for parsing failures
- [ ] Complete shipping address populated
- [ ] Delivery date/time in company field
- [ ] Instructions in address2 field
- [ ] Full address logging implemented

### 3. Order Notes & Attributes
- [ ] All 6 required note attributes present:
  - [ ] 🚚 Delivery Date
  - [ ] 🕐 Delivery Time  
  - [ ] 📍 Full Delivery Address
  - [ ] 📋 Special Instructions
  - [ ] 💰 Driver Tip Amount
  - [ ] 💳 Stripe Payment ID
- [ ] Comprehensive order note with full breakdown
- [ ] Payment confirmation details included

### 4. Logging Requirements
- [ ] Raw metadata logging
- [ ] Address parsing step logging  
- [ ] Final order structure logging
- [ ] Shopify response logging
- [ ] Error handling with context

---

## Testing Protocol

### 1. Order Breakdown Verification
Test with sample order:
- Products: $441.88
- Delivery: $30.00
- Tax: $38.59
- Tip: $50.00  
- Total: $560.47

**Expected Shopify Display:**
```
Subtotal: $441.88
Shipping: $30.00
Taxes: $38.59
Tip: $50.00
Total: $560.47
```

### 2. Address Format Testing
Test all address formats:
- [ ] Object format: `{street: "123 Main St", city: "Austin", state: "TX", zip: "78701"}`
- [ ] JSON string: `'{"street": "123 Main St", "city": "Austin"}'`  
- [ ] Comma-separated: `"123 Main St, Austin, TX 78701"`
- [ ] Plain text: `"123 Main St Austin TX"`
- [ ] Empty/null values with proper fallbacks

### 3. Edge Cases
- [ ] Zero tip amount
- [ ] Zero delivery fee
- [ ] Missing delivery date/time
- [ ] Missing instructions
- [ ] Address parsing failures
- [ ] Shopify API failures

---

## Deployment Checklist

### Before Release
- [ ] All tests pass with correct order breakdown
- [ ] Address data appears in Shopify shipping address
- [ ] Note attributes populate in "Additional Details"  
- [ ] Order notes contain complete information
- [ ] Logging captures all required data
- [ ] Error handling prevents data loss

### Post-Deployment Verification
- [ ] Review first live order in Shopify
- [ ] Verify breakdown matches customer receipt
- [ ] Confirm address data transferred correctly
- [ ] Check all note attributes populated
- [ ] Review edge function logs for any issues

---

## Rollback Plan

If implementation fails verification:
1. Immediately revert to previous working version
2. Document specific failure points
3. Fix issues according to standard documentation
4. Re-run complete testing protocol
5. Deploy only after full verification

---

## Approval Sign-off

**Technical Review**: _______________  Date: ________
**QA Testing**: _______________     Date: ________  
**Final Approval**: _______________  Date: ________

**Deployment Authorization**: APPROVED / REJECTED

---

**Note**: This checklist must be completed and signed off before ANY Shopify integration changes go live. No exceptions.