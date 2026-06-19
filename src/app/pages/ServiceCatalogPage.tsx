import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wifi, Mail, Clock, CalendarOff, IndianRupee, Monitor,
  Search, ChevronRight, Sparkles, Tag,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import { MOCK_FORMS } from '../data/mockData';
import type { FormSchema } from '../types';

const ICON_MAP: Record<string, React.ElementType> = {
  Wifi, Mail, Clock, CalendarOff, IndianRupee, Monitor,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'IT Services': { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'HR Services': { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'Finance Services': { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
};

const CATEGORY_ICON_BG: Record<string, string> = {
  'IT Services': 'bg-blue-100 dark:bg-blue-900',
  'HR Services': 'bg-purple-100 dark:bg-purple-900',
  'Finance Services': 'bg-emerald-100 dark:bg-emerald-900',
};

const CATEGORY_ICON_COLOR: Record<string, string> = {
  'IT Services': 'text-blue-600 dark:text-blue-400',
  'HR Services': 'text-purple-600 dark:text-purple-400',
  'Finance Services': 'text-emerald-600 dark:text-emerald-400',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function FormCard({ form, onClick }: { form: FormSchema; onClick: () => void }) {
  const Icon = ICON_MAP[form.icon] ?? Sparkles;
  const cat = CATEGORY_COLORS[form.category] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  const iconBg = CATEGORY_ICON_BG[form.category] ?? 'bg-gray-100';
  const iconColor = CATEGORY_ICON_COLOR[form.category] ?? 'text-gray-600';

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group cursor-pointer bg-card rounded-xl border border-border/60 p-5 flex flex-col gap-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <div className={cn('size-11 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('size-5', iconColor)} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-medium', cat.bg, cat.text, cat.border)}>
            {form.category}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-foreground" style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}>{form.title}</h3>
        <p className="text-muted-foreground mt-1.5" style={{ fontSize: '12px', lineHeight: 1.5 }}>{form.description}</p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '11px' }}>
            <Clock className="size-3" />
            <span>{form.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '11px' }}>
            <Tag className="size-3" />
            <span>v{form.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '12px', fontWeight: 500 }}>
          Apply <ChevronRight className="size-3.5" />
        </div>
      </div>
    </motion.div>
  );
}

export function ServiceCatalogPage() {
  const { navigate, setSelectedForm } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(MOCK_FORMS.map(f => f.category)))];

  const filtered = MOCK_FORMS.filter(f => {
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || activeCategory === 'All' || f.category === activeCategory;
    return matchSearch && matchCat && f.active;
  });

  const grouped = filtered.reduce<Record<string, FormSchema[]>>((acc, form) => {
    if (!acc[form.category]) acc[form.category] = [];
    acc[form.category].push(form);
    return acc;
  }, {});

  const handleFormSelect = (form: FormSchema) => {
    setSelectedForm(form);
    navigate('dynamic-form');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 max-w-[1200px]"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Service Catalog</h1>
        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>
          Browse and submit service requests across IT, HR, Finance and other departments.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-64 h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            style={{ fontSize: '13px' }}
          />
        </div>

        <div className="flex items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === 'All' ? null : cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg border transition-colors',
                (cat === 'All' && !activeCategory) || cat === activeCategory
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
              )}
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="ml-auto text-muted-foreground" style={{ fontSize: '12px' }}>
          {filtered.length} service{filtered.length !== 1 ? 's' : ''} available
        </div>
      </motion.div>

      {/* Forms by category */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <Sparkles className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No services found</p>
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Try adjusting your search or filter</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, forms]) => (
            <motion.div key={category} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-foreground" style={{ fontSize: '15px', fontWeight: 600 }}>{category}</h2>
                <div className="h-px flex-1 bg-border" />
                <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{forms.length} service{forms.length !== 1 ? 's' : ''}</span>
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {forms.map(form => (
                  <FormCard key={form.id} form={form} onClick={() => handleFormSelect(form)} />
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
