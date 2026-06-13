import { memo, useCallback, useMemo, useState, type FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import type { Column as ColumnType, Task } from "@/store/kanbanStore";
import { sanitizeText } from "@/lib/sanitize";

interface Props {
  column: ColumnType;
  tasks: Task[];
  onAdd: (title: string, columnId: ColumnType["id"]) => void;
  onRemove: (id: string) => void;
}

const ACCENTS: Record<ColumnType["accent"], { header: string; card: string }> = {
  marigold: { header: "bg-[#FF9933]", card: "bg-[#FFD9B3]" },
  haldi:    { header: "bg-[#E6B800]", card: "bg-[#FFF1B3]" },
  peacock:  { header: "bg-[#00A86B]", card: "bg-[#B3E5D1]" },
};

function ColumnImpl({ column, tasks, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState("");
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column", columnId: column.id } });
  const accent = ACCENTS[column.accent];

  // EFFICIENCY: ids array memoized so SortableContext doesn't recreate each render.
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const submit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const clean = sanitizeText(draft);
      if (!clean) return;
      onAdd(clean, column.id);
      setDraft("");
    },
    [draft, onAdd, column.id],
  );

  return (
    <section
      aria-label={`${column.title} column, ${tasks.length} tasks`}
      className="desi-border desi-shadow bg-[#F5F5DC] flex flex-col min-w-[280px] w-full"
    >
      <header className={`${accent.header} border-b-[5px] border-black p-3`}>
        <h2 className="desi-display text-2xl md:text-3xl font-black text-black leading-none">
          {column.title}
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest mt-1 text-black/70">
          {column.subtitle} · {tasks.length}
        </p>
      </header>

      <div
        ref={setNodeRef}
        className={`p-3 flex-1 min-h-[200px] transition-colors ${isOver ? "bg-[#E0115F]/20" : ""}`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-3" aria-live="off">
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} onRemove={onRemove} accentClass={accent.card} />
            ))}
          </ul>
        </SortableContext>
      </div>

      <form onSubmit={submit} className="border-t-[5px] border-black p-3 flex gap-2 bg-black/5">
        <label className="sr-only" htmlFor={`add-${column.id}`}>
          Add task to {column.title}
        </label>
        <input
          id={`add-${column.id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder="Naya kaam..."
          className="flex-1 desi-border bg-white px-2 py-1 font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E0115F]"
        />
        <button
          type="submit"
          className="desi-border desi-shadow-sm desi-press bg-[#E0115F] text-white px-3 py-1 font-black uppercase"
        >
          Add
        </button>
      </form>
    </section>
  );
}

export const Column = memo(ColumnImpl);