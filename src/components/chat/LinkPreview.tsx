'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
}

interface PreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPreview = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error('Failed to fetch preview');
        
        const json = await res.json();
        
        if (isMounted) {
          // If no title or image, we consider it not rich enough to show a card,
          // but we'll show it if at least title exists.
          if (json.title) {
            setData(json);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error || (!loading && !data)) {
    return null; // Don't render anything if it fails
  }

  if (loading) {
    return (
      <div className="mt-2 w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50/50 p-3 animate-pulse">
        <div className="w-full h-32 bg-slate-200 rounded-lg mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <a 
      href={data?.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block mt-2 w-full max-w-[280px] md:max-w-sm rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow group text-left"
    >
      {data?.image && (
        <div className="w-full h-32 sm:h-40 bg-slate-100 relative overflow-hidden border-b border-slate-100">
          <img 
            src={data.image} 
            alt={data.title || 'Link preview'} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            loading="lazy"
          />
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 flex items-start gap-1">
          {data?.title}
        </h4>
        {data?.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
            {data.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <ExternalLink className="w-3 h-3" />
          {data?.domain}
        </div>
      </div>
    </a>
  );
}
