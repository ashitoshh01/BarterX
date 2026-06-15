import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { fetchInterests, acceptInterest, rejectInterest } from '../services/api';
import type { BarterInterest } from '../types';

export default function Offers() {
  const { tokens, user } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<BarterInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    loadInterests();
  }, [tokens]);

  const loadInterests = async () => {
    if (!tokens?.access) return;
    try {
      setLoading(true);
      const data = await fetchInterests(tokens.access);
      setInterests(data);
    } catch (err) {
      console.error('Failed to fetch interests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    if (!tokens?.access) return;
    try {
      const res = await acceptInterest(tokens.access, id);
      if (res.chat_room_id) {
         navigate(`/messages?room=${res.chat_room_id}`);
      } else {
         loadInterests();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to accept offer');
    }
  };

  const handleReject = async (id: number) => {
    if (!tokens?.access) return;
    try {
      await rejectInterest(tokens.access, id);
      loadInterests();
    } catch (err) {
      console.error(err);
      alert('Failed to reject offer');
    }
  };

  const isReceived = (interest: BarterInterest) => {
    return interest.receiver === user?.id;
  };

  const filteredInterests = interests.filter(i => 
    activeTab === 'received' ? isReceived(i) : !isReceived(i)
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-fadeUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Offers</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your swap proposals and requests.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'received' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Received Offers
            {activeTab === 'received' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'sent' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Sent Offers
            {activeTab === 'sent' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredInterests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-border">
            <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📭</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">No {activeTab} offers</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              {activeTab === 'received' 
                ? "You haven't received any swap proposals yet."
                : "You haven't sent any swap proposals yet. Start browsing to find items you like!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredInterests.map((interest) => (
              <div key={interest.id} className="bg-white rounded-2xl border border-border p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  {interest.requested_item_detail?.image_url || interest.requested_item_detail?.image ? (
                    <img 
                      src={interest.requested_item_detail.image_url || interest.requested_item_detail.image!} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      interest.status === 'pending' ? 'bg-warning/10 text-warning' :
                      interest.status === 'accepted' ? 'bg-success/10 text-success' :
                      interest.status === 'completed' ? 'bg-primary/10 text-primary' :
                      'bg-gray-100 text-text-secondary'
                    }`}>
                      {interest.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(interest.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-bold text-text-primary truncate">
                    {interest.requested_item_detail?.title || 'Unknown Item'}
                  </h3>
                  
                  <p className="text-sm text-text-secondary mt-1">
                    {activeTab === 'received' ? (
                      <>
                        <span className="font-semibold text-text-primary">{interest.requester_display_name || interest.requester_username}</span> proposed a swap request for your item.
                      </>
                    ) : (
                      <>
                        You proposed a swap request for <span className="font-semibold text-text-primary">{interest.receiver_display_name || interest.receiver_username}</span>'s item.
                      </>
                    )}
                  </p>
                  
                  {interest.offered_item_detail && (
                    <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
                      <span className="px-2 py-1 bg-bg rounded-lg font-medium text-text-primary">
                        Offered: {interest.offered_item_detail.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  {interest.status === 'pending' && activeTab === 'received' && (
                    <>
                      <button
                        onClick={() => handleAccept(interest.id)}
                        className="flex-1 sm:flex-none h-9 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(interest.id)}
                        className="flex-1 sm:flex-none h-9 px-4 bg-white border border-border hover:bg-bg text-text-primary text-sm font-semibold rounded-xl transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {interest.status === 'accepted' && (
                    <button
                      onClick={() => navigate(`/messages?room=${interest.chat_room_id}`)}
                      className="flex-1 sm:flex-none h-9 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Go to Chat
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
