import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export async function exportElementToPdf(element: HTMLElement, fileName: string) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 850,
    })

    const elementRect = element.getBoundingClientRect()
    const elementWidth = element.offsetWidth || 850
    const elementHeight = element.offsetHeight
    const scale = canvas.width / elementWidth

    // Размеры и поля листа А4 (210мм x 297мм)
    const pdfWidthMm = 210
    const pdfHeightMm = 297
    const topMarginMm = 12 // 1.2 см отступ сверху на каждой странице
    const bottomMarginMm = 12 // 1.2 см отступ снизу
    const printableHeightMm = pdfHeightMm - topMarginMm - bottomMarginMm // 273 мм рабочая область
    const printableHeightPx = elementWidth * (printableHeightMm / pdfWidthMm)

    // Все неделимые блоки с точными координатами через getBoundingClientRect
    const blocks = Array.from(
      element.querySelectorAll<HTMLElement>('[data-pdf-block="true"]')
    )

    const splitPositions: number[] = [0]
    let currentY = 0

    while (currentY + printableHeightPx < elementHeight) {
      let nextSplitY = currentY + printableHeightPx

      // Ищем блок, который пересекает линия разреза
      for (const block of blocks) {
        const blockRect = block.getBoundingClientRect()
        const blockTop = blockRect.top - elementRect.top
        const blockBottom = blockRect.bottom - elementRect.top

        if (blockTop < nextSplitY && blockBottom > nextSplitY) {
          // Если блок режется — переносим разрез аккуратно ПЕРЕД этим блоком
          if (blockTop > currentY + 100) {
            nextSplitY = blockTop - 10
          }
          break
        }
      }

      splitPositions.push(nextSplitY)
      currentY = nextSplitY
    }

    // Создаем PDF документ
    const pdf = new jsPDF("p", "mm", "a4")

    for (let i = 0; i < splitPositions.length; i++) {
      const startY = splitPositions[i]
      const endY = i < splitPositions.length - 1 ? splitPositions[i + 1] : elementHeight
      const sliceHeightPx = endY - startY

      if (sliceHeightPx <= 0) continue

      if (i > 0) {
        pdf.addPage()
      }

      const pageCanvas = document.createElement("canvas")
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeightPx * scale

      const ctx = pageCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

        ctx.drawImage(
          canvas,
          0,
          startY * scale,
          canvas.width,
          sliceHeightPx * scale,
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        )

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.95)
        const sliceHeightMm = (sliceHeightPx * pdfWidthMm) / elementWidth

        // Применяем отступ сверху topMarginMm (12мм) на каждой странице
        pdf.addImage(imgData, "JPEG", 0, topMarginMm, pdfWidthMm, sliceHeightMm)
      }
    }

    pdf.save(fileName)
  } catch (error) {
    console.error("Smart PDF export failed:", error)
    alert("Не удалось сгенерировать PDF. Попробуйте воспользоваться кнопкой «Печать».")
  }
}
