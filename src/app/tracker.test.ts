import { describe, expect, it } from "vitest";
import { status, type Check } from "./tracker";

const c = (date: string, score: number, tv: number | null = null): Check => ({ id: date, date, score, answers: {}, tv, who: "self" });

describe("status", () => {
  it("is 'first' with no data", () => expect(status([]).k).toBe("first"));
  it("is 'first' after only one check", () => expect(status([c("2026-01-01", 2)]).k).toBe("first"));
  it("flags a high current score immediately", () => expect(status([c("2026-01-01", 1), c("2026-02-01", 7)]).k).toBe("high"));
  it("stays stable when the score barely moves", () => expect(status([c("2026-01-01", 2), c("2026-02-01", 3)]).k).toBe("stable"));
  it("flags a rise of 3 or more over baseline", () => expect(status([c("2026-01-01", 1), c("2026-02-01", 1), c("2026-03-01", 5)]).k).toBe("change"));
  it("flags a TV-volume rise of 3 or more", () => expect(status([c("2026-01-01", 1, 10), c("2026-02-01", 2, 14)]).k).toBe("change"));
  it("uses only the first three checks as the baseline", () => {
    const log = [c("2026-01-01", 1), c("2026-02-01", 1), c("2026-03-01", 1), c("2026-04-01", 4)];
    expect(status(log).k).toBe("change");
  });
});
