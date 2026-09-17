import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface NeoTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const NeoTabs: React.FC<NeoTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md'
}) => {
  return (
    <div className={`flex flex-wrap gap-2 p-1.5 neo-inset-sm rounded-2xl ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 font-semibold transition-all select-none cursor-pointer rounded-xl ${
              size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
            } ${
              isActive
                ? 'neo-raised bg-[#E8EEF5] text-blue-700 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
