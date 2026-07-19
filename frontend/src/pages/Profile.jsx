import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Star, Shield, MapPin, Award, Settings, Share2, Edit3, LogOut, 
  Plus, Github, Linkedin, Globe, FileText, Trash2, Eye, Repeat, Check, X, Phone
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import { NbButton } from "@/components/UI";
import ImageUploader from "@/components/ImageUploader";
import { toast } from "sonner";

const Profile = () => {
  const { user, listings, setListings, reviews, saved, logout, updateProfile, deleteListing, boostListing, editListing, categories } = useApp();
  const [tab, setTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    location: "",
    phone: "",
    college: "",
    department: "",
    yearOfStudy: "",
    github: "",
    linkedin: "",
    portfolio: "",
    avatarFiles: [],
    coverFiles: [],
    resumeFileObj: null
  });

  // Proof of Work State
  const [powOpen, setPowOpen] = useState(false);
  const [powForm, setPowForm] = useState({
    title: "",
    description: "",
    url: "",
    type: "Project", // Project, Certification, Hackathon, OpenSource, Research
    date: ""
  });

  // Listing Edit State
  const [editListingOpen, setEditListingOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    estValue: 0,
    condition: "Good",
    category: "",
    wants: []
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        phone: user.phone || "",
        college: user.college || "",
        department: user.department || "",
        yearOfStudy: user.yearOfStudy || "",
        github: user.github || "",
        linkedin: user.linkedin || "",
        portfolio: user.portfolio || "",
        avatarFiles: [],
        coverFiles: [],
        resumeFileObj: null
      });
    }
  }, [user, editMode]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Saving profile changes...");
    try {
      const payload = {
        name: profileForm.name,
        bio: profileForm.bio,
        location: profileForm.location,
        phone: profileForm.phone,
        college: profileForm.college,
        department: profileForm.department,
        yearOfStudy: profileForm.yearOfStudy,
        github: profileForm.github,
        linkedin: profileForm.linkedin,
        portfolio: profileForm.portfolio,
      };

      if (profileForm.avatarFiles.length > 0) {
        payload.avatarFile = profileForm.avatarFiles[0];
      }
      if (profileForm.coverFiles.length > 0) {
        payload.coverFile = profileForm.coverFiles[0];
      }
      if (profileForm.resumeFileObj) {
        payload.resumeFile = profileForm.resumeFileObj;
      }

      await updateProfile(payload);
      setEditMode(false);
      toast.success("Profile saved!", { id: tid });
    } catch (err) {
      toast.error(err.message || "Failed to update profile", { id: tid });
    }
  };

  const handleAddPow = async (e) => {
    e.preventDefault();
    if (!powForm.title) {
      toast.error("Title is required");
      return;
    }
    const updatedPow = [...(user.proofOfWork || []), { ...powForm, id: Date.now().toString() }];
    try {
      await updateProfile({ proofOfWork: updatedPow });
      setPowOpen(false);
      setPowForm({ title: "", description: "", url: "", type: "Project", date: "" });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add Proof of Work entry.");
    }
  };

  const handleDeletePow = async (powId) => {
    const updatedPow = (user.proofOfWork || []).filter((item) => item.id !== powId);
    try {
      await updateProfile({ proofOfWork: updatedPow });
      toast.success("Proof of Work entry removed.");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to remove Proof of Work entry.");
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

  // Determine Type Icon for Proof of Work
  const getPowIcon = (type) => {
    switch (type) {
      case "Certification": return <Award size={18} className="text-[var(--lime)]" />;
      case "Hackathon": return <Repeat size={18} className="text-[var(--pink)]" />;
      case "Research": return <FileText size={18} className="text-[var(--blue)]" />;
      default: return <Github size={18} className="text-white" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Cover Header */}
      <div className="relative">
        <div
          className="h-36 md:h-52 rounded-3xl relative overflow-hidden border border-white/10"
          style={{
            backgroundImage: `url(${user.coverPicture})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="grid-bg absolute inset-0 opacity-20" />
        </div>
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <img
            src={user.avatar}
            className="w-24 h-24 rounded-full border-2 border-[var(--bg)] object-cover shadow-[4px_4px_0_0_#000]"
            alt={user.name}
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"; }}
          />
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleLogout}
            className="nb-btn bg-red-600/95 hover:bg-red-700 border border-red-500/20 px-3.5 py-2 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-[2px_2px_0_0_#000]"
            data-testid="profile-logout"
          >
            <LogOut size={12} /> Log out
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="pt-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="font-display text-4xl flex items-center gap-2">
            {user.name}
            {user.verified && (
              <span className="nb-tag tint-lime flex items-center justify-center py-0.5 px-2 text-[10px] font-bold">
                <Shield size={10} strokeWidth={3} /> VERIFIED
              </span>
            )}
          </div>
          <div className="font-mono2 text-sm text-[var(--text-3)] flex flex-wrap gap-2 items-center mt-1">
            <span>{user.handle}</span>
            <span>·</span>
            <span><MapPin size={11} className="inline mr-1" /> {user.location}</span>
            {user.college && (
              <>
                <span>·</span>
                <span>{user.college}</span>
              </>
            )}
          </div>
        </div>
        {!editMode && (
          <NbButton variant="light" onClick={() => setEditMode(true)} data-testid="profile-edit">
            <Edit3 size={14} strokeWidth={3} /> Edit Profile
          </NbButton>
        )}
      </div>

      {/* Profile Editing Form View */}
      {editMode ? (
        <form onSubmit={handleSaveProfile} className="nb-card p-6 space-y-4 bg-[var(--surface)]">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="font-display text-xl text-white">Edit Profile Details</h3>
            <button type="button" onClick={() => setEditMode(false)} className="text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Display Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="Student Display Name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Bio</label>
              <input
                type="text"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="About me / short bio"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">College / Organization</label>
              <input
                type="text"
                value={profileForm.college}
                onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="e.g. IIT Bombay"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Department / Branch</label>
              <input
                type="text"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Year of Study</label>
              <input
                type="text"
                value={profileForm.yearOfStudy}
                onChange={(e) => setProfileForm({ ...profileForm, yearOfStudy: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="e.g. 3rd Year"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Location</label>
              <input
                type="text"
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="Hostel Room / Campus area"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="Contact details"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Resume File (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setProfileForm({ ...profileForm, resumeFileObj: e.target.files?.[0] || null })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2 text-sm text-white focus:border-[var(--lime)] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">GitHub Link</label>
              <input
                type="text"
                value={profileForm.github}
                onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="GitHub Profile URL"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">LinkedIn Link</label>
              <input
                type="text"
                value={profileForm.linkedin}
                onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="LinkedIn Profile URL"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Portfolio Website</label>
              <input
                type="text"
                value={profileForm.portfolio}
                onChange={(e) => setProfileForm({ ...profileForm, portfolio: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none transition-colors"
                placeholder="Personal Portfolio URL"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Profile Avatar Image</label>
            <ImageUploader
              files={profileForm.avatarFiles}
              onChange={(files) => setProfileForm({ ...profileForm, avatarFiles: files })}
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Cover Banner Image</label>
            <ImageUploader
              files={profileForm.coverFiles}
              onChange={(files) => setProfileForm({ ...profileForm, coverFiles: files })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <NbButton type="button" variant="light" onClick={() => setEditMode(false)}>Cancel</NbButton>
            <NbButton type="submit">Save Settings</NbButton>
          </div>
        </form>
      ) : (
        <p className="text-sm font-medium max-w-lg">{user.bio || "No description provided."}</p>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Trust Score", v: user.trustScore, t: "tint-lime" },
          { l: "Rating", v: `${user.rating}★`, t: "tint-amber" },
          { l: "Swaps", v: user.swapsCompleted, t: "tint-pink" },
          { l: "Coins", v: user.coins, t: "tint-purple" },
        ].map((s) => (
          <div key={s.l} className={`nb-card p-4 border ${s.t}`}>
            <div className="font-display text-3xl md:text-4xl text-white">{s.v}</div>
            <div className="text-[10px] font-mono2 uppercase tracking-widest mt-1 opacity-80">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Dynamic Unlocked Badges */}
      {user.badges && user.badges.length > 0 && (
        <div>
          <div className="text-xs font-mono2 uppercase mb-2">BADGES</div>
          <div className="flex gap-2 flex-wrap">
            {user.badges.map((b) => (
              <span key={b} className="nb-tag tint-amber flex items-center gap-1">
                <Award size={11} strokeWidth={3} /> {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom Tabs */}
      <div className="nb-border-2 rounded-full p-1 bg-[var(--surface)] flex w-fit overflow-x-auto">
        {[
          { k: "overview", l: "Overview" },
          { k: "listings", l: "My Listings", n: myListings.length },
          { k: "saved", l: "Saved", n: savedItems.length },
          { k: "reviews", l: "Reviews", n: reviews.length },
          { k: "pow", l: "Proof of Work", n: user.proofOfWork?.length || 0 },
          { k: "achievements", l: "Achievements" },
          { k: "activity", l: "Activity" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${tab === t.k ? "bg-black text-white" : ""}`}
            data-testid={`profile-tab-${t.k}`}
          >
            {t.l} {t.n !== undefined ? `(${t.n})` : ""}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="nb-card p-5 bg-[var(--surface-2)] space-y-4">
            <h4 className="font-display text-lg text-white">About Me</h4>
            <p className="text-xs font-mono2 text-white/80 leading-relaxed">{user.bio || "No details provided."}</p>
            <div className="space-y-2 pt-2 border-t border-white/5 text-xs font-mono2 text-[var(--text-3)]">
              <div><MapPin size={12} className="inline mr-1" /> Location: <span className="text-white">{user.location}</span></div>
              {user.phone && <div><Phone size={12} className="inline mr-1" /> Contact: <span className="text-white">{user.phone}</span></div>}
            </div>
          </div>

          <div className="nb-card p-5 bg-[var(--surface-2)] space-y-4">
            <h4 className="font-display text-lg text-white">Education Details</h4>
            <div className="space-y-3 text-xs font-mono2 text-white/80">
              <div>College/Organization: <span className="text-white font-bold">{user.college || "N/A"}</span></div>
              <div>Department/Branch: <span className="text-white font-bold">{user.department || "N/A"}</span></div>
              <div>Year of Study: <span className="text-white font-bold">{user.yearOfStudy || "N/A"}</span></div>
            </div>
            {user.resume && (
              <div className="pt-2 border-t border-white/5">
                <a href={user.resume} target="_blank" rel="noreferrer" className="nb-btn px-3 py-1.5 text-xs flex items-center gap-1.5 w-fit">
                  <FileText size={12} /> View Resume PDF
                </a>
              </div>
            )}
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
                <div className="mt-2 bg-black/40 border-2 border-white/10 p-2 rounded-xl text-[10px] font-mono2 flex justify-around text-white/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                  <span>👀 {l.views} Views</span>
                  <span>💬 {l.chatCount} Chats</span>
                  <span>📥 {l.proposalCount} Proposals</span>
                </div>
                <div className="absolute bottom-24 right-4 left-4 p-2 bg-black/90 nb-border-2 rounded-xl flex justify-around gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/app/listing/${l.id}`} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-white text-black flex items-center gap-1">
                    <Eye size={10} /> View
                  </Link>
                  <button type="button" onClick={() => handleOpenEditListing(l)} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-[var(--lime)] text-black flex items-center gap-1">
                    <Edit3 size={10} /> Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteListing(l.id)} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-[var(--pink)] text-white flex items-center gap-1">
                    <Trash2 size={10} /> Delete
                  </button>
                  <button type="button" onClick={() => handleBoostListing(l.id)} className="nb-btn px-2.5 py-1 text-[10px] font-bold bg-[var(--purple)] text-white flex items-center gap-1">
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
                    <div className="text-sm font-bold text-white">{r.from}</div>
                    <div className="text-[10px] font-mono2 text-[var(--text-3)]">{r.time}</div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-[var(--lime)] text-[var(--lime)]" : "text-white/15"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium text-white/90">{r.text}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "pow" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-xl text-white">Proof of Work</h3>
            <NbButton onClick={() => setPowOpen(true)} className="py-1 px-3 text-xs flex items-center gap-1">
              <Plus size={12} strokeWidth={3} /> Add Credibility
            </NbButton>
          </div>

          {/* Social Links Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {user.github && (
              <a href={user.github} target="_blank" rel="noreferrer" className="nb-card p-4 bg-black/40 flex items-center gap-3 hover:border-[var(--lime)] transition-colors">
                <Github size={20} className="text-white" />
                <div>
                  <div className="text-xs font-bold text-white">GitHub</div>
                  <div className="text-[10px] text-[var(--text-3)] truncate">{user.github}</div>
                </div>
              </a>
            )}
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noreferrer" className="nb-card p-4 bg-black/40 flex items-center gap-3 hover:border-[var(--lime)] transition-colors">
                <Linkedin size={20} className="text-[#0077b5]" />
                <div>
                  <div className="text-xs font-bold text-white">LinkedIn</div>
                  <div className="text-[10px] text-[var(--text-3)] truncate">{user.linkedin}</div>
                </div>
              </a>
            )}
            {user.portfolio && (
              <a href={user.portfolio} target="_blank" rel="noreferrer" className="nb-card p-4 bg-black/40 flex items-center gap-3 hover:border-[var(--lime)] transition-colors">
                <Globe size={20} className="text-[var(--lime)]" />
                <div>
                  <div className="text-xs font-bold text-white">Portfolio</div>
                  <div className="text-[10px] text-[var(--text-3)] truncate">{user.portfolio}</div>
                </div>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!user.proofOfWork || user.proofOfWork.length === 0) ? (
              <p className="col-span-full text-center py-6 text-xs text-[var(--text-3)] font-mono2">No proof of work uploaded yet. Showcase your credibility!</p>
            ) : (
              user.proofOfWork.map((item) => (
                <div key={item.id} className="nb-card p-4 bg-[var(--surface-2)] flex flex-col justify-between border border-white/5 relative">
                  <button type="button" onClick={() => handleDeletePow(item.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-700" title="Delete Entry">
                    <Trash2 size={14} />
                  </button>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getPowIcon(item.type)}
                      <span className="text-[10px] font-mono2 uppercase tracking-wide px-2 py-0.5 rounded bg-black/30 text-[var(--text-3)]">
                        {item.type}
                      </span>
                    </div>
                    <h4 className="font-display text-base text-white">{item.title}</h4>
                    <p className="text-xs text-[var(--text-2)]">{item.description}</p>
                    {item.date && <div className="text-[9px] font-mono2 text-[var(--text-3)]">{item.date}</div>}
                  </div>
                  {item.url && (
                    <div className="pt-3 mt-3 border-t border-white/5">
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--lime)] hover:underline inline-flex items-center gap-1">
                        <Globe size={11} /> Visit Project / Document Link
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "achievements" && (
        <div className="nb-card p-8 text-center text-xs text-[var(--text-3)] font-mono2 uppercase">
          🏆 Achievements widget coming in the next milestone
        </div>
      )}

      {tab === "activity" && (
        <div className="nb-card p-8 text-center text-xs text-[var(--text-3)] font-mono2 uppercase">
          ⚡ Recent activity details coming in the next milestone
        </div>
      )}

      {/* Add Proof Of Work Modal */}
      {powOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddPow} className="nb-card p-6 bg-[var(--surface)] max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display text-xl text-white">Add Proof of Work</h3>
              <button type="button" onClick={() => setPowOpen(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Entry Title</label>
              <input
                type="text"
                required
                value={powForm.title}
                onChange={(e) => setPowForm({ ...powForm, title: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none"
                placeholder="e.g. Smart Contract Swap Hack"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Type</label>
              <select
                value={powForm.type}
                onChange={(e) => setPowForm({ ...powForm, type: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none"
              >
                <option value="Project">Project</option>
                <option value="Certification">Certification</option>
                <option value="Hackathon">Hackathon</option>
                <option value="OpenSource">Open Source Contribution</option>
                <option value="Research">Research Paper</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Description</label>
              <textarea
                value={powForm.description}
                onChange={(e) => setPowForm({ ...powForm, description: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-xs font-bold text-white focus:border-[var(--lime)] outline-none h-20"
                placeholder="Provide details about your contribution or project achievements..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">URL Link (Optional)</label>
              <input
                type="url"
                value={powForm.url}
                onChange={(e) => setPowForm({ ...powForm, url: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono2 uppercase font-bold text-[var(--text-3)]">Date / Timeline</label>
              <input
                type="text"
                value={powForm.date}
                onChange={(e) => setPowForm({ ...powForm, date: e.target.value })}
                className="w-full bg-black/40 border-2 border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:border-[var(--lime)] outline-none"
                placeholder="e.g. Dec 2025"
              />
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <NbButton type="button" variant="light" onClick={() => setPowOpen(false)}>Cancel</NbButton>
              <NbButton type="submit">Add Entry</NbButton>
            </div>
          </form>
        </div>
      )}


      {/* Subpage Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-white/10">
        <Link to="/app/verification"><NbButton variant="light" className="w-full text-xs" data-testid="profile-verify">Get verified</NbButton></Link>
        <Link to="/app/disputes"><NbButton variant="light" className="w-full text-xs" data-testid="profile-disputes">Disputes</NbButton></Link>
        <Link to="/app/service-swap"><NbButton variant="light" className="w-full text-xs" data-testid="profile-services">Services</NbButton></Link>
        <Link to="/app/contracts"><NbButton variant="light" className="w-full text-xs" data-testid="profile-contracts">Contracts</NbButton></Link>
      </div>
    </div>
  );
};

export default Profile;
