import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Gift, Zap, ShieldCheck, CreditCard, Landmark, Smartphone, Send, Coins, ArrowRight, History } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SectionTitle, NbButton, EmptyState } from "@/components/UI";
import { toast } from "sonner";

const Wallet = () => {
  const { user, wallet, purchaseCoins, createRazorpayOrder, verifyRazorpayPayment, transferCoins } = useApp();

  // Buy Coins Modal State
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [earnModalOpen, setEarnModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handleBuyCoinsTier = async (amount) => {
    const coinsNum = parseInt(amount, 10);
    if (isNaN(coinsNum) || coinsNum <= 0) {
      toast.error("Please enter a valid coin amount.");
      return;
    }
    try {
      setPurchasing(true);
      setBuyModalOpen(false);
      setCustomAmount("");
      await handleInitiatePayment(coinsNum);
    } catch (err) {
      // toast error handled
    } finally {
      setPurchasing(false);
    }
  };

  // Razorpay Checkout Simulation State
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [paymentStep, setPaymentStep] = useState("form"); // form, processing, success
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("sbi");

  // P2P Coin Transfer State
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSendCoins = async () => {
    if (!transferRecipient.trim()) {
      toast.error("Please enter a recipient username.");
      return;
    }
    const amt = parseInt(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid transfer amount.");
      return;
    }
    if (user.coins < amt) {
      toast.error("Insufficient coin balance.");
      return;
    }

    try {
      setIsTransferring(true);
      await transferCoins(transferRecipient.trim(), amt, transferNote);
      setTransferRecipient("");
      setTransferAmount("");
      setTransferNote("");
      setSendModalOpen(false);
    } catch (err) {
      // handled
    } finally {
      setIsTransferring(false);
    }
  };

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
    <div className="space-y-5 w-full pb-8" data-testid="wallet-page">

      {/* BALANCE CARD */}
      <div
        className="nb-card p-4 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 w-full"
        data-testid="wallet-balance"
      >
        <div className="aurora absolute inset-0 pointer-events-none" style={{ opacity: 0.2 }} />
        <div className="grid-bg absolute inset-0 opacity-10" />
        <div className="relative z-10 flex items-baseline gap-3">
          <div className="font-display text-3xl font-bold leading-none text-[var(--text)] flex items-baseline gap-1.5" style={{ fontWeight: 700 }}>
            {(user.coins || 0).toLocaleString()}
            <span className="text-sm font-semibold text-[var(--lime)]" style={{ fontWeight: 600 }}>◈ BC</span>
          </div>
          <div className="font-mono2 text-xs uppercase tracking-wider text-[var(--text-3)] pb-0.5" style={{ fontWeight: 500 }}>Available balance</div>
        </div>
        <NbButton
          onClick={() => setBuyModalOpen(true)}
          className="bg-[var(--lime)] text-black px-4 py-2 font-bold text-xs relative z-10 flex items-center gap-1.5 rounded-full"
          data-testid="buy-coins-btn"
        >
          <Coins size={14} /> Buy Coins
        </NbButton>
      </div>

      {/* ACTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        <button
          onClick={() => setSendModalOpen(true)}
          className="nb-card p-4 text-left hover:bg-[var(--surface-3)] transition-colors border-2 border-[var(--border)] hover:border-[var(--pink)] group flex flex-col h-full bg-[var(--surface)] w-full"
        >
          <div className="w-7 h-7 rounded-full tint-pink flex items-center justify-center mb-3">
            <Send size={14} strokeWidth={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div
              className="font-display text-[13px] font-semibold flex justify-between items-center text-[var(--text)] leading-snug"
              style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Send Coins
              <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--pink)] -translate-x-2 group-hover:translate-x-0 duration-200" />
            </div>
            <div className="text-[11px] font-mono2 text-[var(--text-3)] leading-snug font-normal" style={{ fontWeight: 400 }}>
              Send BC to another user directly.
            </div>
          </div>
        </button>

        <button
          onClick={() => setBuyModalOpen(true)}
          className="nb-card p-4 text-left hover:bg-[var(--surface-3)] transition-colors border-2 border-[var(--border)] hover:border-[var(--lime)] group flex flex-col h-full bg-[var(--surface)] w-full"
        >
          <div className="w-7 h-7 rounded-full tint-lime flex items-center justify-center mb-3">
            <Coins size={14} strokeWidth={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div
              className="font-display text-[13px] font-semibold flex justify-between items-center text-[var(--text)] leading-snug"
              style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Buy Coins
              <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--lime)] -translate-x-2 group-hover:translate-x-0 duration-200" />
            </div>
            <div className="text-[11px] font-mono2 text-[var(--text-3)] leading-snug font-normal" style={{ fontWeight: 400 }}>
              Purchase BC at student-friendly prices.
            </div>
          </div>
        </button>

        <button
          onClick={() => setEarnModalOpen(true)}
          className="nb-card p-4 text-left hover:bg-[var(--surface-3)] transition-colors border-2 border-[var(--border)] hover:border-[var(--amber)] group flex flex-col h-full bg-[var(--surface)] w-full"
        >
          <div className="w-7 h-7 rounded-full tint-amber flex items-center justify-center mb-3">
            <TrendingUp size={14} strokeWidth={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div
              className="font-display text-[13px] font-semibold flex justify-between items-center text-[var(--text)] leading-snug"
              style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Earn Coins
              <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--amber)] -translate-x-2 group-hover:translate-x-0 duration-200" />
            </div>
            <div className="text-[11px] font-mono2 text-[var(--text-3)] leading-snug font-normal" style={{ fontWeight: 400 }}>
              Complete activities to earn more BC.
            </div>
          </div>
        </button>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="w-full">
        <h3
          className="font-display text-[13px] font-semibold text-[var(--text)] mb-2.5"
          style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          Recent activity
        </h3>
        {wallet.length === 0 ? (
          <div className="nb-card p-4 flex flex-col items-center justify-center text-center border-dashed border border-[var(--border)] bg-[var(--surface-2)] w-full">
            <History size={18} strokeWidth={2} className="text-[var(--text-3)] mb-2" />
            <div className="font-bold text-[var(--text)] text-sm mb-0.5">No transactions yet</div>
            <div className="text-xs font-mono2 text-[var(--text-3)] max-w-xs">Complete swaps or send coins to see your activity here.</div>
          </div>
        ) : (
          <div className="nb-card overflow-hidden divide-y-[1px] divide-[var(--border)] w-full">
            {wallet.map((w) => (
              <div key={w.id} className="p-2.5 flex items-center gap-3 bg-[var(--surface)] hover:bg-[var(--surface-3)] transition-colors w-full" data-testid={`wallet-tx-${w.id}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border border-[var(--border)] ${w.type === "earn" ? "tint-lime" : "tint-pink"}`}>
                  {w.type === "earn" ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-[var(--text)] truncate">{w.reason}</div>
                  <div className="text-[10px] font-mono2 text-[var(--text-3)]">{w.time}</div>
                </div>
                <div className={`font-display text-sm font-bold ${w.type === "earn" ? "text-[var(--lime)]" : "text-[var(--text)]"}`}>
                  {w.amount > 0 ? "+" : ""}{w.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Razorpay Simulated Overlay */}
      <AnimatePresence>
        {razorpayOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#1a1f36] nb-border-2 overflow-hidden rounded-xl text-[var(--text)] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#111625] p-4 border-b border-[var(--border)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-[var(--text)] font-bold text-sm">R</div>
                  <div>
                    <h4 className="font-display text-sm leading-tight">Razorpay Checkout</h4>
                    <span className="text-xs font-mono2 text-[var(--text-3)]">SECURED BY RAZORPAY</span>
                  </div>
                </div>
                <button
                  onClick={() => setRazorpayOrder(null)}
                  className="text-white/40 hover:text-[var(--text)] text-sm font-bold"
                  disabled={paymentStep === "processing"}
                >
                  ✕
                </button>
              </div>

              {/* Order Info */}
              <div className="bg-[#1b233a] px-4 py-2.5 border-b border-[var(--border)] flex justify-between items-center text-xs font-mono2">
                <div>
                  <span className="text-[var(--text-2)]">ORDER ID:</span> {razorpayOrder.order_id}
                </div>
                <div className="font-bold text-base text-[var(--lime)]">
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
                        className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${paymentMethod === m.id
                            ? "border-[var(--lime)] bg-[var(--lime)]/10 text-[var(--text)]"
                            : "border-[var(--border)] bg-[#161a2b] text-[var(--text-2)] hover:text-[var(--text)]"
                          }`}
                      >
                        <m.icon size={16} />
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Form fields based on selected method */}
                  <div className="bg-[#121624] p-4 rounded-lg border border-[var(--border)] min-h-[120px] flex flex-col justify-center">
                    {paymentMethod === "upi" && (
                      <div className="space-y-2">
                        <label className="text-xs font-mono2 text-[var(--text-2)] uppercase">Enter Virtual Payment Address (VPA)</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@upi"
                          className="nb-input bg-[#1a1f35] border-[var(--border)] text-[var(--text)] w-full text-sm py-2"
                        />
                        <div className="text-xs text-white/40 font-mono2">e.g., username@okaxis, handle@paytm</div>
                      </div>
                    )}

                    {paymentMethod === "card" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-mono2 text-[var(--text-2)] uppercase">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="nb-input bg-[#1a1f35] border-[var(--border)] text-[var(--text)] w-full text-sm font-mono2 py-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-mono2 text-[var(--text-2)] uppercase">Expiry</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="nb-input bg-[#1a1f35] border-[var(--border)] text-[var(--text)] w-full text-sm font-mono2 py-2"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-mono2 text-[var(--text-2)] uppercase">CVV</label>
                            <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              className="nb-input bg-[#1a1f35] border-[var(--border)] text-[var(--text)] w-full text-sm font-mono2 py-2"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "netbanking" && (
                      <div className="space-y-2">
                        <label className="text-xs font-mono2 text-[var(--text-2)] uppercase">Select Bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="nb-input bg-[#1a1f35] border-[var(--border)] text-[var(--text)] w-full text-sm py-2"
                        >
                          <option value="sbi">State Bank of India (SBI)</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="axis">Axis Bank</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <NbButton onClick={handleSimulatePayment} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-[var(--text)] text-sm font-bold">
                    Pay ₹{razorpayOrder.amount_inr}.00
                  </NbButton>
                </div>
              )}

              {paymentStep === "processing" && (
                <div className="p-8 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-3 border-[var(--border-hi)] border-t-blue-500 rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-base">Processing Payment...</p>
                    <p className="text-xs text-white/40 font-mono2 mt-1">Please do not close or refresh this page.</p>
                  </div>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="p-6 flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[var(--lime)]/10 text-[var(--lime)] flex items-center justify-center">
                    <ShieldCheck size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl text-[var(--lime)] font-bold">Payment Successful!</p>
                    <p className="text-sm text-[var(--text)] font-mono2 mt-1">
                      +{razorpayOrder.amount_coins} Coins Credited
                    </p>
                  </div>
                  <NbButton
                    onClick={() => setRazorpayOrder(null)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-[var(--text)] text-sm font-bold mt-3"
                  >
                    Done
                  </NbButton>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Buy Coins Store Modal */}
      <AnimatePresence>
        {buyModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBuyModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="nb-card p-6 bg-[var(--surface-2)] w-full max-w-md overflow-hidden rounded-xl text-[var(--text)] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">COIN STORE</div>
                  <h3 className="font-display text-xl font-bold">Buy Coins</h3>
                </div>
                <button onClick={() => setBuyModalOpen(false)} className="nb-btn bg-[var(--surface)] hover:bg-[var(--surface-3)] px-3 py-1.5 text-sm rounded-lg">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { coins: 50, price: 250, label: "Starter Pack" },
                  { coins: 100, price: 450, label: "Trader Choice (10% Off)" },
                  { coins: 250, price: 1000, label: "Pro Booster (20% Off)" },
                  { coins: 500, price: 1750, label: "Whale Swapper (30% Off)" }
                ].map((tier) => (
                  <button
                    key={tier.coins}
                    disabled={purchasing}
                    onClick={() => handleBuyCoinsTier(tier.coins)}
                    className="nb-card p-3 text-left bg-[var(--surface)] hover:tint-lime transition-all border-2 border-[var(--border)] hover:border-[var(--lime)] flex flex-col justify-between"
                  >
                    <div className="font-display text-2xl font-bold text-[var(--text)]">{tier.coins} ◈</div>
                    <div className="text-xs font-mono2 text-[var(--text-3)] uppercase mt-1 mb-2">{tier.label}</div>
                    <div className="text-sm font-bold text-[var(--lime)]">₹{tier.price}</div>
                  </button>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-4 space-y-2">
                <label className="block text-xs font-mono2 uppercase text-[var(--text-3)]">Custom Amount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="nb-input py-2 text-sm flex-1 bg-[var(--surface)] border-[var(--border)] focus:border-[var(--lime)]"
                  />
                  <NbButton
                    disabled={purchasing || !customAmount}
                    onClick={() => handleBuyCoinsTier(customAmount)}
                    className="bg-[var(--lime)] text-black py-2 px-5 text-sm font-bold rounded-lg"
                  >
                    {purchasing ? "Buying..." : "Buy"}
                  </NbButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Coins Modal */}
      <AnimatePresence>
        {sendModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSendModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="nb-card p-6 bg-[var(--surface-2)] w-full max-w-md overflow-hidden rounded-xl text-[var(--text)] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">P2P TRANSFER</div>
                  <h3 className="font-display text-xl font-bold">Send Coins</h3>
                </div>
                <button onClick={() => setSendModalOpen(false)} className="nb-btn bg-[var(--surface)] hover:bg-[var(--surface-3)] px-3 py-1.5 text-sm rounded-lg">✕</button>
              </div>

              <p className="text-xs font-mono2 text-[var(--text-3)]">Transfer coins directly to another user's wallet.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono2 uppercase text-[var(--text-3)] mb-1">Recipient Username</label>
                  <input
                    type="text"
                    placeholder="e.g. alex_m"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    className="nb-input py-2.5 text-sm w-full bg-[var(--surface)] border-[var(--border)] focus:border-[var(--pink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono2 uppercase text-[var(--text-3)] mb-1">Amount (◈)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="nb-input py-2.5 text-sm w-full bg-[var(--surface)] border-[var(--border)] focus:border-[var(--pink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono2 uppercase text-[var(--text-3)] mb-1">Optional Note</label>
                  <input
                    type="text"
                    placeholder="Valuation gap / Tip / Thank you!"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="nb-input py-2.5 text-sm w-full bg-[var(--surface)] border-[var(--border)] focus:border-[var(--pink)]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <NbButton
                  disabled={isTransferring}
                  onClick={handleSendCoins}
                  className="w-full text-center py-2.5 bg-[var(--pink)] text-white hover:bg-[var(--pink)]/90 text-sm font-bold rounded-lg"
                >
                  {isTransferring ? "Sending..." : "Send Coins"}
                </NbButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Earn Coins Modal */}
      <AnimatePresence>
        {earnModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEarnModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="nb-card p-6 bg-[var(--surface-2)] w-full max-w-sm overflow-hidden rounded-xl text-[var(--text)] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <div className="font-mono2 text-xs uppercase text-[var(--text-3)]">ACTIVITIES</div>
                  <h3 className="font-display text-xl font-bold">Earn Coins</h3>
                </div>
                <button onClick={() => setEarnModalOpen(false)} className="nb-btn bg-[var(--surface)] hover:bg-[var(--surface-3)] px-3 py-1.5 text-sm rounded-lg">✕</button>
              </div>

              <ul className="space-y-3">
                <li className="flex justify-between items-center bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] text-sm">
                  <span className="font-medium">Complete a swap</span>
                  <span className="font-bold text-[var(--lime)] font-mono2 text-sm">+50 BC</span>
                </li>
                <li className="flex justify-between items-center bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] text-sm">
                  <span className="font-medium">Refer a friend</span>
                  <span className="font-bold text-[var(--lime)] font-mono2 text-sm">+25 BC each</span>
                </li>
                <li className="flex justify-between items-center bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] text-sm">
                  <span className="font-medium">Verify your ID</span>
                  <span className="font-bold text-[var(--lime)] font-mono2 text-sm">+100 BC</span>
                </li>
                <li className="flex justify-between items-center bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] text-sm">
                  <span className="font-medium">Get a 5-star rating</span>
                  <span className="font-bold text-[var(--lime)] font-mono2 text-sm">+10 BC</span>
                </li>
              </ul>

              <div className="pt-2">
                <NbButton onClick={() => setEarnModalOpen(false)} className="w-full text-center py-2.5 bg-[var(--surface)] border-2 border-[var(--border)] hover:bg-[var(--surface-3)] text-sm font-bold rounded-lg">
                  Got it
                </NbButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
