import { memo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/store/kanbanStore";

interface Props {
  task: Task;
  onRemove: (id: string) => void;
  accentClass: string; // bg color class for the card body
}

/**
 * EFFICIENCY: Wrapped in React.memo so the entire board doesn't re-render
 * when a sibling card is dragged. Callbacks from the parent are stable via
 * useCallback so memo's referential equality check actually pays off.
 */
function TaskCardImpl({ task, onRemove, accentClass }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleRemove = useCallback(() => onRemove(task.id), [onRemove, task.id]);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`desi-border desi-shadow-sm desi-press ${accentClass} p-3 flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black`}
      {...attributes}
      {...listeners}
      // A11y: screen readers announce role + draggable state; @dnd-kit also
      // wires keyboard sensor (Space to pick up, arrows to move, Enter to drop).
      aria-roledescription="Draggable task. Press space to pick up, arrow keys to move between columns, space again to drop."
    >
      <span className="font-bold text-black break-words pr-2">{task.title}</span>
      <button
        type="button"
        onClick={handleRemove}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Delete task: ${task.title}`}
        className="shrink-0 size-7 grid place-items-center bg-black text-[#F5F5DC] font-black text-sm hover:bg-[#E0115F] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E0115F]"
      >
        ✕
      </button>
    </li>
  );
}

export const TaskCard = memo(TaskCardImpl);
