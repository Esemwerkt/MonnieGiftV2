# Webhook Events Summary

This document summarizes all Stripe webhook events handled by the application.

## Overview

The application uses **two webhook endpoints** to handle different types of Stripe events:

1. **Main Webhook** (`/api/webhooks/stripe`) - Handles core payment and gift creation logic
2. **Thin Webhook** (`/api/webhooks/stripe-thin`) - Handles Stripe Connect account monitoring events

---

## 1. Main Webhook (`/api/webhooks/stripe`)

**Environment Variable:** `STRIPE_WEBHOOK_SECRET`

### Actively Processed Events

#### `payment_intent.succeeded`
**Purpose:** Primary event for gift creation after successful payment

**Actions:**
- Creates gift records in the database
- Generates authentication codes for gift claims
- Extracts metadata (gift amount, message, animation preset, sender/recipient emails)
- Prevents duplicate gift creation by checking existing gifts
- Logs payment fee distribution

**Key Logic:**
- Checks if gift already exists for the payment intent
- Creates new gift with authentication code if not exists
- Stores platform fee information
- Sets default animation preset to `confettiRealistic` if not specified

#### `account.updated`
**Purpose:** Handles Stripe Connect account onboarding and payout processing

**Actions:**
- Checks if account is fully onboarded (details submitted, no pending requirements)
- Processes pending gifts when account becomes ready
- Creates transfers for unclaimed gifts to connected accounts
- Updates gift status to claimed after successful transfer

**Key Logic:**
- Finds all pending gifts for the account
- Creates Stripe transfers for each pending gift
- Updates gift records with transfer ID and claim status

#### `transfer.reversed`
**Purpose:** Handles transfer reversals

**Actions:**
- Marks gift as unclaimed when transfer is reversed
- Updates gift status in database
- Stores reversed transfer ID

**Key Logic:**
- Updates gift record to set `isClaimed = false`
- Clears `claimedAt` timestamp
- Stores reversed transfer ID for tracking







### Logged Only Events

These events are received and logged but no processing logic is implemented:

- `transfer.created` - Legacy event (old manual transfer system)
- `transfer.updated` - Transfer status updates
- `checkout.session.completed` - Checkout session completion
- `outbound_transfer.created` - Outbound transfer creation
- `outbound_transfer.succeeded` - Outbound transfer success
- `outbound_transfer.failed` - Outbound transfer failure
- `transaction.created` - Transaction creation

---




## 2. Thin Webhook (`/api/webhooks/stripe-thin`)

**Environment Variable:** `STRIPE_WEBHOOK_SECRET_THIN`

### Monitored Events

All events in this webhook are currently **logged only** with no active processing logic:

#### Account Events
- `account.requirements.updated` - Account requirements changes
- `account.identity.updated` - Account identity updates
- `account.merchant_configuration.updated` - Merchant configuration changes
- `account.customer_configuration.updated` - Customer configuration changes

#### Invoice Events
- `invoice.created` - Invoice creation
- `invoice.payment_succeeded` - Invoice payment success

#### Customer Events
- `customer.entitlements.updated` - Customer entitlements updates

**Note:** These events retrieve account/invoice/customer data but don't perform any database updates or business logic.

---

## Event Processing Flow

### Gift Creation Flow
```
payment_intent.succeeded
  ↓
Check if gift exists
  ↓
Generate authentication code
  ↓
Create gift record in database
  ↓
Store payment metadata
```

### Payout Flow (Stripe Connect)
```
account.updated
  ↓
Check if account is fully onboarded
  ↓
Find pending gifts for account
  ↓
Create transfers for each gift
  ↓
Update gift status to claimed
```

### Reversal Flow
```
transfer.reversed
  ↓
Find gift by transfer metadata
  ↓
Mark gift as unclaimed
  ↓
Clear claim timestamp
```

---

## Security

Both webhooks implement signature verification:
- Validates `stripe-signature` header
- Uses `stripe.webhooks.constructEvent()` for verification
- Returns 400 error if signature is invalid or missing

---

## Error Handling

- All webhook handlers include try-catch blocks
- Errors are logged to console
- Returns appropriate HTTP status codes:
  - `400` - Invalid signature or missing data
  - `500` - Processing errors
  - `200` - Success

---

## Configuration

### Required Environment Variables

```env
STRIPE_WEBHOOK_SECRET=<main_webhook_secret>
STRIPE_WEBHOOK_SECRET_THIN=<thin_webhook_secret>
```

### Webhook Endpoints

- Main: `https://yourdomain.com/api/webhooks/stripe`
- Thin: `https://yourdomain.com/api/webhooks/stripe-thin`

---

## Summary

**Active Processing:**
- ✅ `payment_intent.succeeded` - Gift creation
- ✅ `account.updated` - Onboarding and payouts
- ✅ `transfer.reversed` - Reversal handling

**Monitoring Only:**
- 📊 All other events are logged for monitoring but don't trigger business logic

The main webhook handles the core gift creation and payout logic, while the thin webhook appears to be set up for future Stripe Connect account monitoring features.

