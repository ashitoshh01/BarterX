import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Tag, MapPin, Inbox, Loader2 } from 'lucide-react';
import { fetchItems } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ItemDetailModal from '../components/ItemDetailModal';
import type { BarterItem } from '../types';

export default function Search() {
  const { tokens } = useAuth();
  const token = tokens?.access;
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [items, setItems] = useState<BarterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<BarterItem | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchItems(token || undefined, query)
      .then((data) => {
        setItems(data.filter(item => item.status === 'active'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, token]);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <SearchIcon size={24} className="text-primary" /> Search Results
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {query ? `Showing results for "${query}"` : 'Showing all active listings'}
            </p>
          </div>
          <div className="text-sm font-semibold text-text-secondary">
            {items.length} items found
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <span className="text-sm font-medium text-text-secondary">Searching the marketplace...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-3xl bg-white p-8">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-text-secondary">
              <Inbox size={28} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">No items found</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              We couldn't find any items matching your keyword. Try typing another category, name, or location.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => {
              const mainImg = item.image_url || item.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800';
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

                  {/* Swaps detail */}
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 flex flex-col gap-1 bg-slate-50/50">
                    <div className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Swapping</div>
                    <div className="text-xs font-semibold text-text-primary truncate">
                      {item.offering} ➔ <span className="text-primary">{item.wanting}</span>
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
