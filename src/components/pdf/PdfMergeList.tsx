'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { PdfMergeCard } from './PdfMergeCard'
import type { PdfFile } from '@/lib/pdf'

interface PdfMergeListProps {
  pdfs: PdfFile[]
  onReorder: (oldIndex: number, newIndex: number) => void
  onRemove: (id: string) => void
}

export function PdfMergeList({ pdfs, onReorder, onRemove }: PdfMergeListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = pdfs.findIndex((pdf) => pdf.id === active.id)
      const newIndex = pdfs.findIndex((pdf) => pdf.id === over.id)
      onReorder(oldIndex, newIndex)
    }
  }

  if (pdfs.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pdfs.map((pdf) => pdf.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {pdfs.map((pdf, index) => (
            <PdfMergeCard
              key={pdf.id}
              pdf={pdf}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
