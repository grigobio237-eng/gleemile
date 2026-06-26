'use client';

import React from 'react';

export type ChapterType =
    | 'products'
    | 'cases'
    | 'lounge'
    | 'ai-navigator'
    | 'membership'
    | 'omakase'
    | 'utils'
    | 'my-page'
    | 'diagnosis-report'
    | 'partner'
    | 'archive'
    | 'private-report'
    | 'brand';

interface ChapterWrapperProps {
    chapter: ChapterType;
    children: React.ReactNode;
    className?: string;
}

export default function ChapterWrapper({ chapter, children, className = '' }: ChapterWrapperProps) {
    return (
        <div data-chapter={chapter} className={`min-h-screen ${className}`}>
            {children}
        </div>
    );
}
