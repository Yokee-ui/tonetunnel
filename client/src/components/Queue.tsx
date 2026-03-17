import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { usePlayerStore, Track } from '../store/playerStore';
import { useSocket } from '../hooks/useSocket';

export default function Queue({ isOpen }: { isOpen: boolean }) {
  const queue = usePlayerStore(s => s.queue);
  const queueIndex = usePlayerStore(s => s.queueIndex);
  const setQueue = usePlayerStore(s => s.setQueue);
  // useSocket() here returns the SAME singleton — no new connection
  const socket = useSocket();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = queue.findIndex(t => t.videoId === active.id);
    const newIndex = queue.findIndex(t => t.videoId === over.id);
    const newQueue = arrayMove(queue, oldIndex, newIndex);

    let newQueueIndex = queueIndex;
    if (oldIndex === queueIndex) newQueueIndex = newIndex;
    else if (oldIndex < queueIndex && newIndex >= queueIndex) newQueueIndex--;
    else if (oldIndex > queueIndex && newIndex <= queueIndex) newQueueIndex++;

    setQueue(newQueue, newQueueIndex);
    socket?.emit('queue_set', { tracks: newQueue, index: newQueueIndex });
  };

  if (!isOpen) return null;

  return (
    <div className="w-[320px] bg-s1/90 backdrop-blur-2xl border-l border-border flex flex-col h-full overflow-hidden absolute right-0 top-0 bottom-[88px] z-40">
      <div className="p-5 border-b border-border/50">
        <h2 className="text-lg font-serif font-medium">Up Next</h2>
      </div>
      <div className="flex-1 overflow-y-auto w-full p-2 custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={queue.map(t => t.videoId)} strategy={verticalListSortingStrategy}>
            {queue.map((track, i) => (
              <SortableItem key={track.videoId} track={track} isActive={i === queueIndex} />
            ))}
          </SortableContext>
        </DndContext>
        {queue.length === 0 && (
          <p className="text-t3 text-sm text-center mt-8 italic">Queue is empty</p>
        )}
      </div>
    </div>
  );
}

function SortableItem({ track, isActive }: { track: Track; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: track.videoId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-s2'}`}
    >
      <button className="text-t3 cursor-grab hover:text-t1 active:cursor-grabbing p-1" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded object-cover bg-black" />
      <div className="flex flex-col overflow-hidden text-sm">
        <span className={`truncate ${isActive ? 'text-acc' : 'text-t1'}`}>{track.title}</span>
        <span className="truncate text-t2 text-xs">{track.artist}</span>
      </div>
    </div>
  );
}