import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api/';

const TABS = ['Profile', 'Account', 'Preferences'];

function Toggle({ enabled, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
          enabled ? 'bg-wine-900' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}/>
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');
  const [profile, setProfile] = useState({ bio: '', location: '', phone_number: '', profile_picture_url: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Preferences (frontend-only toggles)
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    offerAlerts: true,
    messageAlerts: true,
    weeklyDigest: false,
    publicProfile: true,
    showLocation: true,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}profiles/me/`);
        setProfile({
          bio: res.data.bio || '',
          location: res.data.location || '',
          phone_number: res.data.phone_number || '',
          profile_picture_url: res.data.profile_picture_url || '',
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`${API_URL}profiles/me/`, profile);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast('Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setField = (k) => (e) => setProfile(p => ({ ...p, [k]: e.target.value }));
  const setPref = (k) => (v) => setPrefs(p => ({ ...p, [k]: v }));

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-6">
        {/* Left: Tab nav */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 h-fit">
          {/* User avatar */}
          <div className="flex flex-col items-center gap-2 py-4 px-3 mb-2 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-wine-900 text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-800">{user?.username || 'User'}</div>
              <div className="text-xs text-gray-400">{user?.email || ''}</div>
            </div>
          </div>
          {/* Tab buttons */}
          <nav className="space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-wine-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-wine-900'
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>

        {/* Right: Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Profile Tab */}
          {activeTab === 'Profile' && (
            <form onSubmit={handleProfileSave}>
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800">Profile Information</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update your public profile details</p>
              </div>

              {loadingProfile ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-7 h-7 border-2 border-wine-900/20 border-t-wine-900 rounded-full animate-spin"/>
                </div>
              ) : (
                <div className="p-6 space-y-5">
                  {/* Avatar preview */}
                  <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
                    <div className="w-20 h-20 rounded-2xl bg-wine-900 text-white text-3xl font-bold flex items-center justify-center shadow-md overflow-hidden shrink-0">
                      {profile.profile_picture_url ? (
                        <img src={profile.profile_picture_url} alt="avatar" className="w-full h-full object-cover"/>
                      ) : (
                        user?.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800 mb-1">{user?.username}</div>
                      <div className="text-xs text-gray-400">Update your profile picture by entering a URL below</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Profile Picture URL</label>
                    <input
                      type="url"
                      value={profile.profile_picture_url}
                      onChange={setField('profile_picture_url')}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                    <textarea
                      rows="3"
                      value={profile.bio}
                      onChange={setField('bio')}
                      placeholder="Tell other traders about yourself..."
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                      <input
                        value={profile.location}
                        onChange={setField('location')}
                        placeholder="e.g. Mumbai, MH"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input
                        value={profile.phone_number}
                        onChange={setField('phone_number')}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="px-6 pb-6 flex justify-end gap-3">
                <button type="button" onClick={() => setProfile({ bio: '', location: '', phone_number: '', profile_picture_url: '' })} className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
                  Reset
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Account Tab */}
          {activeTab === 'Account' && (
            <div>
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800">Account Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">Your login credentials and account info</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                    <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 font-medium">
                      {user?.username || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                    <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 font-medium">
                      {user?.email || '—'}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <div>
                      <div className="text-sm font-bold text-amber-700 mb-0.5">Read-only fields</div>
                      <p className="text-xs text-amber-600">Username and email changes require contacting support. Password reset functionality is coming in the next release.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Change Password</label>
                  <div className="space-y-3">
                    <input type="password" disabled placeholder="Current password" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-400 cursor-not-allowed opacity-60"/>
                    <input type="password" disabled placeholder="New password" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-400 cursor-not-allowed opacity-60"/>
                    <input type="password" disabled placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-400 cursor-not-allowed opacity-60"/>
                    <span className="inline-block text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Password change — Coming soon</span>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-100 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-red-600 mb-3">Danger Zone</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Delete Account</div>
                      <div className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all data</div>
                    </div>
                    <button disabled className="px-4 py-2 rounded-xl bg-red-50 text-red-400 text-xs font-semibold cursor-not-allowed opacity-60 border border-red-100">
                      Delete — Coming soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'Preferences' && (
            <div>
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800">Preferences</h2>
                <p className="text-xs text-gray-400 mt-0.5">Customize your notification and privacy settings</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Notifications Section */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notifications</h3>
                  <div className="bg-gray-50 rounded-2xl px-5 border border-gray-100">
                    <Toggle label="Email Notifications" enabled={prefs.emailNotifications} onChange={setPref('emailNotifications')}/>
                    <Toggle label="New Offer Alerts" enabled={prefs.offerAlerts} onChange={setPref('offerAlerts')}/>
                    <Toggle label="Message Alerts" enabled={prefs.messageAlerts} onChange={setPref('messageAlerts')}/>
                    <Toggle label="Weekly Activity Digest" enabled={prefs.weeklyDigest} onChange={setPref('weeklyDigest')}/>
                  </div>
                </div>

                {/* Privacy Section */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Privacy</h3>
                  <div className="bg-gray-50 rounded-2xl px-5 border border-gray-100">
                    <Toggle label="Public Profile" enabled={prefs.publicProfile} onChange={setPref('publicProfile')}/>
                    <Toggle label="Show Location on Listings" enabled={prefs.showLocation} onChange={setPref('showLocation')}/>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="text-xs text-blue-600">Preferences are saved locally for now. Backend sync for notifications coming in a future update.</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => showToast('Preferences saved!')} className="px-6 py-2.5 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-sm shadow-md transition-colors">
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
