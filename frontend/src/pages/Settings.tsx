import React from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Bell, Shield, Eye, Trash2 } from 'lucide-react';

export default function Settings() {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <SettingsIcon size={24} className="text-primary" /> Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Configure your BarterX preferences and security configurations.
          </p>
        </div>

        <div className="max-w-3xl bg-white border border-border rounded-[24px] p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Notifications</h3>
              <p className="text-xs text-text-secondary mt-1">
                Receive notifications when you get barter proposals, chat messages, or reviews.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                <span className="text-xs text-text-primary font-semibold">Enable desktop push notifications</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Account Security</h3>
              <p className="text-xs text-text-secondary mt-1">
                Manage your login passwords, OTP verification options, and device authorizations.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex items-start gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl mt-1">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-600">Danger Zone</h3>
              <p className="text-xs text-text-secondary mt-1">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button 
                onClick={() => alert('Account deletion coming soon!')}
                className="mt-3 h-9 px-4 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
