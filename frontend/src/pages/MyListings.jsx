import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api/';

const CATEGORIES = [
  "Fashion & Apparel", "Lifestyle & Home", "Media & Entertainment",
  "Jewellery & Accessories", "Automotive & Accessories", "Electronics & Gadgets",
  "Hospitality & Equipment", "Travel & Luggage", "Beauty & Personal Care",
  "Healthcare & Wellness", "Entertainment & Gaming", "Events & Celebrations",
  "Marketing & Advertising", "Finance & Accounting", "Operations & Supply Chain",
  "Human Resources & Recruitment", "Legal & Compliance", "Sales & Business Development",
  "Technology & IT Services", "Agriculture & Farming", "Construction & Real Estate",
  "Transport & Logistics", "Household & Craftsman Services"
];

const STATUS_CONFIG = {
  active:   { label: 'Active',    bg: 'bg-emerald-100 text-emerald-700' },
  draft:    { label: 'Draft',     bg: 'bg-gray-100 text-gray-500' },
  archived: { label: 'Archived', bg: 'bg-orange-100 text-orange-600' },
  traded:   { label: 'Traded',   bg: 'bg-blue-100 text-blue-600' },
};

const CONDITION_OPTIONS = [
  { value: 'brand_new',      label: 'Brand New' },
  { value: 'like_new',       label: 'Like New' },
  { value: 'used',           label: 'Used' },
  { value: 'refurbished',    label: 'Refurbished' },
  { value: 'not_applicable', label: 'Not Applicable (Service)' },
];

const EMPTY_FORM = {
  title: '', description: '', offering: '', wanting: '',
  category: null, image_url: '', location: '',
  condition: 'not_applicable', status: 'active',
};

function ListingModal({ initial, categories, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, category: form.category ? parseInt(form.category) : null };
      if (initial?.id) {
        const res = await axios.patch(`${API_URL}items/${initial.id}/`, payload);
        onSave(res.data, 'edit');
      } else {
        const res = await axios.post(`${API_URL}items/`, payload);
        onSave(res.data, 'create');
      }
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{initial?.id ? 'Edit Listing' : 'Create New Listing'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details of your barter offer</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Vintage Leather Jacket" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select value={form.category || ''} onChange={set('category')} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-wine-900/20 cursor-pointer">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Condition</label>
              <select value={form.condition} onChange={set('condition')} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-wine-900/20 cursor-pointer">
                {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Offering *</label>
              <input required value={form.offering} onChange={set('offering')} placeholder="What you're giving" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Wanting *</label>
              <input required value={form.wanting} onChange={set('wanting')} placeholder="What you want in return" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
              <input value={form.location} onChange={set('location')} placeholder="e.g. Mumbai, MH" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-wine-900/20 cursor-pointer">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
            <input value={form.image_url} onChange={set('image_url')} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea rows="3" value={form.description} onChange={set('description')} placeholder="Tell potential traders more about your item..." className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-900/20 transition-all resize-none"/>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : (initial?.id ? 'Save Changes' : 'Publish Listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ item, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Delete Listing?</h3>
        <p className="text-sm text-gray-500 mb-6">"{item.title}" will be permanently removed.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function MyListings() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', item?: obj }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, catRes] = await Promise.all([
          axios.get(`${API_URL}items/my_items/`),
          axios.get(`${API_URL}categories/`),
        ]);
        setItems(itemsRes.data?.results || itemsRes.data || []);
        setCategories(catRes.data?.results || catRes.data || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = (saved, mode) => {
    if (mode === 'create') {
      setItems(prev => [saved, ...prev]);
      showToast('Listing published successfully!');
    } else {
      setItems(prev => prev.map(i => i.id === saved.id ? saved : i));
      showToast('Listing updated successfully!');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}items/${deleteTarget.id}/`);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast('Listing deleted.', 'error');
    } catch (err) {
      showToast('Failed to delete.', 'error');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'archived' : 'active';
    try {
      const res = await axios.patch(`${API_URL}items/${item.id}/`, { status: newStatus });
      setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
      showToast(`Listing marked as ${newStatus}.`);
    } catch (err) {
      showToast('Status update failed.', 'error');
    }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  const counts = {
    all: items.length,
    active: items.filter(i => i.status === 'active').length,
    draft: items.filter(i => i.status === 'draft').length,
    archived: items.filter(i => i.status === 'archived').length,
    traded: items.filter(i => i.status === 'traded').length,
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your barter offers and services</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wine-900 hover:bg-wine-800 text-white font-semibold text-sm shadow-md transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          New Listing
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
              filter === key
                ? 'bg-wine-900 text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-wine-900/30 hover:text-wine-900'
            }`}
          >
            {key} <span className="ml-1 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-wine-900/20 border-t-wine-900 rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-24 flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          </div>
          <h3 className="text-base font-bold text-gray-500">No {filter === 'all' ? '' : filter} listings yet</h3>
          <p className="text-sm text-gray-400">Start by creating your first barter listing.</p>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="px-6 py-2.5 rounded-xl bg-wine-900 text-white text-sm font-semibold hover:bg-wine-800 transition-colors shadow-md"
          >
            Create Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(item => {
            const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
            const imgSrc = item.image_url || item.image || `https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80`;
            return (
              <article key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group">
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  <img src={imgSrc} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status.bg}`}>
                    {status.label}
                  </span>
                  {item.category_name && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-sm">
                      {item.category_name}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm leading-snug">{item.title}</h3>
                    {item.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                      </span>
                      <span className="text-gray-400 uppercase text-[8px] font-bold tracking-widest">Offering</span>
                      <span className="text-gray-700 font-semibold truncate">{item.offering}</span>
                    </div>
                    <div className="border-t border-gray-100"/>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                      </span>
                      <span className="text-gray-400 uppercase text-[8px] font-bold tracking-widest">Wanting</span>
                      <span className="text-gray-700 font-semibold truncate">{item.wanting}</span>
                    </div>
                  </div>

                  {item.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {item.location}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-1">
                    <button
                      onClick={() => setModal({ mode: 'edit', item: { ...item, category: item.category } })}
                      className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      Edit
                    </button>
                    {item.status !== 'traded' && (
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="flex-1 py-2 rounded-xl border border-gray-200 hover:border-wine-900/30 hover:text-wine-900 text-gray-500 font-semibold text-xs transition-colors"
                      >
                        {item.status === 'active' ? 'Archive' : 'Activate'}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <ListingModal
          initial={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm item={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)}/>
      )}
    </div>
  );
}
