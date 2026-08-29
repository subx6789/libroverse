import React from 'react';
import { Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { formatBytes, type CompressionResult } from '../../utils/mediaCompressor';

interface CompressionStatsBadgeProps {
  stats: CompressionResult;
  type: 'image' | 'pdf' | 'video';
  isCompressing?: boolean;
}

export const CompressionStatsBadge: React.FC<CompressionStatsBadgeProps> = ({
  stats,
  type,
  isCompressing = false,
}) => {
  if (isCompressing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium animate-pulse">
        <Sparkles className="w-3.5 h-3.5 animate-spin" />
        <span>Optimizing {type.toUpperCase()} for fast Cloudinary delivery...</span>
      </div>
    );
  }

  const hasSavings = stats.savedPercent > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
      <div className="flex items-center gap-1 font-semibold text-indigo-600 shrink-0">
        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span>Smart Compression</span>
      </div>

      <div className="flex items-center gap-1.5 text-slate-600">
        <span className="line-through text-slate-400 font-mono">
          {formatBytes(stats.originalSize)}
        </span>
        <span className="text-slate-400">➔</span>
        <span className="font-mono font-semibold text-emerald-600">
          {formatBytes(stats.compressedSize)}
        </span>
      </div>

      {hasSavings ? (
        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
          Saved {stats.savedPercent}%
        </span>
      ) : (
        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[11px] font-medium">
          <ShieldCheck className="w-3 h-3" /> Optimum Quality
        </span>
      )}
    </div>
  );
};
