export const BAR_OPTIONS = [
  { value: "white_with_columns", label: "Белый с колоннами" },
  { value: "white_no_columns", label: "Белый без колонн" },
  { value: "black", label: "Чёрный" },
  { value: "none", label: "Нет" },
] as const

export const SHELF_OPTIONS = [
  { value: "black_white", label: "Чёрный с белыми полками" },
  { value: "gold_black", label: "Золотой с чёрными полками" },
  { value: "none", label: "Нет" },
] as const

export const PYRAMID_OPTIONS = [
  { value: "", label: "Нет" },
  { value: "56", label: "56 бокалов" },
  { value: "84", label: "84 бокала" },
  { value: "120", label: "120 бокалов" },
] as const

const BAR_MAP: Record<string, string> = Object.fromEntries(
  BAR_OPTIONS.map((o) => [o.value, o.label])
)

const SHELF_MAP: Record<string, string> = Object.fromEntries(
  SHELF_OPTIONS.map((o) => [o.value, o.label])
)

const PYRAMID_MAP: Record<string, string> = Object.fromEntries(
  PYRAMID_OPTIONS.map((o) => [o.value, o.label])
)

export function getBarLabel(value?: string): string {
  if (!value || value === "none") return "Нет"
  return BAR_MAP[value] || value
}

export function getShelfLabel(value?: string): string {
  if (!value || value === "none") return "Нет"
  return SHELF_MAP[value] || value
}

export function getPyramidLabel(value?: string): string {
  if (!value || value === "none") return "Нет"
  return PYRAMID_MAP[value] || value
}
