'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const categories = [
  { name: '전체 (All)', value: '' },
  { name: '회복 키트', value: 'recovery-kit' },
  { name: '수면/안정', value: 'sleep-relax' },
  { name: '활력/에너지', value: 'energy' },
  { name: '영양/보충', value: 'nutrition' },
  { name: '측정/리듬체크', value: 'diagnostic' },
];

export const sortOptions = [
  { name: '최신순', value: 'newest' },
  { name: '가격 낮은순', value: 'price_asc' },
  { name: '가격 높은순', value: 'price_desc' },
  { name: '인기순', value: 'popular' },
];

interface ProductFiltersProps {
  searchParams?: {
    q?: string;
    category?: string;
    sort?: string;
    isFunding?: string;
  };
}

export default function ProductFilters({ searchParams }: ProductFiltersProps) {
  const pathname = usePathname();
  const [showCategories, setShowCategories] = useState(true);
  const [showSort, setShowSort] = useState(true);

  const createFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (searchParams?.q) params.set('q', searchParams.q);
    if (searchParams?.category) params.set('category', searchParams.category);
    if (searchParams?.sort) params.set('sort', searchParams.sort);
    if (searchParams?.isFunding) params.set('isFunding', searchParams.isFunding);

    if (key === 'category' && value === 'funding') {
      params.delete('category');
      params.set('isFunding', 'true');
    } else if (key === 'category') {
      params.set('category', value);
      params.delete('isFunding');
    } else {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Categories */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto font-black text-xs uppercase tracking-widest text-text-primary hover:bg-transparent"
          onClick={() => setShowCategories(!showCategories)}
        >
          카테고리 (Category)
          {showCategories ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        {showCategories && (
          <div className="flex flex-col gap-1.5 pt-2">
            {categories.map((category) => {
              let isActive = false;
              if (category.value === 'funding') {
                isActive = searchParams?.isFunding === 'true';
              } else {
                isActive = (searchParams?.category || '') === category.value && searchParams?.isFunding !== 'true';
              }
              return (
                <Link
                  key={category.value}
                  href={createFilterUrl('category', category.value)}
                  className="block"
                >
                  <div
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${isActive
                      ? 'bg-primary text-background border-primary'
                      : 'bg-transparent text-text-secondary border-transparent hover:border-line hover:text-text-primary'
                      }`}
                  >
                    {category.name}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto font-black text-xs uppercase tracking-widest text-text-primary hover:bg-transparent"
          onClick={() => setShowSort(!showSort)}
        >
          정렬 (Sort)
          {showSort ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        {showSort && (
          <div className="flex flex-col gap-1.5 pt-2">
            {sortOptions.map((option) => {
              const isActive = (searchParams?.sort || 'newest') === option.value;
              return (
                <Link
                  key={option.value}
                  href={createFilterUrl('sort', option.value)}
                  className="block"
                >
                  <div
                    className={`px-4 py-2 text-sm font-medium transition-all ${isActive
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    {option.name}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {(searchParams?.category || searchParams?.sort || searchParams?.isFunding) && (
        <div className="pt-6 border-t border-line">
          <Button variant="outline" size="sm" className="w-full rounded-xl border-line text-text-secondary hover:bg-white/5 font-bold" asChild>
            <Link href={pathname}>필터 초기화</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

