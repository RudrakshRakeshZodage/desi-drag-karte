import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { COLUMNS, useKanbanStore, type ColumnId, type Task } from "@/store/kanbanStore";
import { Column } from "./Column";

/**
 * EFFICIENCY: Single DndContext at the board level. Per-column task arrays
 * are derived with useMemo, so adding/removing a card in one column doesn't
 * force the others to recompute their lists.
 *
 * ACCESSIBILITY: KeyboardSensor + sortableKeyboardCoordinates gives full
 * keyboard DnD — Space picks up, arrow keys move, Space drops, Esc cancels.
 * An aria-live region announces each move out loud.
 */
export function KanbanBoard() {
  const tasks = useKanbanStore((s) => s.tasks);
  const moveTask = useKanbanStore((s) => s.moveTask);
  const addTask = useKanbanStore((s) => s.addTask);
  const removeTask = useKanbanStore((s) => s.removeTask);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [liveMsg, setLiveMsg] = useState("");

  const pointerSensorOptions = useMemo(() => ({ activationConstraint: { distance: 5 } }), []);
  const keyboardSensorOptions = useMemo(
    () => ({ coordinateGetter: sortableKeyboardCoordinates }),
    [],
  );

  const pointerSensor = useSensor(PointerSensor, pointerSensorOptions);
  const keyboardSensor = useSensor(KeyboardSensor, keyboardSensorOptions);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const tasksByColumn = useMemo(() => {
    const out: Record<ColumnId, Task[]> = { todo: [], progress: [], done: [] };
    for (const t of tasks) out[t.columnId].push(t);
    return out;
  }, [tasks]);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const task = e.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = e;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;

      // EFFICIENCY: Read tasks directly from the Zustand store instead of reactive component state
      // dependency. This keeps the drag-end callback referentially stable across all card updates.
      const currentTasks = useKanbanStore.getState().tasks;
      const fromTask = currentTasks.find((t) => t.id === activeId);
      if (!fromTask) return;

      // Drop target is either a column container or another task.
      const overData = over.data.current as
        | { type?: string; columnId?: ColumnId; task?: Task }
        | undefined;
      let targetColumn: ColumnId;
      let targetIndex: number | undefined;

      if (overData?.type === "column" && overData.columnId) {
        targetColumn = overData.columnId;
        targetIndex = undefined;
      } else if (overData?.type === "task" && overData.task) {
        targetColumn = overData.task.columnId;
        const colTasks = currentTasks.filter(
          (t) => t.columnId === targetColumn && t.id !== activeId,
        );
        targetIndex = colTasks.findIndex((t) => t.id === overData.task!.id);
      } else {
        return;
      }

      moveTask(activeId, targetColumn, targetIndex);
      const colMeta = COLUMNS.find((c) => c.id === targetColumn);
      setLiveMsg(`Task moved to ${colMeta?.title ?? targetColumn}`);
    },
    [moveTask],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up task ${String(active.id)}`,
          onDragOver: ({ over }) =>
            over ? `Hovering over ${String(over.id)}` : `Not over a droppable area`,
          onDragEnd: ({ over }) => (over ? `Dropped on ${String(over.id)}` : `Drop cancelled`),
          onDragCancel: () => `Drag cancelled`,
        },
      }}
    >
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={tasksByColumn[col.id]}
            onAdd={addTask}
            onRemove={removeTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="desi-border bg-[#FF9933] p-3 desi-card-dragging font-bold">
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>

      {/* A11y: polite live region announces drop result */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveMsg}
      </div>
    </DndContext>
  );
}
