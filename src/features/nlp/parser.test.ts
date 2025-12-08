import { describe, expect, it } from "vitest";

import { parseTaskInput } from "@/features/nlp/parser";

const referenceDate = new Date("2025-01-06T08:00:00.000Z"); // Monday

describe("parseTaskInput", () => {
  it("parses today keyword", () => {
    const result = parseTaskInput("Finish spec today", referenceDate);
    expect(result.dueDate).toBe("2025-01-06");
    expect(result.title).toBe("Finish spec");
  });

  it("parses tomorrow with time", () => {
    const result = parseTaskInput("Standup tomorrow at 3pm", referenceDate);
    expect(result.dueDate).toBe("2025-01-07");
    expect(result.dueTime).toBe("15:00");
    expect(result.title).toBe("Standup");
  });

  it("parses next weekday", () => {
    const result = parseTaskInput("Sync with design next thursday", referenceDate);
    expect(result.dueDate).toBe("2025-01-09");
    expect(result.title).toBe("Sync with design");
  });

  it("parses explicit date", () => {
    const result = parseTaskInput("Review budget 14/03/2025", referenceDate);
    expect(result.dueDate).toBe("2025-03-14");
    expect(result.title).toBe("Review budget");
  });

  it("falls back when no match", () => {
    const result = parseTaskInput("Plan roadmap", referenceDate);
    expect(result.dueDate).toBeNull();
    expect(result.title).toBe("Plan roadmap");
  });
});
