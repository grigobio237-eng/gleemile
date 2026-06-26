import React from 'react';
import Link from 'next/link';

interface GalleryTabsProps {
  activeTab: 'artworks' | 'artists';
}

export function GalleryTabs({ activeTab }: GalleryTabsProps) {
  return (
    <div className="flex justify-center md:justify-end mb-8 border-b border-line pb-4">
      <div className="flex items-center gap-8 px-4">
        <Link 
          href="/gallery/artworks"
          className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
            activeTab === 'artworks' 
              ? 'border-obsidian text-obsidian' 
              : 'border-transparent text-slate hover:text-obsidian'
          }`}
        >
          작품
        </Link>
        <Link 
          href="/gallery/artists"
          className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
            activeTab === 'artists' 
              ? 'border-obsidian text-obsidian' 
              : 'border-transparent text-slate hover:text-obsidian'
          }`}
        >
          작가
        </Link>
      </div>
    </div>
  );
}
