# Checkout Flow Rules & Functionality

## Core Principles
- **Universal Consistency**: All checkout flows work identically regardless of user type, entry point, or session state
- **Reliable Input**: All fields (date, time, address, customer info) must be selectable and saveable for everyone
- **Simplified Logic**: Single checkout page handles all use cases with minimal conditional logic

## Supported Use Cases

### 1. New Customers
- **Flow**: Fresh checkout with empty fields
- **Behavior**: All fields editable, no pre-fill data
- **Entry Points**: Main delivery app, custom affiliate sites, party planner

### 2. Returning Customers
- **Flow**: Pre-filled data from previous orders when available and valid
- **Behavior**: Fields pre-populated but fully editable
- **Data Sources**: localStorage, customer database records

### 3. Group Orders
- **Flow**: Shared order link opens checkout with group context
- **Behavior**: Original order details may pre-fill, but all fields remain editable
- **Special**: Group order token applied automatically

### 4. Affiliate Orders
- **Flow**: Affiliate code pre-applied (e.g., free shipping)
- **Behavior**: Standard checkout with discount code auto-applied
- **Entry Points**: Custom affiliate landing pages, affiliate links

### 5. Admin/Staff Orders
- **Flow**: Same checkout process as regular customers
- **Behavior**: No special handling needed, admin permissions handled elsewhere

## Field Requirements

### Date/Time Selection
- **Component**: Native HTML select elements for maximum compatibility
- **Validation**: Only future dates/times available
- **Pre-fill**: Only if saved date/time is in the future
- **Availability**: Shows appropriate time slots based on selected date

### Address Information
- **Components**: Standard input fields with Google Places integration
- **Validation**: Required fields enforced consistently
- **Pre-fill**: Recent addresses when available
- **Storage**: Saved to customer profile for future use

### Customer Information
- **Components**: Standard form inputs
- **Validation**: Email and phone number format validation
- **Pre-fill**: Customer profile data when logged in
- **Updates**: Automatically updates customer profile

## Data Flow

### 1. Initialization
```
1. Load checkout page
2. Initialize useCheckoutFlow hook
3. Check for pre-fill data (localStorage, customer profile, group order)
4. Apply affiliate/discount codes if present
5. Render form with appropriate pre-filled values
```

### 2. User Interaction
```
1. User modifies any field
2. Update deliveryInfo state immediately
3. Save to localStorage for persistence
4. Validate field on blur/change
5. Update UI feedback accordingly
```

### 3. Submission
```
1. Validate all required fields
2. Create payment intent
3. Process payment
4. Create Shopify order
5. Save order to database
6. Update customer profile
7. Navigate to success page
```

## State Management

### Core State Objects
- `deliveryInfo`: Date, time, address, instructions
- `customerInfo`: Name, email, phone
- `addressInfo`: Structured address components
- `cartItems`: Products being purchased

### Persistence Strategy
- **localStorage**: Temporary form data, cart contents
- **Customer Database**: Profile information, order history
- **Session Storage**: Temporary checkout state

### Pre-fill Logic
```typescript
// Priority order for pre-filling:
1. Group order data (if accessing via group link)
2. Add-to-order context (if modifying existing order)
3. Recent customer data (if logged in)
4. localStorage cache (if recent and valid)
5. Empty state (for new users)
```

## Error Handling

### Common Issues
- **Invalid date/time**: Clear and force new selection
- **Address validation**: Show specific error messages
- **Payment failures**: Allow retry with same data
- **Network issues**: Preserve form state, show retry options

### Validation Rules
- All fields validated on blur and submit
- Clear error messages displayed inline
- Form submission blocked until all validation passes
- Graceful handling of edge cases

## Testing Requirements

### Browser Compatibility
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers (iOS Safari, Android Chrome)
- ✅ Incognito/private browsing modes

### User Scenarios
- ✅ New customer, first order
- ✅ Returning customer, repeat order
- ✅ Group order participant
- ✅ Affiliate referral customer
- ✅ Custom site customer
- ✅ Add-to-existing-order flow

### Data Scenarios
- ✅ Empty localStorage
- ✅ Corrupted localStorage data
- ✅ Network interruption during checkout
- ✅ Multiple tab/window sessions
- ✅ Expired time slots/dates