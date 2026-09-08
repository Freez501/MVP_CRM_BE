import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useClients } from "@/context/ClientsContext"
import { useCocktails } from "@/context/CocktailsContext"
import { Event, EventStage, EventDetails } from "@/types"
import { BAR_OPTIONS, SHELF_OPTIONS, PYRAMID_OPTIONS } from "@/constants/eventOptions"
import { X, Plus, Minus, Search, ChevronDown, Check, User, FileDown } from "lucide-react"

const DECORATION_OPTIONS = [
  "Базовые",
  "Клеймо",
  "Лёд с интеграцией",
  "Печать на съедобной бумаге",
  "Трафарет",
  "Азот",
  "Бластер",
  "Кондитерское украшение",
  "Шоко трансфер",
]

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: Omit<Event, "id" | "createdAt" | "updatedAt">, existingId?: string) => void
  event?: Event | null
  initialDate?: string
  onExport?: (event: Event) => void
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-cormorant italic text-xl text-text-primary mt-8 mb-4 border-b border-border pb-2">
    {children}
  </h3>
)

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1.5"
  >
    {children}
  </label>
)

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-bg-card border-2 border-border-sketch rounded px-4 py-2 font-montserrat text-[15px] text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
  />
)

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full bg-bg-card border-2 border-border-sketch rounded px-4 py-2 font-montserrat text-[15px] text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all resize-none"
  />
)

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full bg-bg-card border-2 border-border-sketch rounded px-4 py-2 font-montserrat text-[15px] text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
  />
)

export function EventForm({
  isOpen,
  onClose,
  onSubmit,
  event,
  initialDate,
  onExport,
}: EventFormProps) {
  const { clients } = useClients()
  const { cocktails } = useCocktails()

  const [cocktailSearch, setCocktailSearch] = useState("")

  // Client dropdown search state
  const [isClientOpen, setIsClientOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [clientError, setClientError] = useState(false)
  const clientDropdownRef = useRef<HTMLDivElement>(null)
  const clientInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: "",
    clientId: "",
    date: "",
    address: "",
    managerContact: "",
    stage: "new" as EventStage,
    value: 0,
    departure: "",
    setup: "",
    start: "",
    end: "",
    bartendersCount: 2,
    clothing: "",
    bar: "white_with_columns",
    barComment: "",
    shelf: "black_white",
    shelfComment: "",
    pyramid: "",
    pyramidComment: "",
    decorations: [] as string[],
    decorationComment: "",
    menu: "us" as "us" | "client",
    cocktails: [] as { name: string; qty: number; key?: string }[],
    comment: "",
  })

  useEffect(() => {
    if (event) {
      const details = event.details || {}
      setForm({
        title: event.title || "",
        clientId: event.clientId || "",
        date: event.date || "",
        address: event.address || "",
        managerContact: details.managerContact || "",
        stage: event.stage || "new",
        value: event.value || 0,
        departure: details.departure || "",
        setup: details.setup || "",
        start: details.start || "",
        end: details.end || "",
        bartendersCount: event.bartendersCount || 2,
        clothing: details.clothing || "",
        bar: details.bar || "white_with_columns",
        barComment: details.barComment || "",
        shelf: details.shelf || "black_white",
        shelfComment: details.shelfComment || "",
        pyramid: details.pyramid || "",
        pyramidComment: details.pyramidComment || "",
        decorations: details.decorations || [],
        decorationComment: details.decorationComment || "",
        menu: details.menu || "us",
        cocktails: details.cocktails || [],
        comment: event.comment || "",
      })
    } else {
      setForm({
        title: "",
        clientId: "",
        date: initialDate || "",
        address: "",
        managerContact: "",
        stage: "new",
        value: 0,
        departure: "",
        setup: "",
        start: "",
        end: "",
        bartendersCount: 2,
        clothing: "",
        bar: "white_with_columns",
        barComment: "",
        shelf: "black_white",
        shelfComment: "",
        pyramid: "",
        pyramidComment: "",
        decorations: [],
        decorationComment: "",
        menu: "us",
        cocktails: [],
        comment: "",
      })
    }
    setCocktailSearch("")
    setClientSearch("")
    setIsClientOpen(false)
    setClientError(false)
  }, [event, isOpen, initialDate])

  // Close client dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientOpen(false)
      }
    }
    if (isClientOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      setTimeout(() => clientInputRef.current?.focus(), 50)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isClientOpen])

  const sortedCocktails = useMemo(() => {
    return Object.entries(cocktails)
      .map(([key, c]) => ({ key, name: c.name, category: c.category }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [cocktails])

  const filteredCocktails = useMemo(() => {
    if (!cocktailSearch.trim()) return sortedCocktails
    const q = cocktailSearch.toLowerCase()
    return sortedCocktails.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.category ?? "").toLowerCase().includes(q)
    )
  }, [sortedCocktails, cocktailSearch])

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients
    const q = clientSearch.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    )
  }, [clients, clientSearch])

  const selectedClient = clients.find((c) => c.id === form.clientId)

  if (!isOpen) return null

  const toggleDecoration = (value: string) => {
    setForm((prev) => ({
      ...prev,
      decorations: prev.decorations.includes(value)
        ? prev.decorations.filter((d) => d !== value)
        : [...prev.decorations, value],
    }))
  }

  const updateCocktailQty = (name: string, delta: number, key?: string) => {
    setForm((prev) => {
      const existing = prev.cocktails.find((c) => c.name === name)
      if (!existing) {
        if (delta <= 0) return prev
        return { ...prev, cocktails: [...prev.cocktails, { name, qty: delta, key }] }
      }
      const nextQty = Math.max(0, existing.qty + delta)
      const newCocktails =
        nextQty === 0
          ? prev.cocktails.filter((c) => c.name !== name)
          : prev.cocktails.map((c) =>
              c.name === name ? { ...c, qty: nextQty, key: key || c.key } : c
            )
      return { ...prev, cocktails: newCocktails }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Required fields: title, clientId, date
    if (!form.title.trim()) return

    if (!form.clientId) {
      setClientError(true)
      return
    }

    if (!form.date) return

    const details: EventDetails = {
      departure: form.departure || undefined,
      setup: form.setup || undefined,
      start: form.start || undefined,
      end: form.end || undefined,
      clothing: form.clothing || undefined,
      bar: form.bar || undefined,
      barComment: form.barComment || undefined,
      shelf: form.shelf || undefined,
      shelfComment: form.shelfComment || undefined,
      pyramid: form.pyramid || undefined,
      pyramidComment: form.pyramidComment || undefined,
      decorations: form.decorations.length > 0 ? form.decorations : undefined,
      decorationComment: form.decorationComment || undefined,
      menu: form.menu,
      cocktails: form.cocktails.length > 0 ? form.cocktails : undefined,
      managerContact: form.managerContact.trim() || undefined,
    }

    onSubmit(
      {
        title: form.title.trim(),
        clientId: form.clientId,
        clientName: selectedClient?.name ?? (event?.clientName || ""),
        date: form.date,
        address: form.address.trim(),
        bartendersCount: Number(form.bartendersCount) || 1,
        stage: form.stage,
        value: Number(form.value) || 0,
        comment: form.comment.trim(),
        details,
      },
      event?.id
    )
    onClose()
  }

  const isEdit = !!event

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#141414]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border-2 border-border-sketch rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95 duration-150">
        <div className="sticky top-0 bg-bg-card border-b border-border px-6 py-4 flex items-center justify-between z-20">
          <h2 className="font-cormorant italic text-[28px] text-text-primary">
            {isEdit ? "Редактировать мероприятие" : "Новое мероприятие"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded-full hover:bg-surface-secondary/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-2">
          <SectionTitle>Основное</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Название мероприятия *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Свадьба в Усадьбе / Корпоратив Яндекс"
                required
              />
            </div>

            {/* Интерактивный селектор заказчика с поиском */}
            <div className="relative" ref={clientDropdownRef}>
              <Label htmlFor="client-select">Заказчик *</Label>
              <button
                id="client-select"
                type="button"
                onClick={() => {
                  setIsClientOpen(!isClientOpen)
                  setClientSearch("")
                  setClientError(false)
                }}
                className={`w-full flex items-center justify-between gap-2 bg-bg-card border-2 rounded px-4 py-2 font-montserrat text-sm text-left transition-all ${
                  clientError
                    ? "border-rose-500 focus:border-rose-500"
                    : "border-border-sketch hover:border-brand/70 focus:border-brand"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-4 h-4 text-text-tertiary shrink-0" />
                  {selectedClient ? (
                    <span className="font-medium text-text-primary truncate">
                      {selectedClient.name}
                      {selectedClient.company ? (
                        <span className="text-text-secondary text-xs ml-1.5 font-normal">
                          ({selectedClient.company})
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">Выберите заказчика *</span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform duration-200 ${
                    isClientOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {clientError && (
                <p className="text-[11px] text-rose-400 font-montserrat mt-1">
                  Пожалуйста, выберите заказчика из базы
                </p>
              )}

              {/* Выпадающий список заказчиков */}
              {isClientOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-bg-card border-2 border-border-sketch rounded-lg shadow-2xl z-30 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                    <input
                      ref={clientInputRef}
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Поиск по имени, компании, телефону..."
                      className="w-full bg-bg-app border border-border-sketch rounded pl-8 pr-2 py-1.5 font-montserrat text-xs text-text-primary focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    {filteredClients.length === 0 ? (
                      <p className="text-xs font-montserrat text-text-tertiary py-3 text-center">
                        Заказчик не найден
                      </p>
                    ) : (
                      filteredClients.map((c) => {
                        const isSelected = c.id === form.clientId
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, clientId: c.id })
                              setIsClientOpen(false)
                              setClientSearch("")
                              setClientError(false)
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded text-left font-montserrat text-xs transition-colors ${
                              isSelected
                                ? "bg-accent-primary text-text-primary font-semibold"
                                : "hover:bg-surface-secondary/40 text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-medium text-text-primary truncate">{c.name}</div>
                              {(c.company || c.phone) && (
                                <div className="text-[11px] text-text-tertiary truncate">
                                  {c.company} {c.company && c.phone ? "·" : ""} {c.phone}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-text-primary shrink-0 ml-2" />
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="stage">Статус (этап воронки)</Label>
              <Select
                id="stage"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as EventStage })}
              >
                <option value="new">Новое</option>
                <option value="in_progress">В работе</option>
                <option value="confirmed">Подтверждён</option>
                <option value="done">Проведён</option>
                <option value="cancelled">Отменён</option>
              </Select>
            </div>

            {/* Поле бюджета с возможностью очистки Backspace без застревания 0 */}
            <div>
              <Label htmlFor="value">Бюджет мероприятия, ₽</Label>
              <Input
                id="value"
                type="number"
                min={0}
                step={1000}
                value={form.value === 0 ? "" : form.value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    value: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="bartenders">Количество барменов</Label>
              <Input
                id="bartenders"
                type="number"
                min={1}
                value={form.bartendersCount}
                onChange={(e) => setForm({ ...form, bartendersCount: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="date">Дата мероприятия *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="clothing">Форма одежды</Label>
              <Input
                id="clothing"
                value={form.clothing}
                onChange={(e) => setForm({ ...form, clothing: e.target.value })}
                placeholder="Например: классика, черный фартук"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Адрес площадки</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="г. Москва, ул. Примерная, 10"
                />
              </div>
              <div>
                <Label htmlFor="managerContact">Контакт менеджера на площадке</Label>
                <Input
                  id="managerContact"
                  value={form.managerContact}
                  onChange={(e) => setForm({ ...form, managerContact: e.target.value })}
                  placeholder="Имя, телефон / Telegram (напр. Анна +7 999 123-45-67)"
                />
              </div>
            </div>
          </div>

          <SectionTitle>Тайминг</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                { key: "departure", label: "Выезд со склада" },
                { key: "setup", label: "Монтаж" },
                { key: "start", label: "Начало" },
                { key: "end", label: "Финал" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="time"
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <SectionTitle>Оборудование</SectionTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bar">Барная стойка</Label>
                <Select
                  id="bar"
                  value={form.bar}
                  onChange={(e) => setForm({ ...form, bar: e.target.value })}
                >
                  {BAR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="barComment">Комментарий к бару</Label>
                <Input
                  id="barComment"
                  value={form.barComment}
                  onChange={(e) => setForm({ ...form, barComment: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shelf">Стеллаж</Label>
                <Select
                  id="shelf"
                  value={form.shelf}
                  onChange={(e) => setForm({ ...form, shelf: e.target.value })}
                >
                  {SHELF_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="shelfComment">Комментарий к стеллажу</Label>
                <Input
                  id="shelfComment"
                  value={form.shelfComment}
                  onChange={(e) => setForm({ ...form, shelfComment: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pyramid">Пирамида бокалов</Label>
                <Select
                  id="pyramid"
                  value={form.pyramid}
                  onChange={(e) => setForm({ ...form, pyramid: e.target.value })}
                >
                  {PYRAMID_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pyramidComment">Комментарий к пирамиде</Label>
                <Input
                  id="pyramidComment"
                  value={form.pyramidComment}
                  onChange={(e) => setForm({ ...form, pyramidComment: e.target.value })}
                />
              </div>
            </div>
          </div>

          <SectionTitle>Украшения</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {DECORATION_OPTIONS.map((option) => (
              <label
                key={option}
                className={`cursor-pointer select-none px-4 py-2 rounded-full border font-montserrat text-sm transition-all ${
                  form.decorations.includes(option)
                    ? "bg-accent-primary border-accent-primary text-text-primary font-medium shadow-sm"
                    : "bg-bg-card border-border-sketch text-text-secondary hover:border-brand"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.decorations.includes(option)}
                  onChange={() => toggleDecoration(option)}
                />
                {option}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="decorationComment">Комментарий к украшениям</Label>
            <Input
              id="decorationComment"
              value={form.decorationComment}
              onChange={(e) => setForm({ ...form, decorationComment: e.target.value })}
            />
          </div>

          <SectionTitle>Меню</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="menu">Печать меню</Label>
              <Select
                id="menu"
                value={form.menu}
                onChange={(e) => setForm({ ...form, menu: e.target.value as "us" | "client" })}
              >
                <option value="us">С нас (наша полиграфия)</option>
                <option value="client">С заказчика</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 mb-4 border-b border-border pb-2">
            <h3 className="font-cormorant italic text-xl text-text-primary">
              Коктейльная карта ({form.cocktails.reduce((sum, c) => sum + c.qty, 0)} порций)
            </h3>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
              <input
                type="text"
                value={cocktailSearch}
                onChange={(e) => setCocktailSearch(e.target.value)}
                placeholder="Поиск коктейля..."
                className="w-full bg-bg-app border border-border rounded pl-8 pr-2 py-1 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredCocktails.map((cocktail) => {
              const selected = form.cocktails.find((c) => c.name === cocktail.name)
              return (
                <div
                  key={cocktail.key}
                  className={`flex items-center justify-between border rounded-lg px-4 py-2.5 transition-colors ${
                    selected && selected.qty > 0
                      ? "bg-surface-secondary/40 border-brand/50"
                      : "bg-bg-app border-border"
                  }`}
                >
                  <div>
                    <p className="font-cormorant text-base text-text-primary font-medium">
                      {cocktail.name}
                    </p>
                    {cocktail.category && (
                      <p className="font-montserrat text-[11px] text-text-tertiary">
                        {cocktail.category}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCocktailQty(cocktail.name, -1, cocktail.key)}
                      className="w-7 h-7 rounded-full border border-border-sketch flex items-center justify-center text-text-secondary hover:border-brand hover:text-text-primary transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-montserrat font-bold text-sm text-text-primary">
                      {selected ? selected.qty : 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCocktailQty(cocktail.name, 1, cocktail.key)}
                      className="w-7 h-7 rounded-full border border-border-sketch flex items-center justify-center text-text-secondary hover:border-brand hover:text-text-primary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <SectionTitle>Комментарий</SectionTitle>
          <TextArea
            rows={3}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Особые пожелания заказчика, логистика, нюансы площадки..."
          />

          <div className="sticky bottom-0 bg-bg-card border-t border-border pt-4 mt-8 flex items-center justify-between gap-3 z-20">
            {isEdit && event && onExport ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() => onExport(event)}
                className="flex items-center gap-2 text-xs text-brand border-brand/30 hover:bg-brand/10"
                title="Экспорт в PDF или копирование для Telegram"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Бриф (PDF / Telegram)</span>
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <Button variant="secondary" type="button" onClick={onClose}>
                Отмена
              </Button>
              <Button variant="primary" type="submit">
                {isEdit ? "Сохранить изменения" : "Создать мероприятие"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
