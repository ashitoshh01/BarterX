import React, { useState, useEffect } from 'react';
import { List, Tag, MapPin, Inbox, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { fetchMyItems, deleteItem, updateItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ItemDetailModal from '../components/ItemDetailModal';
import type { BarterItem } from '../types';

export default function MyListings() {
  const { tokens } = useAuth();
  const token = tokens?.access;

  const [items, setItems] = useState<BarterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<BarterItem | null>(null);

  const loadItems = () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyItems(token)
      .then((data) => {
        setItems(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, [token]);

  const handleDelete = async (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    if (!token) return;
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteItem(token, itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete listing.");
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, item: BarterItem) => {
    e.stopPropagation();
    if (!token) return;
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await updateItem(token, item.id, { status: newStatus });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: updated.status } : i));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <List size={24} className="text-primary" /> My Listings
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage, view, and modify the items you have listed on the marketplace.
            </p>
          </div>
          <div className="text-sm font-semibold text-text-secondary bg-white px-4 py-2 border border-border rounded-xl">
            {items.length} total listings
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <span className="text-sm font-medium text-text-secondary">Loading your listings...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-3xl bg-white p-8 animate-fadeUp">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-text-secondary">
              <Inbox size={28} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">No listings found</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              You haven't listed any items for barter yet. Click the "List an Item" button to create your first listing!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => {
              const mainImg = item.image_url || item.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800';
              const isItemActive = item.status === 'active';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white border border-border hover:border-primary/30 rounded-[20px] overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Image */}
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      <img
                        src={mainImg}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Score and Status */}
                      <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize bg-white/90 backdrop-blur-sm shadow-sm ${
                        isItemActive ? 'text-emerald-600 border-emerald-200' : 'text-slate-500 border-slate-200'
                      }`}>
                        {item.status}
                      </div>
                      {item.item_score !== undefined && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm border border-border text-xs font-bold text-emerald-600">
                          ⭐ {item.item_score}
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                        <Tag size={10} />
                        {item.category_name || 'General'}
                      </div>

                      <h3 className="font-bold text-sm text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                        <MapPin size={12} />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Swaps detail */}
                    <div className="px-4 pb-3 border-t border-border/50 pt-3 flex flex-col gap-1 bg-slate-50/50">
                      <div className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Swapping</div>
                      <div className="text-xs font-semibold text-text-primary truncate">
                        {item.offering} ➔ <span className="text-primary">{item.wanting}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-border/20 gap-2 bg-slate-50/50">
                      <button
                        onClick={(e) => handleToggleStatus(e, item)}
                        className={`flex-1 h-8 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          isItemActive
                            ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {isItemActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer border-none"
                        title="Delete Listing"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </Layout>
  );
}
