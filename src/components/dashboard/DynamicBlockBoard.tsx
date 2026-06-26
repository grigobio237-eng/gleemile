'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableBlockItem } from './SortableBlockItem';
import { TeamBlock } from '@/types/firebase';

interface DynamicBlockBoardProps {
  blocks: TeamBlock[];
  onReorder?: (newOrder: TeamBlock[]) => void;
  renderBlock: (block: TeamBlock) => React.ReactNode;
  editable?: boolean; // 호스트만 드래그 앤 드롭 가능하게 제어
}

export function DynamicBlockBoard({ blocks, onReorder, renderBlock, editable = false }: DynamicBlockBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 이상 드래그해야 시작 (클릭과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((item) => item.blockId === active.id);
      const newIndex = blocks.findIndex((item) => item.blockId === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      
      // order 재할당
      const reordered = newBlocks.map((block, index) => ({
        ...block,
        order: index
      }));

      if (onReorder) {
        onReorder(reordered);
      }
    }
  };

  const activeBlocks = blocks.filter(b => b.isActive).sort((a, b) => a.order - b.order);

  if (!editable) {
    // 뷰 전용 (팀원)
    return (
      <div className="space-y-4">
        {activeBlocks.map(block => (
          <div key={block.blockId}>
            {renderBlock(block)}
          </div>
        ))}
      </div>
    );
  }

  // 편집 가능 모드 (호스트)
  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={activeBlocks.map(b => b.blockId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {activeBlocks.map(block => (
            <SortableBlockItem key={block.blockId} id={block.blockId} isActive={block.isActive}>
              {renderBlock(block)}
            </SortableBlockItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
