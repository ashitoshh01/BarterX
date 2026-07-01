import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, User as UserIcon, Phone, MapPin, Mail, FileText, Check, Loader2 } from 'lucide-react';
import { fetchProfile, updateProfile, getTrustScoreBreakdown } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import type { UserProfile } from '../types';

export default function Profile() {
  const { tokens, user } = useAuth();
  const token = tokens?.access;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfile(token)
      .then((data) => {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setPhoneNumber(data.phone_number || '');
        setIsVerified(data.is_verified || false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfile(token, {
        display_name: displayName,
        bio: bio,
        location: location,
        phone_number: phoneNumber || null,
        is_verified: isVerified
      });
      setProfile(updated);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVerification = async () => {
    if (!token || !profile) return;
    const newVerified = !isVerified;
    setIsVerified(newVerified);
    
    try {
      const updated = await updateProfile(token, {
        display_name: displayName,
        bio: bio,
        location: location,
        phone_number: phoneNumber || null,
        is_verified: newVerified
      });
      setProfile(updated);
      setSuccess(newVerified ? 'Identity verified successfully! Trust score updated.' : 'Identity verification removed.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update verification status.');
      setIsVerified(!newVerified); // rollback
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-primary animate-spin" />
          <span className="text-sm font-medium text-text-secondary">Loading profile data...</span>
        </div>
      </Layout>
    );
  }

  // Ticks calculation based on current fields
  const isProfileComplete = !!(displayName && bio && location);
  const isPhoneVerified = !!phoneNumber;
  const isEmailVerified = !!(profile?.email || user?.email);
  const isIdVerified = isVerified;

  const trustLevelLabel = profile?.trust_level === 'high' ? 'High Trust' : profile?.trust_level === 'medium' ? 'Medium Trust' : 'Low Trust';
  const trustLevelColor = profile?.trust_level === 'high' 
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
    : profile?.trust_level === 'medium' 
      ? 'text-primary bg-primary/5 border-primary/20' 
      : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Profile</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your account settings and improve your marketplace trust score.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2 bg-white border border-border rounded-[24px] p-6 md:p-8">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <UserIcon size={18} className="text-primary" /> Profile Details
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Full Name / Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Email (Verified)</label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-slate-100 text-sm text-text-secondary outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell other traders about yourself..."
                  rows={4}
                  className="w-full p-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Sidebar: Trust Score & Verification Ticks */}
          <div className="flex flex-col gap-6">
            {/* BarterX Wallet */}
            <div className="bg-white border border-border rounded-[24px] p-6">
              <h3 className="text-sm font-bold text-text-primary mb-4">My BarterX Wallet</h3>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">
                  🪙
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{profile?.coin_balance || 0}</div>
                  <div className="text-xs text-text-secondary font-medium">BarterX Coins</div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    const amount = prompt("Enter amount of coins to purchase:");
                    if (amount && !isNaN(parseInt(amount))) {
                      fetch('http://127.0.0.1:8000/api/wallet/purchase-coins/', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ amount: parseInt(amount) }),
                      })
                      .then(res => res.json())
                      .then(data => {
                          alert(data.message || 'Purchase successful');
                          fetchProfile(token!).then(setProfile);
                      })
                      .catch(console.error);
                    }
                  }}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all"
                >
                  Buy Coins
                </button>
                <button
                  onClick={() => {
                    const amount = prompt("Enter amount of coins to redeem/spend:");
                    if (amount && !isNaN(parseInt(amount))) {
                      const description = prompt("Enter description for redemption (e.g. Promoted item, Premium service):") || "Redeemed coins";
                      fetch('http://127.0.0.1:8000/api/wallet/redeem-coins/', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ amount: parseInt(amount), description }),
                      })
                      .then(res => {
                        if (!res.ok) {
                          return res.json().then(err => { throw new Error(err.detail || 'Insufficient balance') });
                        }
                        return res.json();
                      })
                      .then(data => {
                          alert(data.message || 'Redemption successful');
                          fetchProfile(token!).then(setProfile);
                      })
                      .catch(err => alert(err.message));
                    }
                  }}
                  className="flex-1 h-10 rounded-xl bg-slate-100 text-text-primary border border-border text-xs font-bold hover:bg-slate-200 transition-all"
                >
                  Spend Coins
                </button>
              </div>
            </div>

            {/* Trust Meter Card */}
            <div className="bg-white border border-border rounded-[24px] p-6 flex flex-col items-center text-center">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-border"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-primary transition-all duration-500 ease-out"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - (profile?.trust_score || 50) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-text-primary">{profile?.trust_score || 50}</span>
                  <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Score</span>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${trustLevelColor} mb-2`}>
                {trustLevelLabel}
              </div>

              <p className="text-xs text-text-secondary px-4">
                Your trust score is recalculating in real-time as you complete checklist criteria.
              </p>
            </div>

            {/* Checklist Card */}
            <div className="bg-white border border-border rounded-[24px] p-6">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <Shield size={16} className="text-primary" /> Trust Criteria
              </h3>

              <div className="space-y-4">
                {/* Profile Complete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProfileComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-text-secondary'}`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Profile Completed</span>
                      <span className="text-[10px] text-text-secondary">Name, bio, and location filled</span>
                    </div>
                  </div>
                  {isProfileComplete ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Pending</span>
                  )}
                </div>

                {/* Phone Verified */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPhoneVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-text-secondary'}`}>
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Phone Verified</span>
                      <span className="text-[10px] text-text-secondary">Active phone number added</span>
                    </div>
                  </div>
                  {isPhoneVerified ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Pending</span>
                  )}
                </div>

                {/* Email Verified */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isEmailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-text-secondary'}`}>
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Email Verified</span>
                      <span className="text-[10px] text-text-secondary">Verified during login/signup</span>
                    </div>
                  </div>
                  {isEmailVerified ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Pending</span>
                  )}
                </div>

                {/* ID Verification */}
                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isIdVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-text-secondary'}`}>
                      <Shield size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-primary block">Identity Verified</span>
                      <span className="text-[10px] text-text-secondary">Simulate legal ID verification</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={toggleVerification}
                    className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${
                      isIdVerified 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                        : 'bg-primary hover:bg-primary-hover text-white shadow-sm'
                    }`}
                  >
                    {isIdVerified ? 'Verified' : 'Verify Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
