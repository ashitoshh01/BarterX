import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Star, Shield, MapPin, Edit3, LogOut, Briefcase, User, 
  Trash2, Eye, Check, X
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import { NbButton } from "@/components/UI";
import { toast } from "sonner";
import { DEFAULT_AVATAR } from "@/lib/constants";

import { reverseGeocode } from "@/lib/geocoding";

const Profile = () => {
  const { user, listings, setListings, reviews, saved, logout, updateProfile, deleteListing, boostListing } = useApp();
  const [tab, setTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const navigate = useNavigate();

  // Basic Profile Form State (Name, City, State, Country, Profession, Bio, Location)
  const [profileForm, setProfileForm] = useState({
    name: "",
    city: "",
    state: "",
    country: "",
    profession: "",
    bio: "",
    location_name: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
        profession: user.profession || "",
        bio: user.bio || "",
        location_name: user.location_name || user.location || "",
        latitude: user.latitude ?? null,
        longitude: user.longitude ?? null,
      });
    }
  }, [user, editMode]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    const tid = toast.loading("Detecting your current location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const geo = await reverseGeocode(lat, lng);
        setProfileForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location_name: geo.location_name,
          city: geo.city || prev.city,
          state: geo.state || prev.state,
          country: geo.country || prev.country,
        }));
        setLocating(false);
        toast.success(`Location updated: ${geo.location_name}`, { id: tid });
      },
      (err) => {
        setLocating(false);
        let msg = "Failed to capture location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission was denied.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out.";
        }
        toast.error(msg, { id: tid });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Saving profile details...");
    try {
      await updateProfile({
        name: profileForm.name,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country,
        profession: profileForm.profession,
        bio: profileForm.bio,
        location_name: profileForm.location_name,
        latitude: profileForm.latitude,
        longitude: profileForm.longitude,
        avatarFile: avatarFile,
      });
      setEditMode(false);
      toast.success("Profile updated (+Trust Score updated)!", { id: tid });
    } catch (err) {
      toast.error(err.message || "Failed to update profile", { id: tid });
    }
  };

  const handleOpenEditListing = (l) => {
    navigate(`/app/edit/${l.id}`);
  };

  const handleDeleteListing = (listingId) => {
    const listingToDelete = listings.find((l) => l.id === listingId);
    if (!listingToDelete) return;

    if (!window.confirm(`Delete listing "${listingToDelete.title}"? This action cannot be undone.`)) return;

    const originalListings = [...listings];
    setListings((prev) => prev.filter((l) => l.id !== listingId));

    let isUndone = false;

    const performDelete = async () => {
      if (isUndone) return;
      try {
        await deleteListing(listingId);
        toast.success("Listing permanently deleted.");
      } catch (err) {
        console.error("Failed to delete listing permanently:", err);
        toast.error("Failed to permanently delete listing.");
        setListings(originalListings);
      }
    };

    const timeoutId = setTimeout(performDelete, 10000);

    toast("Listing deleted.", {
      duration: 10000,
      action: {
        label: "Undo",
        onClick: () => {
          isUndone = true;
          clearTimeout(timeoutId);
          setListings(originalListings);
          toast.success("Deletion cancelled.");
        }
      }
    });
  };

  const handleBoostListing = async (listingId) => {
    try {
      await boostListing(listingId);
    } catch (err) {
      // toast is already shown in context
    }
  };

  const myListings = listings.filter((l) => l.owner?.username === user.id);
  const savedItems = listings.filter((l) => saved.has(l.id));

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Sleek User Profile Header (No Picture / Job Junk) */}
      <div className="nb-card p-6 bg-[var(--surface-2)] border-2 border-[var(--border)] relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-display text-3xl md:text-4xl text-[var(--text)] flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-black object-cover shadow-sm" alt="" onError={(e) => { e.target.src = DEFAULT_AVATAR; }} />
              ) : (
                <img src={DEFAULT_AVATAR} className="w-12 h-12 rounded-full border-2 border-black object-cover shadow-sm" alt="" />
              )}
              {user.name}
              {user.verified && (
                <span className="nb-tag tint-lime flex items-center justify-center py-0.5 px-2 text-[10px] font-bold">
                  <Shield size={10} strokeWidth={3} /> VERIFIED
                </span>
              )}
            </div>
            <div className="font-mono2 text-xs text-[var(--text-3)] flex flex-wrap gap-2 items-center">
              <span>{user.handle}</span>
              <span>·</span>
              <span><MapPin size={11} className="inline mr-1 text-[var(--lime)]" /> {user.location}</span>
              {user.profession && (
                <>
                  <span>·</span>
                  <span><Briefcase size={11} className="inline mr-1 text-[var(--blue)]" /> {user.profession}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {!editMode && (
              <NbButton variant="light" onClick={() => setEditMode(true)} data-testid="profile-edit" className="text-xs">
                <Edit3 size={14} strokeWidth={3} /> Edit Profile
              </NbButton>
            )}
            <button
              onClick={handleLogout}
              className="nb-btn bg-red-500 hover:bg-red-600 border border-red-400 px-3.5 py-2 rounded-full text-xs font-bold text-white flex items-center gap-1"
              data-testid="profile-logout"
            >
              <LogOut size={12} /> Log out
            </button>
          </div>
        </div>
      </div>

      {/* Basic Profile Form (Name, State, City, Profession, Bio) */}
      {editMode ? (
        <form onSubmit={handleSaveProfile} className="nb-card p-6 space-y-4 bg-[var(--surface)] border-2 border-[var(--lime)]">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <h3 className="font-display text-xl text-[var(--text)]">Update Basic Profile</h3>
            <button type="button" onClick={() => setEditMode(false)} className="text-[var(--text-2)] hover:text-[var(--text)]">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-1 pb-2 border-b border-[var(--border)]">
            <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files[0])}
              className="w-full bg-[var(--surface-3)] border-2 border-[var(--border)] rounded-lg p-2 text-sm text-[var(--text)] focus:border-[var(--lime)] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-[var(--surface-3)] border-2 border-[var(--border)] rounded-lg p-2.5 text-sm font-bold text-[var(--text)] focus:border-[var(--lime)] outline-none"
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">City</label>
              <input
                type="text"
                required
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                className="w-full bg-[var(--surface-3)] border-2 border-[var(--border)] rounded-lg p-2.5 text-sm font-bold text-[var(--text)] focus:border-[var(--lime)] outline-none"
                placeholder="e.g. Mumbai, Delhi, Bangalore"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">State</label>
              <input
                type="text"
                required
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                className="w-full bg-[var(--surface-3)] border-2 border-[var(--border)] rounded-lg p-2.5 text-sm font-bold text-[var(--text)] focus:border-[var(--lime)] outline-none"
                placeholder="e.g. Maharashtra, Karnataka"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Profession / Role</label>
              <input
                type="text"
                required
                value={profileForm.profession}
                onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
                className="w-full bg-[var(--surface-3)] border-2 border-[var(--border)] rounded-lg p-2.5 text-sm font-bold text-[var(--text)] focus:border-[var(--lime)] outline-none"
                placeholder="e.g. Student, Designer, Developer, Trader"
              />
            </div>

            <div className="space-y-2 md:col-span-2 nb-border-2 rounded-xl p-3 bg-[var(--surface-2)] tint-amber">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)] block">Geographic Location</label>
                  <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 mt-0.5">
                    <MapPin size={13} className="text-[var(--lime)] shrink-0" />
                    {profileForm.location_name || (profileForm.city && profileForm.state ? `${profileForm.city}, ${profileForm.state}` : "No GPS coordinates set")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="nb-btn text-xs px-3 py-1.5 rounded-lg font-bold bg-[var(--lime)] text-black flex items-center gap-1.5 shadow-sm"
                  data-testid="profile-use-location"
                >
                  <MapPin size={12} /> {locating ? "Detecting..." : "Use My Current Location"}
                </button>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Short Bio / Description</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-[var(--surface-3)] border-2 border-[var(--border)] rounded-lg p-2.5 text-xs font-bold text-[var(--text)] focus:border-[var(--lime)] outline-none h-20"
                placeholder="Brief note about what you trade or offer..."
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border)]">
            <NbButton type="button" variant="light" onClick={() => setEditMode(false)}>Cancel</NbButton>
            <NbButton type="submit">Save Profile & Boost Trust Score</NbButton>
          </div>
        </form>
      ) : (
        <p className="text-sm font-medium max-w-lg text-[var(--text)]">{user.bio || "No description provided."}</p>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Trust Score", v: user.trustScore, t: "tint-lime" },
          { l: "Rating", v: `${user.rating}★`, t: "tint-amber" },
          { l: "Swaps", v: user.swapsCompleted, t: "tint-pink" },
          { l: "Coins", v: user.coins, t: "tint-purple" },
        ].map((s) => (
          <div key={s.l} className={`nb-card p-4 border ${s.t} flex flex-col justify-between`}>
            <div>
              <div className="font-display text-3xl md:text-4xl text-[var(--text)]">{s.v}</div>
              <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">{s.l}</div>
            </div>
            {s.l === "Trust Score" && (
              <div className="mt-3">
                {user.trustScore < 60 ? (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="w-full text-[11px] font-bold py-1.5 px-2 rounded-xl bg-[var(--lime)] text-black hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm border border-black"
                  >
                    <Edit3 size={11} strokeWidth={3} /> Complete Profile (+40)
                  </button>
                ) : (
                  <div className="text-[10px] font-bold text-[var(--lime)] flex items-center gap-1">
                    <Check size={12} strokeWidth={3} /> Profile Complete
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Tabs */}
      <div className="nb-border-2 rounded-full p-1 bg-[var(--surface)] flex w-fit overflow-x-auto">
        {[
          { k: "overview", l: "Overview" },
          { k: "listings", l: "My Listings", n: myListings.length },
          { k: "saved", l: "Saved", n: savedItems.length },
          { k: "reviews", l: "Reviews", n: reviews.length },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${tab === t.k ? "bg-[var(--text)] text-white" : ""}`}
            data-testid={`profile-tab-${t.k}`}
          >
            {t.l} {t.n !== undefined ? `(${t.n})` : ""}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === "overview" && (
        <div className="nb-card p-5 bg-[var(--surface-2)] space-y-4">
          <h4 className="font-display text-lg text-[var(--text)]">About Me & Location</h4>
          <p className="text-xs font-mono2 text-[var(--text)] leading-relaxed">{user.bio || "No details provided."}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[var(--border)] text-xs font-mono2">
            <div>
              <span className="text-[var(--text-3)]">City:</span> <span className="text-[var(--text)] font-bold">{user.city || "Not set"}</span>
            </div>
            <div>
              <span className="text-[var(--text-3)]">State:</span> <span className="text-[var(--text)] font-bold">{user.state || "Not set"}</span>
            </div>
            <div>
              <span className="text-[var(--text-3)]">Profession:</span> <span className="text-[var(--text)] font-bold">{user.profession || "Not set"}</span>
            </div>
          </div>
        </div>
      )}

      {tab === "listings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myListings.length === 0 ? (
            <p className="col-span-full text-center py-6 text-xs text-[var(--text-3)] font-mono2">No listings yet.</p>
          ) : (
            myListings.map((l) => (
              <div key={l.id} className="relative group flex flex-col">
                <div className="flex-1">
                  <ListingCard listing={l} />
                </div>
                {/* Listing Analytics */}
                <div className="mt-2 bg-[var(--surface-3)] border-2 border-[var(--border)] p-2 rounded-xl text-[10px] font-mono2 flex justify-around text-[var(--text)] shadow-sm">
                  <span>👀 {l.views} Views</span>
                  <span>💬 {l.chatCount} Chats</span>
                  <span>📥 {l.proposalCount} Proposals</span>
                </div>
                <div className="absolute bottom-24 right-4 left-4 p-2 bg-[var(--text)] nb-border-2 rounded-xl flex justify-around gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/app/listing/${l.id}`} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-white text-black flex items-center gap-1">
                    <Eye size={10} /> View
                  </Link>
                  <button type="button" onClick={() => handleOpenEditListing(l)} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-[var(--lime)] text-black flex items-center gap-1">
                    <Edit3 size={10} /> Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteListing(l.id)} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-[var(--pink)] text-[var(--text)] flex items-center gap-1">
                    <Trash2 size={10} /> Delete
                  </button>
                  <button type="button" onClick={() => handleBoostListing(l.id)} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-[var(--purple)] text-[var(--text)] flex items-center gap-1">
                    🚀 Boost
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedItems.length === 0 ? (
            <p className="col-span-full text-center py-6 text-xs text-[var(--text-3)] font-mono2">No saved items.</p>
          ) : (
            savedItems.map((l) => <ListingCard key={l.id} listing={l} />)
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-center py-6 text-xs text-[var(--text-3)] font-mono2">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="nb-card p-4 bg-[var(--surface)]" data-testid={`review-${r.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[var(--text)]">{r.from}</div>
                    <div className="text-[10px] font-mono2 text-[var(--text-3)]">{r.time}</div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-[var(--lime)] text-[var(--lime)]" : "text-white/15"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium text-[var(--text)]">{r.text}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Action Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-[var(--border)]">
        <Link to="/app/verification"><NbButton variant="light" className="w-full text-xs" data-testid="profile-verify">Get verified</NbButton></Link>
        <Link to="/app/disputes"><NbButton variant="light" className="w-full text-xs" data-testid="profile-disputes">Disputes</NbButton></Link>
        <Link to="/app/service-swap"><NbButton variant="light" className="w-full text-xs" data-testid="profile-services">Services</NbButton></Link>
        <Link to="/app/contracts"><NbButton variant="light" className="w-full text-xs" data-testid="profile-contracts">Contracts</NbButton></Link>
      </div>
    </div>
  );
};

export default Profile;
