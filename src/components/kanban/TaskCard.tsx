import { memo, useCallback, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useKanbanStore, type Task } from "@/store/kanbanStore";

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
  const [isEditing, setIsEditing] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);

  const editTask = useKanbanStore((s) => s.editTask);

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

  const startEdit = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setTitleVal(task.title);
    },
    [task.title],
  );

  const saveEdit = useCallback(() => {
    const clean = titleVal.trim();
    if (clean && clean !== task.title) {
      editTask(task.id, clean);
    }
    setIsEditing(false);
  }, [editTask, task.id, task.title, titleVal]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setTitleVal(task.title);
  }, [task.title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit],
  );

  const dragProps = isEditing ? {} : { ...attributes, ...listeners };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`desi-border desi-shadow-sm desi-press ${accentClass} p-3 flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-black`}
      {...dragProps}
      // A11y: screen readers announce role + draggable state; @dnd-kit also
      // wires keyboard sensor (Space to pick up, arrows to move, Enter to drop).
      aria-roledescription="Draggable task. Press space to pick up, arrow keys to move between columns, space again to drop."
    >
      {isEditing ? (
        <div
          className="flex flex-col gap-2 w-full"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            autoFocus
            maxLength={200}
            className="desi-border bg-white px-2 py-1 font-bold text-black focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E0115F] w-full"
            aria-label="Edit task title"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={saveEdit}
              className="desi-border desi-shadow-sm desi-press bg-[#00A86B] text-white px-2 py-0.5 text-xs font-black uppercase cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="desi-border desi-shadow-sm desi-press bg-[#E0115F] text-white px-2 py-0.5 text-xs font-black uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <span
            onDoubleClick={startEdit}
            className="font-bold text-black break-words pr-2 flex-1 cursor-text select-text"
            title="Double-click to edit"
          >
            {task.title}
          </span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={startEdit}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Edit task: ${task.title}`}
              className="size-7 grid place-items-center bg-black text-[#F5F5DC] font-black text-sm hover:bg-[#FF9933] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF9933] cursor-pointer"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={handleRemove}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Delete task: ${task.title}`}
              className="size-7 grid place-items-center bg-black text-[#F5F5DC] font-black text-sm hover:bg-[#E0115F] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E0115F] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </li>
  );
}

export const TaskCard = memo(TaskCardImpl);
