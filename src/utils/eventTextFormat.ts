import { Event } from "@/types"
import { getBarLabel, getShelfLabel, getPyramidLabel } from "@/constants/eventOptions"

const stageLabel: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  confirmed: "Подтверждён",
  done: "Проведён",
  cancelled: "Отменён",
}

export function formatEventTelegramText(event: Event): string {
  const d = event.details || {}
  const parts: string[] = []

  parts.push(`🍸 МЕРОПРИЯТИЕ: ${event.title.toUpperCase()}`)
  parts.push(`📅 Дата: ${event.date || "Не указана"}`)
  if (event.address) parts.push(`📍 Адрес: ${event.address}`)
  const managerContact = d.managerContact
  if (managerContact) parts.push(`📞 Менеджер на площадке: ${managerContact}`)
  if (event.clientName) parts.push(`👤 Заказчик: ${event.clientName}`)
  parts.push(`🏷 Статус: ${stageLabel[event.stage] || event.stage}`)
  if (event.bartendersCount) parts.push(`👥 Бармены: ${event.bartendersCount} чел.`)
  if (event.value) parts.push(`💰 Бюджет: ${event.value.toLocaleString("ru-RU")} ₽`)

  // Тайминг
  const timingItems: string[] = []
  if (d.departure) timingItems.push(`• Выезд со склада: ${d.departure}`)
  if (d.setup) timingItems.push(`• Монтаж: ${d.setup}`)
  if (d.start) timingItems.push(`• Начало: ${d.start}`)
  if (d.end) timingItems.push(`• Финал: ${d.end}`)
  if (timingItems.length > 0) {
    parts.push(`\n⏰ ТАЙМИНГ:\n${timingItems.join("\n")}`)
  }

  // Оборудование и форма
  const equipItems: string[] = []
  if (d.bar && d.bar !== "none") {
    equipItems.push(`• Бар: ${getBarLabel(d.bar)}${d.barComment ? ` (${d.barComment})` : ""}`)
  }
  if (d.shelf && d.shelf !== "none") {
    equipItems.push(`• Стеллаж: ${getShelfLabel(d.shelf)}${d.shelfComment ? ` (${d.shelfComment})` : ""}`)
  }
  if (d.pyramid && d.pyramid !== "none") {
    equipItems.push(`• Пирамида: ${getPyramidLabel(d.pyramid)}${d.pyramidComment ? ` (${d.pyramidComment})` : ""}`)
  }
  if (d.clothing) equipItems.push(`• Форма одежды: ${d.clothing}`)
  if (equipItems.length > 0) {
    parts.push(`\n📦 ОБОРУДОВАНИЕ И ФОРМА:\n${equipItems.join("\n")}`)
  }

  // Украшения
  if (d.decorations && d.decorations.length > 0) {
    let decStr = `✨ УКРАШЕНИЯ: ${d.decorations.join(", ")}`
    if (d.decorationComment) decStr += `\n(${d.decorationComment})`
    parts.push(`\n${decStr}`)
  }

  // Меню и коктейли
  if (d.cocktails && d.cocktails.length > 0) {
    const totalCocktails = d.cocktails.reduce((acc, c) => acc + (c.qty || 0), 0)
    const list = d.cocktails.map((c) => `• ${c.name} — ${c.qty} шт.`).join("\n")
    const menuPrint =
      d.menu === "us"
        ? "Печать меню: С нас"
        : d.menu === "client"
        ? "Печать меню: С заказчика"
        : ""
    parts.push(
      `\n🍹 МЕНЮ КОКТЕЙЛЕЙ (всего ${totalCocktails} шт.):\n${list}${
        menuPrint ? `\n${menuPrint}` : ""
      }`
    )
  }

  // Комментарий
  const commentText = (event.comment || "").trim()
  if (commentText) {
    parts.push(`\n💬 КОММЕНТАРИЙ:\n${commentText}`)
  }

  parts.push(`\n— Brilliant Event CRM`)

  return parts.join("\n")
}
