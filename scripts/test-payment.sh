#!/bin/bash

# Test payment script - Creates a test gift without making an actual payment
# Usage: ./scripts/test-payment.sh [amount] [message]

AMOUNT=${1:-1000}  # Default: €10.00 (1000 cents)
MESSAGE=${2:-"Test gift message"}

echo "Creating test gift..."
echo "Amount: €$(echo "scale=2; $AMOUNT/100" | bc)"
echo "Message: $MESSAGE"
echo ""

# Make the API call
curl -X POST http://localhost:3000/api/test-payment \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": $AMOUNT,
    \"currency\": \"eur\",
    \"message\": \"$MESSAGE\",
    \"animationPreset\": \"confettiRealistic\",
    \"senderEmail\": \"test@monniegift.com\",
    \"recipientEmail\": \"recipient@example.com\"
  }" | jq '.'

echo ""
echo "✅ Test gift created!"
echo ""
echo "You can now:"
echo "1. Use the successUrl from the response to view the gift on the success page"
echo "2. Use the claimUrl to test the claiming flow"
echo "3. Check the authenticationCode in the response"

