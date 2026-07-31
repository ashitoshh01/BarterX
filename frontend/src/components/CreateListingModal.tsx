import React, { useState, useEffect } from 'react';
import { X, Upload, Calculator, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';
import { fetchCategories, createItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Category } from '../types';

interface CreateListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateListingModal({ onClose, onSuccess }: CreateListingModalProps) {
  const { tokens } = useAuth();
  const token = tokens?.access;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [offering, setOffering] = useState('');
  const [wanting, setWanting] = useState('');
  const [condition, setCondition] = useState('brand_new');
  const [location, setLocation] = useState('Mumbai, MH');
  const [ageMonths, setAgeMonths] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Calculator Score
  const [liveScore, setLiveScore] = useState(7.0);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // Compute live score in real-time
  useEffect(() => {
    const ageDeduction = Math.min(4.0, ageMonths * 0.1);
    const priceAddition = Math.min(3.0, purchasePrice / 10000.0);
    
    let categoryBonus = 0.0;
    const selectedCat = categories.find(c => c.id === parseInt(categoryId));
    if (selectedCat) {
      if (selectedCat.is_service) {
        categoryBonus = 0.5;
      } else if (
        selectedCat.name.toLowerCase().includes('electronic') || 
        selectedCat.name.toLowerCase().includes('gadget') || 
        selectedCat.name.toLowerCase().includes('tech')
      ) {
        categoryBonus = 1.0;
      }
    }
    
    const computed = Math.max(1.0, Math.min(10.0, 7.0 - ageDeduction + priceAddition + categoryBonus));
    setLiveScore(parseFloat(computed.toFixed(1)));
  }, [ageMonths, purchasePrice, categoryId, categories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (images.length < 3) {
      setError('You must upload a minimum of 3 images of the product.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', categoryId);
      formData.append('description', description);
      formData.append('offering', offering);
      formData.append('wanting', wanting);
      formData.append('condition', condition);
      formData.append('location', location);
      formData.append('age_months', ageMonths.toString());
      formData.append('purchase_price', purchasePrice.toString());
      
      images.forEach((img) => {
        formData.append('images', img);
      });

      await createItem(token, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to list item. Please check the fields.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = liveScore >= 8.0 
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
    : liveScore >= 5.0 
      ? 'text-amber-600 bg-amber-50 border-amber-200' 
      : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Sparkles size={20} className="text-primary animate-pulse" /> List a New Item
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-bg text-text-secondary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Item Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. MacBook Pro M1"
                className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Category</label>
              <select
                required
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">What are you offering?</label>
              <input
                type="text"
                required
                value={offering}
                onChange={e => setOffering(e.target.value)}
                placeholder="e.g. 2021 Space Grey MacBook"
                className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">What do you want in exchange?</label>
              <input
                type="text"
                required
                value={wanting}
                onChange={e => setWanting(e.target.value)}
                placeholder="e.g. iPad Pro with Apple Pencil"
                className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full h-12 px-5 rounded-[var(--radius-button)] border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
              >
                <option value="brand_new">Brand New</option>
                <option value="like_new">Like New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
              <div className="mt-4 p-4 rounded-2xl bg-bg border border-border">
                <details className="group">
                  <summary className="text-xs font-bold text-primary cursor-pointer list-none flex items-center justify-between">
                    What does this condition mean?
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 text-xs text-text-secondary space-y-2">
                    <p><strong className="text-text-primary">Brand New:</strong> Sealed in original packaging, never used.</p>
                    <p><strong className="text-text-primary">Like New:</strong> Opened but barely used, no visible wear, original accessories included.</p>
                    <p><strong className="text-text-primary">Used:</strong> Shows signs of regular use, fully functional, minor cosmetic wear acceptable.</p>
                    <p><strong className="text-text-primary">Refurbished:</strong> Professionally restored to working condition, may have minor cosmetic defects.</p>
                  </div>
                </details>
              </div>
            </div>


            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, MH"
                className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Original Purchase Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={purchasePrice || ''}
                onChange={e => setPurchasePrice(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Original Price"
                className="w-full h-11 px-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Calculator Section */}
          <div className="p-4 rounded-2xl border bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1.5 mb-1">
                <Calculator size={14} className="text-primary" /> Age of Product: {ageMonths} months
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={ageMonths}
                onChange={e => setAgeMonths(parseInt(e.target.value))}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <span className="text-[10px] text-text-secondary mt-1 block">Drag slider to set age</span>
            </div>

            <div className={`w-full md:w-[150px] p-3 rounded-xl border text-center ${scoreColor} flex flex-col items-center justify-center`}>
              <span className="text-[9px] uppercase tracking-wider font-bold block mb-1">Calculated Score</span>
              <span className="text-2xl font-black">{liveScore}</span>
              <span className="text-[9px] font-semibold mt-0.5">out of 10</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the item, condition, and exchange details..."
              rows={3}
              className="w-full p-4 rounded-xl border border-border bg-bg text-sm text-text-primary focus:border-primary focus:bg-white outline-none transition-all resize-none"
            />
          </div>

          {/* Multiple Image Uploads */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1 flex items-center justify-between">
              <span>Upload Product Images (Min 3 required)</span>
              <span className={`text-[10px] font-semibold ${images.length >= 3 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {images.length}/3 selected
              </span>
            </label>
            
            <div className="grid grid-cols-4 gap-3 mt-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-bg">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-black text-white hover:scale-105 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary bg-bg hover:bg-primary/5 cursor-pointer transition-all">
                <Upload size={20} className="text-text-secondary" />
                <span className="text-[9px] text-text-secondary font-semibold mt-1">Add Image</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-border pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl border border-border text-sm font-semibold hover:bg-bg text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || images.length < 3}
              className="h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Listing...
                </>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
