"use client";

import { useState } from "react";
import { LoaderFiveDemo } from "@/components/ui/shimmerload";

export default function TestPaymentPage() {
  const [amount, setAmount] = useState("1000"); // €10.00 in cents
  const [message, setMessage] = useState("Test gift message");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCreateTestGift = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum < 100) {
        setError("Amount must be at least 100 cents (€1.00)");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/test-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNum,
          currency: "eur",
          message: message,
          animationPreset: "confettiRealistic",
          senderEmail: "test@monniegift.com",
          recipientEmail: "recipient@example.com",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create test gift");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full text-white p-8"
      style={{ background: "linear-gradient(to bottom, #0a3530, #104b44)" }}
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif text-foreground mb-8">
          Test Payment - Create Gift
        </h1>

        <div className="bg-background/10 border-2 border-[#4d7d75] rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-lg text-foreground mb-2">
              Amount (in cents)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-background/20 border-2 border-[#4d7d75] rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[#c8f196]"
              placeholder="1000 (for €10.00)"
              min="100"
            />
            <p className="text-sm text-muted-foreground mt-1">
              €{(parseInt(amount) || 0) / 100} (€{(parseInt(amount) || 0) / 100 + 0.99} with fee)
            </p>
          </div>

          <div>
            <label className="block text-lg text-foreground mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-background/20 border-2 border-[#4d7d75] rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[#c8f196]"
              rows={3}
              placeholder="Your gift message"
            />
          </div>

          <button
            onClick={handleCreateTestGift}
            disabled={loading}
            className="w-full h-14 rounded-full bg-[#c8f196] text-[#0a3530] font-normal text-lg hover:bg-[#c8f196]/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoaderFiveDemo text="Creating..." />
            ) : (
              "Create Test Gift"
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-6 bg-background/20 border-2 border-[#4d7d75] rounded-lg space-y-4">
              <h2 className="text-2xl font-serif text-[#ddb17c]">
                ✅ Test Gift Created!
              </h2>

              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Gift ID:</span>
                  <p className="text-foreground font-mono text-sm">
                    {result.gift.id}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="text-foreground">
                    €{(result.gift.amount / 100).toFixed(2)}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">
                    Authentication Code:
                  </span>
                  <p className="text-foreground font-mono text-2xl tracking-wider">
                    {result.gift.authenticationCode}
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <a
                    href={result.successUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-[#ddb17c] text-[#0a3530] rounded-lg text-center hover:bg-[#ddb17c]/90 transition-colors"
                  >
                    View Success Page →
                  </a>

                  <a
                    href={result.claimUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-[#c8f196] text-[#0a3530] rounded-lg text-center hover:bg-[#c8f196]/90 transition-colors"
                  >
                    Test Claim Flow →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-background/10 border border-[#4d7d75] rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This creates a test gift without making an
            actual payment. The gift will have a proper authentication code
            that you can use to test the claiming flow.
          </p>
        </div>
      </div>
    </div>
  );
}

