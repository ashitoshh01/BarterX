import { Laptop, Shirt, Car, Home, Wrench, BookOpen, Dumbbell, MoreHorizontal } from 'lucide-react';
import type { Category } from '../types';
import { CATEGORY_DISPLAY_MAP } from '../services/api';

interface PopularCategoriesProps {
  categories: Category[];
  loading: boolean;
}

const ICON_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  'Electronics': { icon: Laptop, color: '#2563EB', bg: '#EFF6FF' },
  'Fashion': { icon: Shirt, color: '#EC4899', bg: '#FDF2F8' },
  'Vehicles': { icon: Car, color: '#22C55E', bg: '#F0FDF4' },
  'Home & Living': { icon: Home, color: '#F59E0B', bg: '#FFFBEB' },
  'Services': { icon: Wrench, color: '#8B5CF6', bg: '#F5F3FF' },
  'Books': { icon: BookOpen, color: '#06B6D4', bg: '#ECFEFF' },
  'Sports': { icon: Dumbbell, color: '#EF4444', bg: '#FEF2F2' },
  'More': { icon: MoreHorizontal, color: '#64748B', bg: '#F8FAFC' },
};

const DEFAULT_CATEGORIES = ['Electronics', 'Fashion', 'Vehicles', 'Home & Living', 'Services', 'Books', 'Sports', 'More'];

export default function PopularCategories({ categories, loading }: PopularCategoriesProps) {
  if (loading) {
    return (
      <div className="animate-fadeUp">
        <h3 className="text-base font-bold text-text-primary mb-4">Popular categories</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-shimmer rounded-[20px] h-[80px]" />
          ))}
        </div>
      </div>
    );
  }

  // Map backend categories to display names
  const displayCats = categories.length > 0
    ? categories.slice(0, 7).map(cat => CATEGORY_DISPLAY_MAP[cat.name] || cat.name)
    : DEFAULT_CATEGORIES.slice(0, 7);

  // Always include "More"
  const finalCats = [...displayCats, 'More'].slice(0, 8);

  return (
    <div className="animate-fadeUp">
      <h3 className="text-base font-bold text-text-primary mb-4">Popular categories</h3>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {finalCats.map(name => {
          const config = ICON_MAP[name] || ICON_MAP['More'];
          const Icon = config.icon;

          return (
            <button
              key={name}
              className="flex flex-col items-center gap-2 p-3 rounded-[20px] border border-border bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: config.bg }}
              >
                <Icon size={20} style={{ color: config.color }} />
              </div>
              <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
