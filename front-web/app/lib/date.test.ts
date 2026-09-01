import { describe, expect, it } from "vitest"

import { formatTimeJst, jstDateLabel } from "./date"

describe("date helpers", () => {
  it("formats a time in the Japanese timezone", () => {
    expect(formatTimeJst("2026-01-02T15:04:00.000Z")).toBe("00:04")
  })

  it("formats a date label in Japanese", () => {
    expect(jstDateLabel("2026-01-02T15:04:00.000Z")).toBe("1/3(土)")
  })
})
