import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FacebookLeadsTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon: ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function FacebookLeadsTabs({ tabs, activeTab, onTabChange }: FacebookLeadsTabsProps) {
  return (
    <div className="flex flex-wrap border-b border-neutral-800 gap-1 bg-neutral-950 p-1 rounded-xl border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition uppercase cursor-pointer ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
