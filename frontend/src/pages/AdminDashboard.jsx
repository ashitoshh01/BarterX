import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Package, ArrowLeftRight, AlertOctagon, 
  Coins, TrendingUp, ShieldAlert, Image as ImageIcon, 
  Check, X, Search, Filter, Ban, CheckCircle, RefreshCw 
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, listings, disputes, moderation
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab Data Lists
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stats/");
      setStats(res.data.stats);
      setRecentLogs(res.data.recent_activity || []);
    } catch (err) {
      toast.error("Failed to load admin stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      let endpoint = "";
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;

      if (tab === "users") {
        const res = await api.get("/admin/users/", { params });
        setUsers(res.data.results || res.data);
      } else if (tab === "listings") {
        const res = await api.get("/admin/listings/", { params });
        setListings(res.data.results || res.data);
      } else if (tab === "disputes") {
        const res = await api.get("/admin/disputes/", { params });
        setDisputes(res.data.results || res.data);
      } else if (tab === "moderation") {
        const res = await api.get("/admin/moderation/", { params });
        setModerationQueue(res.data.results || res.data);
      }
    } catch (err) {
      toast.error(`Failed to load ${tab} data.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "overview") {
      loadTabData(activeTab);
    }
  }, [activeTab, searchQuery, statusFilter]);

  // Actions
  const handleUserAction = async (userId, action, username) => {
    const notes = prompt(`Enter reason/notes for performing '${action}' on user ${username}:`);
    if (notes === null) return;
    try {
      await api.post(`/admin/users/${userId}/manage/`, { action, notes });
      toast.success(`Action '${action}' applied to user ${username}`);
      loadTabData("users");
    } catch (err) {
      toast.error("Failed to apply action.");
    }
  };

  const handleListingAction = async (listingId, action, title) => {
    const notes = prompt(`Enter reason/notes to '${action}' listing: "${title}"`);
    if (notes === null) return;
    try {
      await api.post(`/admin/listings/${listingId}/manage/`, { action, notes });
      toast.success(`Listing status updated to '${action}'`);
      loadTabData("listings");
    } catch (err) {
      toast.error("Failed to update listing.");
    }
  };

  const handleResolveDispute = async (disputeId, actionType) => {
    const resolution = prompt(`Enter resolution notes for dispute resolution:`);
    if (!resolution) {
      toast.error("Resolution notes are required.");
      return;
    }
    try {
      await api.post(`/admin/disputes/${disputeId}/resolve/`, { status: actionType, resolution });
      toast.success(`Dispute resolved with status: ${actionType}`);
      loadTabData("disputes");
    } catch (err) {
      toast.error("Failed to resolve dispute.");
    }
  };

  const handleModerationAction = async (modId, action) => {
    const notes = prompt(`Enter review notes:`);
    if (notes === null) return;
    try {
      await api.post(`/admin/moderation/${modId}/action/`, { action, notes });
      toast.success(`Moderation status set to '${action}'`);
      loadTabData("moderation");
    } catch (err) {
      toast.error("Failed to apply moderation action.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl font-mono text-black">
      {/* Neobrutalist Header */}
      <div className="border-4 border-black bg-[#FFDE4D] p-6 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black uppercase tracking-tight">Admin Operations Command</h1>
        <p className="text-sm mt-1 uppercase font-bold text-gray-700">System Overview & Content Moderation Hub</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "users", label: "User Accounts", icon: Users },
          { id: "listings", label: "Listings", icon: Package },
          { id: "disputes", label: "Disputes Hub", icon: AlertOctagon },
          { id: "moderation", label: "Safety Queue", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className={`flex items-center gap-2 border-4 border-black px-5 py-3 font-black uppercase text-sm transition-transform duration-100 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                isActive ? "bg-[#FF6B6B] translate-y-1 shadow-none" : "bg-white hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {loading && stats === null ? (
        <div className="border-4 border-black p-8 text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
          <p className="font-bold">Syncing Admin Dashboard details...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "overview" && stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Quick Stats Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Total Swappers", val: stats.total_users, color: "#9DF9E2", sub: `${stats.active_users} Active accounts` },
                  { title: "Active Listings", val: stats.active_listings, color: "#FFDE4D", sub: `${stats.total_listings} Total listings` },
                  { title: "Swaps Processed", val: stats.completed_trades, color: "#FFD0EC", sub: `${stats.pending_trades} Pending swaps` },
                  { title: "BarterX Coins", val: `◈ ${stats.coins_circulation}`, color: "#C6F8FF", sub: `${stats.coin_purchases} Purchases` },
                  { title: "Platform Revenue", val: `₹${stats.platform_revenue}`, color: "#C4FFB2", sub: "Via coin purchases" },
                  { title: "Safety Queue", val: stats.flagged_images + stats.pending_reviews, color: "#FF9E9E", sub: `${stats.active_disputes} Active disputes` },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: stat.color }}
                    className="border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
                  >
                    <h3 className="font-black uppercase text-sm tracking-wider text-gray-800">{stat.title}</h3>
                    <div className="text-4xl font-black my-4">{stat.val}</div>
                    <p className="text-xs font-bold uppercase text-gray-600">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Recent Audit Logs & Info */}
              <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">Admin Audit Trail</h3>
                {recentLogs.length === 0 ? (
                  <p className="text-sm font-bold text-gray-500">No actions recorded in audit logs.</p>
                ) : (
                  <div className="space-y-4">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="border-2 border-black p-3 bg-gray-50">
                        <div className="flex justify-between text-xs font-bold mb-1 text-gray-500">
                          <span>{log.admin_username}</span>
                          <span>{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-black uppercase text-[#FF6B6B]">{log.action}</p>
                        {log.notes && <p className="text-xs mt-1 italic text-gray-700">Notes: {log.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab !== "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 mb-6 border-b-4 border-black pb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-4 border-black px-4 py-3 pl-12 text-sm font-bold bg-white focus:outline-none focus:bg-yellow-50 focus:border-yellow-400"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => loadTabData(activeTab)} 
                    className="border-4 border-black px-5 py-3 font-bold bg-yellow-300 hover:bg-yellow-400 uppercase text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Data Tables */}
              {activeTab === "users" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-4 border-black text-left font-black uppercase bg-gray-100">
                        <th className="p-3">Username</th>
                        <th className="p-3">Display Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Verified / Premium</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b-2 border-black hover:bg-gray-50">
                          <td className="p-3 font-bold">{u.username}</td>
                          <td className="p-3">{u.profile?.display_name || "-"}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 space-x-2">
                            <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${u.profile?.is_verified ? 'bg-[#C4FFB2]' : 'bg-gray-100'}`}>
                              {u.profile?.is_verified ? "KYC" : "Unverified"}
                            </span>
                            <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${u.profile?.is_premium ? 'bg-[#9DF9E2]' : 'bg-gray-100'}`}>
                              {u.profile?.is_premium ? "Premium" : "Free"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${u.is_active ? 'bg-[#C4FFB2]' : 'bg-[#FF9E9E]'}`}>
                              {u.is_active ? "Active" : "Suspended"}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {u.is_active ? (
                              <button onClick={() => handleUserAction(u.id, "suspend", u.username)} className="border-2 border-black px-2 py-1 bg-red-200 text-xs font-bold hover:bg-red-300">
                                Suspend
                              </button>
                            ) : (
                              <button onClick={() => handleUserAction(u.id, "reactivate", u.username)} className="border-2 border-black px-2 py-1 bg-green-200 text-xs font-bold hover:bg-green-300">
                                Reactivate
                              </button>
                            )}
                            <button onClick={() => handleUserAction(u.id, u.profile?.is_verified ? "unverify" : "verify", u.username)} className="border-2 border-black px-2 py-1 bg-blue-200 text-xs font-bold hover:bg-blue-300">
                              Toggle KYC
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "listings" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listings.map((l) => (
                    <div key={l.id} className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-4">
                      {l.image_url && <img src={l.image_url} alt="" className="w-20 h-20 object-cover border-2 border-black bg-gray-100" />}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-lg truncate">{l.title}</h4>
                        <p className="text-xs font-bold text-gray-500 uppercase">Owner: {l.owner_username || l.owner?.username}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase mt-1">Status: <span className="text-red-500">{l.status}</span></p>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => handleListingAction(l.id, "disable", l.title)} className="border-2 border-black px-3 py-1 bg-red-200 hover:bg-red-300 text-xs font-bold">
                            Disable
                          </button>
                          <button onClick={() => handleListingAction(l.id, "restore", l.title)} className="border-2 border-black px-3 py-1 bg-green-200 hover:bg-green-300 text-xs font-bold">
                            Restore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "disputes" && (
                <div className="space-y-4">
                  {disputes.map((d) => (
                    <div key={d.id} className="border-4 border-black p-6 bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-lg">Dispute #{d.id} - Trade #{d.trade}</h4>
                        <span className="border-2 border-black bg-yellow-200 px-2 py-1 text-xs font-bold uppercase">{d.status}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-700">Reason: {d.reason}</p>
                      <p className="text-xs mt-1 text-gray-600 italic">Details: {d.detail}</p>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => handleResolveDispute(d.id, "resolved")} className="border-2 border-black bg-green-300 hover:bg-green-400 px-4 py-2 text-xs font-bold uppercase">
                          Resolve (Refund/Approve Swap)
                        </button>
                        <button onClick={() => handleResolveDispute(d.id, "rejected")} className="border-2 border-black bg-red-300 hover:bg-red-400 px-4 py-2 text-xs font-bold uppercase">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "moderation" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {moderationQueue.map((m) => (
                    <div key={m.id} className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-4">
                      {m.image && <img src={m.image} alt="" className="w-24 h-24 object-cover border-2 border-black bg-gray-100" />}
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                          <span>User: {m.username}</span>
                          <span>Score: {m.confidence * 100}%</span>
                        </div>
                        <h4 className="font-black uppercase text-[#FF6B6B] text-xs">Detection: {m.reason}</h4>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => handleModerationAction(m.id, "approve")} className="border-2 border-black bg-green-200 hover:bg-green-300 px-2 py-1 text-xs font-bold">
                            Approve Image
                          </button>
                          <button onClick={() => handleModerationAction(m.id, "reject")} className="border-2 border-black bg-red-200 hover:bg-red-300 px-2 py-1 text-xs font-bold">
                            Reject & Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default AdminDashboard;
