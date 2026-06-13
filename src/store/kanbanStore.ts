import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { sanitizeText } from "@/lib/sanitize";

export type ColumnId = "todo" | "progress" | "done";

export interface Task {
  id: string;
  title: string;
  columnId: ColumnId;
}

export interface Column {
  id: ColumnId;
  title: string;
  subtitle: string;
  accent: "marigold" | "haldi" | "peacock";
}

export const COLUMNS: Column[] = [
  { id: "todo", title: "Aaj Ka Kaam", subtitle: "To Do", accent: "marigold" },
  { id: "progress", title: "Chal Raha Hai", subtitle: "In Progress", accent: "haldi" },
  { id: "done", title: "Ho Gaya", subtitle: "Done", accent: "peacock" },
];

interface KanbanState {
  tasks: Task[];
  addTask: (title: string, columnId: ColumnId) => void;
  removeTask: (id: string) => void;
  /** Move task to a column at an optional index. Pure index-shift logic — covered by unit tests. */
  moveTask: (id: string, toColumn: ColumnId, toIndex?: number) => void;
  reorderWithinColumn: (columnId: ColumnId, fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

const seed: Task[] = [
  { id: "t1", title: "Buy genda phool for Diwali", columnId: "todo" },
  { id: "t2", title: "Call Dadi at 6pm", columnId: "todo" },
  { id: "t3", title: "Ship hackathon MVP", columnId: "progress" },
  { id: "t4", title: "Drink chai", columnId: "done" },
];

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      tasks: seed,
      addTask: (title, columnId) => {
        const clean = sanitizeText(title);
        if (!clean) return;
        set((s) => ({
          tasks: [...s.tasks, { id: crypto.randomUUID(), title: clean, columnId }],
        }));
      },
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, toColumn, toIndex) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          const without = s.tasks.filter((t) => t.id !== id);
          const moved: Task = { ...task, columnId: toColumn };
          // Compute insertion point relative to target column slice.
          const targetIds = without
            .map((t, i) => (t.columnId === toColumn ? i : -1))
            .filter((i) => i !== -1);
          const insertAt =
            toIndex == null || toIndex >= targetIds.length
              ? (targetIds[targetIds.length - 1] ?? without.length - 1) + 1
              : targetIds[toIndex];
          const next = [...without];
          next.splice(insertAt, 0, moved);
          return { tasks: next };
        }),
      reorderWithinColumn: (columnId, fromIndex, toIndex) =>
        set((s) => {
          const colTasks = s.tasks.filter((t) => t.columnId === columnId);
          if (fromIndex === toIndex) return s;
          const moved = colTasks[fromIndex];
          if (!moved) return s;
          const reordered = [...colTasks];
          reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, moved);
          // Stitch back together preserving other columns' order.
          const others = s.tasks.filter((t) => t.columnId !== columnId);
          // Reinsert in original column positions.
          const next: Task[] = [];
          let ci = 0;
          for (const t of s.tasks) {
            if (t.columnId === columnId) {
              next.push(reordered[ci++]);
            } else {
              next.push(t);
            }
          }
          void others;
          return { tasks: next };
        }),
      reset: () => set({ tasks: seed }),
    }),
    {
      name: "desi-kanban-v1",
      storage: createJSONStorage(() => {
        // SSR-safe storage that no-ops on the server.
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      // Sanitize on rehydrate to defend against tampered localStorage payloads.
      merge: (persisted, current) => {
        const p = persisted as Partial<KanbanState> | undefined;
        if (!p || !Array.isArray(p.tasks)) return current;
        const validCols: ColumnId[] = ["todo", "progress", "done"];
        const tasks = p.tasks
          .filter((t): t is Task => !!t && typeof t === "object")
          .map((t) => ({
            id: typeof t.id === "string" ? t.id : crypto.randomUUID(),
            title: sanitizeText(t.title),
            columnId: validCols.includes(t.columnId) ? t.columnId : "todo",
          }))
          .filter((t) => t.title.length > 0);
        return { ...current, tasks };
      },
    },
  ),
);

/** Pure helper exported for unit tests — mirrors moveTask logic. */
export function computeMove(
  tasks: Task[],
  id: string,
  toColumn: ColumnId,
  toIndex?: number,
): Task[] {
  const task = tasks.find((t) => t.id === id);
  if (!task) return tasks;
  const without = tasks.filter((t) => t.id !== id);
  const moved: Task = { ...task, columnId: toColumn };
  const targetIds = without
    .map((t, i) => (t.columnId === toColumn ? i : -1))
    .filter((i) => i !== -1);
  const insertAt =
    toIndex == null || toIndex >= targetIds.length
      ? (targetIds[targetIds.length - 1] ?? without.length - 1) + 1
      : targetIds[toIndex];
  const next = [...without];
  next.splice(insertAt, 0, moved);
  return next;
}
