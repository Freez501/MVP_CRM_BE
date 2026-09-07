import { describe, it, expect } from "vitest"
import { capitalize, cleanPfKey } from "../formatting"

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("водка")).toBe("Водка")
  })
  it("handles (ПФ) prefix", () => {
    expect(capitalize("пф: сауэр микс")).toBe("(ПФ) Сауэр микс")
  })
  it("returns empty for empty string", () => {
    expect(capitalize("")).toBe("")
  })
})

describe("cleanPfKey", () => {
  it("removes ПФ prefix", () => {
    expect(cleanPfKey("пф: сауэр микс")).toBe("сауэр микс")
  })
  it("lowercases", () => {
    expect(cleanPfKey("Водка")).toBe("водка")
  })
})
