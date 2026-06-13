/**
 * Unit tests for pure state transitions. Run with: bunx vitest run
 * Proves that moving a card across columns shifts state indexes as intended.
 */
import { describe, it, expect } from "vitest";
import { computeMove, type Task } from "./kanbanStore";
import { sanitizeText, safeParse } from "@/lib/sanitize";

const base: Task[] = [
  { id: "a", title: "A", columnId: "todo" },
  { id: "b", title: "B", columnId: "todo" },
  { id: "c", title: "C", columnId: "progress" },
  { id: "d", title: "D", columnId: "done" },
];

describe("computeMove", () => {
  it("moves a task across columns and appends to end when no index given", () => {
    const next = computeMove(base, "a", "done");
    expect(next.map((t) => t.id)).toEqual(["b", "c", "d", "a"]);
    expect(next.find((t) => t.id === "a")?.columnId).toBe("done");
  });

  it("inserts at a specific index within target column", () => {
    const next = computeMove(base, "a", "progress", 0);
    // 'a' should land before 'c' in the progress column slice
    const progressIds = next.filter((t) => t.columnId === "progress").map((t) => t.id);
    expect(progressIds).toEqual(["a", "c"]);
  });

  it("is a no-op for unknown id", () => {
    expect(computeMove(base, "zzz", "done")).toEqual(base);
  });

  it("preserves total task count", () => {
    const next = computeMove(base, "b", "done", 0);
    expect(next.length).toBe(base.length);
  });
});

describe("sanitizeText (XSS defense)", () => {
  it("strips angle brackets and script payloads", () => {
    expect(sanitizeText("<script>alert(1)</script>hi")).toBe("scriptalert(1)/scripthi");
  });
  it("removes javascript: URIs", () => {
    expect(sanitizeText("javascript:evil")).toBe("evil");
  });
  it("trims and caps length", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
    expect(sanitizeText("a".repeat(500)).length).toBe(200);
  });
  it("rejects non-strings", () => {
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(42 as unknown)).toBe("");
  });
});

describe("safeParse (corrupted localStorage)", () => {
  it("returns fallback on malformed JSON", () => {
    expect(safeParse("{not json", { ok: true })).toEqual({ ok: true });
  });
  it("parses valid JSON", () => {
    expect(safeParse('{"x":1}', {})).toEqual({ x: 1 });
  });
});
