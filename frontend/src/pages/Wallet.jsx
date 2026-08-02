import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Gift, Zap, ShieldCheck, CreditCard, Landmark, Smartphone } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";
import { toast } from "sonner";

const Wallet = () => {
  const { user, wallet, createRazorpayOrder, verifyRazorpayPayment } = useApp();

  // Razorpay Checkout Simulation State
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [paymentStep, setPaymentStep] = useState("form"); // form, processing, success
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("sbi");

  // Load Razorpay checkout script dynamically
  useEffect(() => {
    if (!document.getElementById("razorpay-checkout-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Compute stats from real transaction data
  const stats = useMemo(() => {
    let earned = 0;
    let spent = 0;
    let referrals = 0;

    wallet.forEach((w) => {
      if (w.amount > 0) {
        earned += w.amount;
        if (w.reason && w.reason.toLowerCase().includes("referral")) {
          referrals += 1;
        }
      } else {
        spent += Math.abs(w.amount);
      }
    });

    return { earned, spent, referrals };
  }, [wallet]);

  const handleInitiatePayment = async (amount) => {
    try {
      const order = await createRazorpayOrder(amount);
      if (order.is_simulated) {
        // Fallback to our simulated overlay
        setRazorpayOrder(order);
        setPaymentStep("form");
        setPaymentMethod("upi");
        setUpiId(`${user.id || "student"}@okaxis`);
        setCardNumber("4242 4242 4242 4242");
        setCardExpiry("12/28");
        setCardCvv("123");
      } else {
        // Load official Razorpay checkout modal
        const options = {
          key: order.key_id,
          amount: order.amount_inr * 100, // paise
          currency: "INR",
          name: "BAARTER",
          description: `Purchase ${amount} Coins`,
          order_id: order.order_id,
          handler: async function (response) {
            setRazorpayOrder(order);
            setPaymentStep("processing");
            try {
              const payload = {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount_coins: amount
              };
              await verifyRazorpayPayment(payload);
              setPaymentStep("success");
            } catch (err) {
              setRazorpayOrder(null);
              toast.error("Payment verification failed.");
            }
          },
          prefill: {
            name: user.name || "",
            email: user.email || "",
          },
          theme: {
            color: "#60a5fa"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (e) {
      toast.error("Failed to initiate checkout order.");
    }
  };

  const handleSimulatePayment = async () => {
    if (!razorpayOrder) return;
    setPaymentStep("processing");
    
    // Simulate gateway hand-shake time
    setTimeout(async () => {
      try {
        const payload = {
          order_id: razorpayOrder.order_id,
          payment_id: `pay_sim_${Math.random().toString(36).substr(2, 9)}`,
          signature: "simulated_razorpay_sig_123456",
          amount_coins: razorpayOrder.amount_coins
        };
        await verifyRazorpayPayment(payload);
        setPaymentStep("success");
      } catch (err) {
        setPaymentStep("form");
        toast.error("Payment verification failed.");
      }
    }, 2000);
  };

  return (
    <div className="space-y-6" data-testid="wallet-page">
      <SectionTitle kicker="BAARTER COINS">Your wallet.</SectionTitle>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="nb-card p-8 relative overflow-hidden"
        data-testid="wallet-balance"
      >
        <div className="aurora" style={{ opacity: 0.4 }} />
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-[var(--text-3)] mb-3">BALANCE</div>
          <div className="font-display text-7xl md:text-8xl leading-none text-white flex items-baseline gap-2">
            {(user.coins || 0).toLocaleString()}
            <span className="text-3xl text-[var(--lime)]">◈</span>
          </div>
          <div className="font-mono2 text-[10px] uppercase tracking-widest text-[var(--text-3)] mt-3">BAARTER COINS · BC</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Earned", value: `+${stats.earned}`, icon: TrendingUp, tint: "tint-lime" },
          { label: "Spent", value: `-${stats.spent}`, icon: TrendingDown, tint: "tint-pink" },
          { label: "Referrals", value: String(stats.referrals), icon: Gift, tint: "tint-amber" },
        ].map((s) => (
          <div key={s.label} className={`nb-card p-4 border ${s.tint}`}>
            <s.icon size={18} strokeWidth={2} className="mb-2 opacity-80" />
            <div className="font-display text-2xl text-white">{s.value}</div>
            <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-2xl mb-3">Recent activity</h3>
        {wallet.length === 0 ? (
          <EmptyState emoji="💰" title="No transactions yet" subtitle="Complete swaps and earn coins to see activity here." />
        ) : (
          <div className="nb-card overflow-hidden divide-y-[3px] divide-white/8">
            {wallet.map((w) => (
              <div key={w.id} className="p-4 flex items-center gap-3 bg-[var(--surface)]" data-testid={`wallet-tx-${w.id}`}>
                <div className={`w-10 h-10 rounded-full nb-border-2 flex items-center justify-center ${w.type === "earn" ? "tint-lime" : "tint-pink"}`}>
                  {w.type === "earn" ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{w.reason}</div>
                  <div className="text-xs font-mono2 text-[var(--text-3)]">{w.time}</div>
                </div>
                <div className={`font-display text-xl ${w.type === "earn" ? "text-[var(--lime)]" : ""}`}>
                  {w.amount > 0 ? "+" : ""}{w.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Buy Coins Store */}
        <div className="nb-card p-6 tint-lime flex flex-col justify-between">
          <div>
            <div className="font-display text-2xl mb-2">⚡ Buy Coins Store</div>
            <p className="text-xs font-mono2 uppercase text-[var(--text-3)] mb-4">Get coins at student prices to cover trade valuation gaps</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { coins: 50, price: 250, label: "Starter Pack" },
                { coins: 100, price: 450, label: "Trader Choice (10% Off)" },
                { coins: 250, price: 1000, label: "Pro Booster (20% Off)" },
                { coins: 500, price: 1750, label: "Whale Swapper (30% Off)" }
              ].map((pkg) => (
                <button
                  key={pkg.coins}
                  onClick={() => handleInitiatePayment(pkg.coins)}
                  className="nb-border-2 bg-[var(--surface)] hover:nb-shadow hover:tint-lime transition-all p-3 rounded-lg text-left"
                >
                  <div className="font-display text-lg">{pkg.coins} ◈</div>
                  <div className="text-[10px] text-[var(--text-3)] font-mono2">{pkg.label}</div>
                  <div className="text-xs font-bold mt-1 text-[var(--lime)]">₹{pkg.price}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              id="custom-coins"
              placeholder="Custom amount"
              className="nb-input py-2 text-sm flex-1 bg-[var(--surface-2)]"
            />
            <NbButton
              size="sm"
              onClick={() => {
                const input = document.getElementById("custom-coins");
                const amount = parseInt(input?.value || "0");
                if (amount <= 0 || isNaN(amount)) {
                  toast.error("Enter a valid amount to purchase.");
                  return;
                }
                handleInitiatePayment(amount);
                if (input) input.value = "";
              }}
            >
              Buy
            </NbButton>
          </div>
        </div>

        {/* Earn Coins Info */}
        <div className="nb-card p-6 tint-amber">
          <Zap size={28} strokeWidth={2.5} className="mb-2" />
          <div className="font-display text-2xl mb-2">Earn more coins</div>
          <ul className="space-y-1 text-sm font-medium">
            <li>· Complete a swap: <b>+50 BC</b></li>
            <li>· Refer a friend: <b>+25 BC each</b></li>
            <li>· Verify your ID: <b>+100 BC</b></li>
            <li>· Get 5-star rating: <b>+10 BC</b></li>
          </ul>
        </div>
      </div>

      {/* Razorpay Simulated Overlay */}
      <AnimatePresence>
        {razorpayOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#1a1f36] nb-border-2 overflow-hidden rounded-xl text-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#111625] p-5 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">R</div>
                  <div>
                    <h4 className="font-display text-sm leading-tight">Razorpay Checkout</h4>
                    <span className="text-[10px] font-mono2 text-[var(--text-3)]">SECURED BY RAZORPAY</span>
                  </div>
                </div>
                <button
                  onClick={() => setRazorpayOrder(null)}
                  className="text-white/40 hover:text-white text-lg font-bold"
                  disabled={paymentStep === "processing"}
                >
                  ✕
                </button>
              </div>

              {/* Order Info */}
              <div className="bg-[#1b233a] px-5 py-3 border-b border-white/5 flex justify-between items-center text-sm font-mono2">
                <div>
                  <span className="text-white/60">ORDER ID:</span> {razorpayOrder.order_id}
                </div>
                <div className="font-bold text-lg text-[var(--lime)]">
                  ₹{razorpayOrder.amount_inr}.00
                </div>
              </div>

              {paymentStep === "form" && (
                <div className="p-5 flex-1 space-y-4">
                  {/* Select Payment Method */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "upi", label: "UPI", icon: Smartphone },
                      { id: "card", label: "Card", icon: CreditCard },
                      { id: "netbanking", label: "Netbanking", icon: Landmark }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                          paymentMethod === m.id
                            ? "border-[var(--lime)] bg-[var(--lime)]/10 text-white"
                            : "border-white/10 bg-[#161a2b] text-white/60 hover:text-white"
                        }`}
                      >
                        <m.icon size={16} />
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Form fields based on selected method */}
                  <div className="bg-[#121624] p-4 rounded-lg border border-white/5 min-h-[120px] flex flex-col justify-center">
                    {paymentMethod === "upi" && (
                      <div className="space-y-2">
                        <label className="text-xs font-mono2 text-white/60 uppercase">Enter Virtual Payment Address (VPA)</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@upi"
                          className="nb-input bg-[#1a1f35] border-white/10 text-white w-full text-sm"
                        />
                        <div className="text-[10px] text-white/40 font-mono2">e.g., username@okaxis, handle@paytm</div>
                      </div>
                    )}

                    {paymentMethod === "card" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-mono2 text-white/60 uppercase">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="nb-input bg-[#1a1f35] border-white/10 text-white w-full text-sm font-mono2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-mono2 text-white/60 uppercase">Expiry</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="nb-input bg-[#1a1f35] border-white/10 text-white w-full text-sm font-mono2"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-mono2 text-white/60 uppercase">CVV</label>
                            <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              className="nb-input bg-[#1a1f35] border-white/10 text-white w-full text-sm font-mono2"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "netbanking" && (
                      <div className="space-y-2">
                        <label className="text-xs font-mono2 text-white/60 uppercase">Select Bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="nb-input bg-[#1a1f35] border-white/10 text-white w-full text-sm"
                        >
                          <option value="sbi">State Bank of India (SBI)</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="axis">Axis Bank</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <NbButton onClick={handleSimulatePayment} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Pay ₹{razorpayOrder.amount_inr}.00
                  </NbButton>
                </div>
              )}

              {paymentStep === "processing" && (
                <div className="p-10 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-base">Processing Payment...</p>
                    <p className="text-xs text-white/40 font-mono2 mt-1">Please do not close or refresh this page.</p>
                  </div>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="p-8 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--lime)]/10 text-[var(--lime)] flex items-center justify-center">
                    <ShieldCheck size={36} />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl text-[var(--lime)]">Payment Successful!</p>
                    <p className="text-sm text-white/80 font-mono2 mt-2">
                      +{razorpayOrder.amount_coins} Coins Credited
                    </p>
                  </div>
                  <NbButton
                    onClick={() => setRazorpayOrder(null)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold mt-4"
                  >
                    Done
                  </NbButton>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
