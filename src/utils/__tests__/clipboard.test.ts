import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { copyToClipboard, downloadTextFile } from "../clipboard"

describe("clipboard utils", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe("copyToClipboard", () => {
    it("writes text to navigator.clipboard and sets copied state with timeout", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      const setCopied = vi.fn()
      copyToClipboard("Test message", setCopied, 1500)

      expect(writeTextMock).toHaveBeenCalledWith("Test message")
      expect(setCopied).toHaveBeenCalledWith(true)

      vi.advanceTimersByTime(1500)
      expect(setCopied).toHaveBeenCalledWith(false)
    })
  })

  describe("downloadTextFile", () => {
    it("creates an anchor element, triggers click, and removes it", () => {
      const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url")
      const revokeObjectURLMock = vi.fn()
      global.URL.createObjectURL = createObjectURLMock
      global.URL.revokeObjectURL = revokeObjectURLMock

      const clickMock = vi.fn()
      const appendChildSpy = vi.spyOn(document.body, "appendChild")
      const removeChildSpy = vi.spyOn(document.body, "removeChild")

      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName)
        if (tagName === "a") {
          el.click = clickMock
        }
        return el
      })

      downloadTextFile("Sample file content", "sample.txt")

      expect(createObjectURLMock).toHaveBeenCalled()
      expect(clickMock).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url")
    })
  })
})
