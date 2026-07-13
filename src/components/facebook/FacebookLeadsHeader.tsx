import type { LucideIcon } from 'lucide-react';

interface FacebookLeadsHeaderProps {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export function FacebookLeadsHeader({
  badge,
  title,
  description,
  icon: Icon,
  iconClassName = 'text-blue-500 animate-pulse'
}: FacebookLeadsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1 px-2.5 rounded bg-blue-600/15 text-blue-400 text-xs font-mono font-medium border border-blue-500/20 uppercase tracking-widest flex items-center gap-1.5">
            {badge}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          {title} <Icon className={iconClassName} size={26} />
        </h1>
        <p className="text-neutral-400 mt-1 max-w-3xl font-sans">{description}</p>
      </div>
    </div>
  );
}
