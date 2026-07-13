import React from 'react';
import { Share2, Sparkles, Compass } from 'lucide-react';
import type { FBPost } from './types';

const FacebookIcon = Share2;

interface VirtualFeedTabProps {
  keywords: string[];
  generatingAiPost: boolean;
  filteredSimulatedPosts: FBPost[];
  onGenerateAiPost: () => void;
  onAnalyzePost: (postText: string, authorName: string, groupName: string) => void;
}

export const VirtualFeedTab: React.FC<VirtualFeedTabProps> = React.memo(({
  keywords,
  generatingAiPost,
  filteredSimulatedPosts,
  onGenerateAiPost,
  onAnalyzePost,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/10 border border-blue-500/20 p-4 rounded-xl">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <p className="text-xs font-mono font-semibold text-neutral-200">
              Skanowanie fb_groups_live z Gemini PRO
            </p>
            <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
              Monitoruje {keywords.length} słów kluczowych pod kątem realnych potrzeb w grupach.
            </p>
          </div>
        </div>
        <button
          onClick={onGenerateAiPost}
          disabled={generatingAiPost}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(24,119,242,0.25)] cursor-pointer"
        >
          <Sparkles size={13} className={generatingAiPost ? "animate-spin" : ""} />
          {generatingAiPost ? "Symulacja..." : "🤖 Symuluj nowy post AI z grup"}
        </button>
      </div>

      {filteredSimulatedPosts.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <Compass size={40} className="mx-auto text-neutral-700 mb-3 animate-pulse" />
          <p className="text-xs">Brak nowo wykrytych wzmianek w monitorowanych grupach</p>
          <p className="text-[11px] text-neutral-600 mt-1">Upewnij się, że słowa kluczowe są wystarczająco dopasowane lub rozszerz ich bazę.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredSimulatedPosts.map((post) => (
            <div
              key={post.id}
              className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 hover:border-blue-500/30 transition relative overflow-hidden group"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-600/10 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                    <FacebookIcon size={16} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      {post.authorName}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      {post.groupName} • {post.relativeTime}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => onAnalyzePost(post.postText, post.authorName, post.groupName)}
                  className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white text-[11px] font-mono font-medium py-1 px-3 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles size={12} /> ANALIZUJ OKAZJĘ
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-neutral-950 p-3.5 rounded-lg border border-neutral-900 border-l border-l-blue-500 whitespace-pre-wrap">
                {post.postText}
              </p>

              {post.hasDomain && (
                <div className="mt-3 flex items-center justify-between text-[11px] bg-neutral-900/40 p-2 rounded border border-neutral-800">
                  <span className="text-neutral-500 flex items-center gap-1 font-mono">
                    Wykryta strona www: <span className="text-blue-400 font-semibold">{post.hasDomain}</span>
                  </span>
                  <span className="text-emerald-500 font-mono text-[10px] font-semibold flex items-center gap-1">
                    Intencja: Wysoka
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

VirtualFeedTab.displayName = 'VirtualFeedTab';
