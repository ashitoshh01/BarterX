import React, { useState } from 'react';
import { X, Calendar, MapPin, Tag, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import type { BarterItem } from '../types';

interface ItemDetailModalProps {
  item: BarterItem;
  onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fallback images - if no additional images, use the main image.
  const images = (item.additional_images && item.additional_images.length > 0)
    ? item.additional_images.map(img => img.image)
    : [item.image_url || item.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800'];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Safe decimal and age formats
  const displayPrice = item.purchase_price ? `₹${parseFloat(item.purchase_price).toLocaleString('en-IN')}` : 'N/A';
  const displayAge = item.age_months !== undefined ? `${item.age_months} months` : 'N/A';
  const score = item.item_score || 5.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div 
        className="relative bg-white w-full max-w-4xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-text-primary shadow-md hover:scale-105 transition-all"
        >
          <X size={20} />
        </button>

        {/* Left: Images Column */}
        <div className="w-full md:w-1/2 bg-slate-900 relative flex items-center justify-center h-[300px] md:h-auto min-h-[300px]">
          <img 
            src={images[currentImageIndex]} 
            alt={item.title}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              {/* Prev Button */}
              <button 
                onClick={prevImage}
                className="absolute left-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              {/* Next Button */}
              <button 
                onClick={nextImage}
                className="absolute right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <ArrowRight size={20} />
              </button>
              
              {/* Indicator Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Content Column */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Header / Category */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wide">
                {item.category_name || 'General'}
              </span>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <MapPin size={12} /> {item.location}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-text-primary mb-4 leading-tight">
              {item.title}
            </h2>

            {/* Description */}
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              {item.description || 'No description provided for this item.'}
            </p>

            {/* Barter Info: Offer & Want */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-bg border border-border mb-6">
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Offering</span>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{item.offering}</p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Looking For</span>
                <p className="text-sm font-semibold text-primary mt-0.5">{item.wanting}</p>
              </div>
            </div>

            {/* Specs & Calculator Score */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3.5 rounded-xl border border-border bg-white flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-text-secondary uppercase tracking-wider block">Purchase Details</span>
                  <div className="mt-1.5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Price:</span>
                      <span className="font-medium text-text-primary">{displayPrice}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Age:</span>
                      <span className="font-medium text-text-primary">{displayAge}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                  {score}
                </div>
                <div>
                  <span className="text-[11px] text-emerald-800 uppercase tracking-wider font-bold block">Item Score</span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {score >= 8 ? 'Excellent quality' : score >= 5 ? 'Good value' : 'Fair condition'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer / CTAs */}
          <div className="border-t border-border pt-6 mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                {item.owner_username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-xs text-text-secondary block">Owner</span>
                <span className="text-xs font-semibold text-text-primary">{item.owner_username}</span>
              </div>
            </div>

            <button 
              onClick={() => alert('Proposal feature coming soon!')}
              className="flex-1 max-w-[200px] h-11 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Propose Swap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
