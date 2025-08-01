// CRITICAL: CHECKOUT FLOW PROTECTION
// DO NOT MODIFY THIS FILE WITHOUT TESTING CHECKOUT END-TO-END
// This file handles payment processing and order completion

/**
 * PROTECTED AREAS - NEVER MODIFY WITHOUT EXPLICIT TESTING:
 * 1. Time slot calculation logic (lines 240-275)
 * 2. Payment form integration (EmbeddedPaymentForm)
 * 3. Order completion flow
 * 4. Address validation
 * 5. Customer info handling
 * 
 * BEFORE ANY CHANGES TO CHECKOUT:
 * 1. Test complete checkout flow with real items
 * 2. Test group order checkout
 * 3. Test individual order checkout
 * 4. Verify payment processing works
 * 5. Confirm order completion redirect works
 * 
 * DEPENDENCIES THAT MUST REMAIN:
 * - date-fns and date-fns-tz for timezone handling
 * - All existing imports for payment processing
 * - Customer info hooks and validation
 */

export const CHECKOUT_PROTECTION_NOTICE = "CRITICAL SYSTEM - TEST ALL CHANGES";