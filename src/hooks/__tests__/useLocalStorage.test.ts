import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useLocalStorage } from "../useLocalStorage"

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns initial value when storage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"))
    expect(result.current[0]).toBe("default")
  })

  it("updates stored value", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "initial"))

    act(() => {
      result.current[1]("updated")
    })

    expect(result.current[0]).toBe("updated")
    expect(JSON.parse(window.localStorage.getItem("test-key") || "")).toBe("updated")
  })

  it("supports updater function", () => {
    const { result } = renderHook(() => useLocalStorage<number>("test-counter", 5))

    act(() => {
      result.current[1]((prev) => prev + 10)
    })

    expect(result.current[0]).toBe(15)
    expect(JSON.parse(window.localStorage.getItem("test-counter") || "")).toBe(15)
  })
})
