import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { useKanbanStore } from "@/store/kanbanStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kaam Kanban — Desi Brutalist To-Do" },
      { name: "description", content: "A loud, tactile drag-and-drop Kanban board in Desi Brutalist style." },
      { property: "og:title", content: "Kaam Kanban — Desi Brutalist To-Do" },
      { property: "og:description", content: "Marigold, gulabi & peacock kanban with brutal black borders." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bungee&family=Space+Grotesk:wght@500;700&display=swap" },
    ],
  }),
  component: Index,
});

function Index() {
  const reset = useKanbanStore((s) => s.reset);
  return (
    <main className="desi-root min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="desi-display text-sm tracking-[0.3em] text-[#E0115F] mb-2">// KAAM KANBAN //</p>
            <h1 className="desi-display text-5xl md:text-7xl font-black leading-[0.9]">
              AAJ KA <span className="bg-[#FF9933] desi-border px-2 inline-block">KAAM</span>
              <br />
              KAL KA <span className="bg-[#00A86B] desi-border px-2 inline-block text-white">JASHN</span>
            </h1>
            <p className="mt-3 max-w-xl font-bold">
              Drag karo. Drop karo. Ho gaya. A brutally honest to-do board — keyboard friendly, screen-reader friendly, chai friendly.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="desi-border desi-shadow-sm desi-press bg-[#E6B800] px-4 py-2 font-black uppercase self-start"
          >
            Reset Board
          </button>
        </header>

        <div className="h-2 desi-block-print mb-6" aria-hidden="true" />

        <KanbanBoard />

        <footer className="mt-10 text-center text-xs font-bold uppercase tracking-widest text-black/60">
          Built with thick borders & thicker chai.
        </footer>
      </div>
    </main>
  );
}
