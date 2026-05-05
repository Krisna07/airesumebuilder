import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ResumeData, ResumeStyle, SectionOrder } from '@/types/types';
import { GripVertical, AlignLeft, AlignRight, Columns } from 'lucide-react';
import { DEFAULT_RESUME_STYLE } from '@/lib/defaultStyle';

interface SortableItemProps {
  section: SectionOrder;
  isTwoColumnTemplate: boolean;
  onAlignChange?: (key: string, side: 'left' | 'right' | 'full') => void;
}

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  custom: 'Custom Sections',
};

function SortableItem({ section, isTwoColumnTemplate, onAlignChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  const label = SECTION_LABELS[section.key] || section.key;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 mb-2 bg-transparent border rounded-md ${
        isDragging ? 'border-teal-500 ring-1 ring-teal-500/50' : 'border-slate-300 dark:border-slate-600'
      }`}
    >
      <div className="flex items-center flex-1">
        <button
          className="p-1 mr-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:cursor-grabbing cursor-grab"
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
        >
          <GripVertical size={16} />
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      </div>

      {onAlignChange && (
        <div className="flex bg-slate-100/70 dark:bg-slate-700/60 rounded p-0.5">
          <button
            onClick={() => onAlignChange(section.key, 'left')}
            className={`p-1 rounded ${section.side === 'left' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'}`}
            title="Left Column"
            aria-label={`Align ${label} left column${isTwoColumnTemplate ? '' : ' (applies in 2-column templates)'}`}
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => onAlignChange(section.key, 'full')}
            className={`p-1 rounded ${section.side === 'full' || !section.side ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'}`}
            title="Full Width"
            aria-label={`Align ${label} full width`}
          >
            <Columns size={14} />
          </button>
          <button
            onClick={() => onAlignChange(section.key, 'right')}
            className={`p-1 rounded ${section.side === 'right' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'}`}
            title="Right Column"
            aria-label={`Align ${label} right column${isTwoColumnTemplate ? '' : ' (applies in 2-column templates)'}`}
          >
            <AlignRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

interface SectionOrderPanelProps {
  resumeData: ResumeData;
  templateId: string;
  handleStyleChange: (updates: Partial<ResumeStyle>) => void;
}

const ALIGNMENT_TEMPLATES = new Set(['template01', 'template02', 'atlas']);

export default function SectionOrderPanel({ resumeData, templateId, handleStyleChange }: SectionOrderPanelProps) {
  const style = resumeData.styleConfig ?? DEFAULT_RESUME_STYLE;
  const isTwoColumnTemplate = ALIGNMENT_TEMPLATES.has(templateId);
  const computedItems = useMemo(() => {
    const fallbackItems: SectionOrder[] = [
      { key: 'summary', side: 'full', enabled: true, label: 'Summary' },
      { key: 'experience', side: 'full', enabled: true, label: 'Experience' },
      { key: 'education', side: 'full', enabled: true, label: 'Education' },
      { key: 'skills', side: 'full', enabled: true, label: 'Skills' },
      ...(resumeData.customSections?.length ? [{ key: 'custom', side: 'full' as const, enabled: true, label: 'Custom Sections' }] : []),
    ];

    const seedItems = style.sectionOrder?.length ? style.sectionOrder : fallbackItems;
    const mergedByKey = new Map<string, SectionOrder>();
    seedItems.forEach((item) => {
      mergedByKey.set(item.key, {
        key: item.key,
        side: item.side ?? 'full',
        enabled: item.enabled ?? true,
        label: item.label,
      });
    });
    fallbackItems.forEach((item) => {
      if (!mergedByKey.has(item.key)) {
        mergedByKey.set(item.key, item);
      }
    });

    return Array.from(mergedByKey.values());
  }, [resumeData.customSections, style.sectionOrder]);

  const [items, setItems] = useState<SectionOrder[]>(computedItems);
  const syncRafRef = useRef<number | null>(null);
  const pendingSyncRef = useRef<SectionOrder[] | null>(null);

  useEffect(() => {
    setItems(computedItems);
  }, [computedItems]);

  useEffect(() => {
    return () => {
      if (syncRafRef.current !== null) {
        cancelAnimationFrame(syncRafRef.current);
      }
    };
  }, []);

  const syncStyleOrder = (nextOrder: SectionOrder[]) => {
    pendingSyncRef.current = nextOrder;
    if (syncRafRef.current !== null) return;

    syncRafRef.current = requestAnimationFrame(() => {
      syncRafRef.current = null;
      if (!pendingSyncRef.current) return;
      handleStyleChange({ sectionOrder: pendingSyncRef.current });
      pendingSyncRef.current = null;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            delay: 150,
            tolerance: 5,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i: SectionOrder) => i.key === active.id);
      const newIndex = items.findIndex((i: SectionOrder) => i.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      
      const newOrder = arrayMove(items as SectionOrder[], oldIndex, newIndex);
      setItems(newOrder);
      syncStyleOrder(newOrder);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i: SectionOrder) => i.key === active.id);
    const newIndex = items.findIndex((i: SectionOrder) => i.key === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const newOrder = arrayMove(items as SectionOrder[], oldIndex, newIndex);
    setItems(newOrder);
    // Keep preview in sync while dragging.
    syncStyleOrder(newOrder);
  };

  const handleAlignChange = (key: string, side: 'left' | 'right' | 'full') => {
    const newOrder = items.map((item: SectionOrder) =>
      item.key === key ? { ...item, side } : item
    );
    setItems(newOrder);
    handleStyleChange({ sectionOrder: newOrder });
  };

  const handleEnabledChange = (key: string, enabled: boolean) => {
    const newOrder = items.map((item: SectionOrder) =>
      item.key === key ? { ...item, enabled } : item
    );
    setItems(newOrder);
    handleStyleChange({ sectionOrder: newOrder });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500 dark:text-slate-300 mb-2">
        Drag to reorder sections. Use the alignment buttons to choose left, full, or right placement.
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
        {isTwoColumnTemplate
          ? 'Alignment is active in this template.'
          : 'Alignment settings are saved here and become visible in Sidebar/Canvas templates.'}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i: SectionOrder) => i.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((section: SectionOrder) => (
              <div key={section.key}>
                <SortableItem
                  section={section}
                  isTwoColumnTemplate={isTwoColumnTemplate}
                  onAlignChange={handleAlignChange}
                />
                <div className="-mt-1 mb-2 px-3 py-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={section.enabled !== false}
                      onChange={(e) => handleEnabledChange(section.key, e.target.checked)}
                    />
                    Show section
                  </label>
                  <span>{section.side ?? 'full'}</span>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
