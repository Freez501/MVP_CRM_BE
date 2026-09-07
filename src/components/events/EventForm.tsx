import { useState } from "react"
import { Button } from "@/components/ui/button"
import { mockClients } from "@/data/mockData"
import db from "@/data/cocktails_db.json"
import { Cocktail } from "@/types/db"
import { X, Plus, Minus } from "lucide-react"

const database = db as { cocktails: Record<string, Cocktail> }

const COCKTAILS = Object.values(database.cocktails)
  .map((c) => ({ name: c.name, category: c.category }))
  .sort((a, b) => a.name.localeCompare(b.name, "ru"))

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
  onSubmit: (event: any) => void
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

export function EventForm({ isOpen, onClose, onSubmit }: EventFormProps) {
  const [form, setForm] = useState({
    title: "",
    clientId: "",
    date: "",
    address: "",
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
    menu: "us",
    cocktails: [] as { name: string; qty: number }[],
    comment: "",
  })

  if (!isOpen) return null

  const client = mockClients.find((c) => c.id === form.clientId)

  const toggleDecoration = (value: string) => {
    setForm((prev) => ({
      ...prev,
      decorations: prev.decorations.includes(value)
        ? prev.decorations.filter((d) => d !== value)
        : [...prev.decorations, value],
    }))
  }

  const updateCocktailQty = (name: string, delta: number) => {
    setForm((prev) => {
      const existing = prev.cocktails.find((c) => c.name === name)
      if (!existing) {
        if (delta <= 0) return prev
        return { ...prev, cocktails: [...prev.cocktails, { name, qty: delta }] }
      }
      const nextQty = Math.max(0, existing.qty + delta)
      const cocktails =
        nextQty === 0
          ? prev.cocktails.filter((c) => c.name !== name)
          : prev.cocktails.map((c) => (c.name === name ? { ...c, qty: nextQty } : c))
      return { ...prev, cocktails }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title: form.title,
      clientId: form.clientId,
      clientName: client?.name ?? "",
      date: form.date,
      address: form.address,
      bartendersCount: Number(form.bartendersCount),
      stage: "new",
      value: 0,
      comment: form.comment,
      details: { ...form },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-text-primary/40" onClick={onClose} />
      <div className="relative bg-bg-card rounded-lg shadow-modal w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-cormorant italic text-[28px] text-text-primary">Новое мероприятие</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-2">
          <SectionTitle>Основное</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Название мероприятия</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="client">Заказчик</Label>
              <Select
                id="client"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
              >
                <option value="">Выберите заказчика</option>
                {mockClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `· ${c.company}` : ""}
                  </option>
                ))}
              </Select>
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
              <Label htmlFor="date">Дата</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Адрес площадки</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="clothing">Форма одежды</Label>
              <Input
                id="clothing"
                value={form.clothing}
                onChange={(e) => setForm({ ...form, clothing: e.target.value })}
                placeholder="Например, черная рубашка"
              />
            </div>
          </div>

          <SectionTitle>Тайминг</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "departure", label: "Выезд со склада" },
              { key: "setup", label: "Монтаж" },
              { key: "start", label: "Начало" },
              { key: "end", label: "Финал" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="time"
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value } as any)}
                />
              </div>
            ))}
          </div>

          <SectionTitle>Оборудование</SectionTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bar">Бар</Label>
                <Select
                  id="bar"
                  value={form.bar}
                  onChange={(e) => setForm({ ...form, bar: e.target.value })}
                >
                  <option value="white_with_columns">Белый с колоннами</option>
                  <option value="white_no_columns">Белый без колонн</option>
                  <option value="black">Чёрный</option>
                  <option value="none">Нет</option>
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
                  <option value="black_white">Чёрный с белыми полками</option>
                  <option value="gold_black">Золотой с чёрными полками</option>
                  <option value="none">Нет</option>
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
                <Label htmlFor="pyramid">Пирамида</Label>
                <Select
                  id="pyramid"
                  value={form.pyramid}
                  onChange={(e) => setForm({ ...form, pyramid: e.target.value })}
                >
                  <option value="">Нет</option>
                  <option value="56">56</option>
                  <option value="84">84</option>
                  <option value="120">120</option>
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
                    ? "bg-accent-primary border-accent-primary text-text-primary"
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
                onChange={(e) => setForm({ ...form, menu: e.target.value })}
              >
                <option value="us">С нас</option>
                <option value="client">С заказчика</option>
              </Select>
            </div>
          </div>

          <SectionTitle>Коктейли</SectionTitle>
          <div className="space-y-2">
            {COCKTAILS.map((cocktail) => {
              const selected = form.cocktails.find((c) => c.name === cocktail.name)
              return (
                <div
                  key={cocktail.name}
                  className="flex items-center justify-between bg-bg-app border border-border rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="font-cormorant text-base text-text-primary">{cocktail.name}</p>
                    <p className="font-montserrat text-xs text-text-tertiary">
                      {cocktail.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateCocktailQty(cocktail.name, -1)}
                      className="w-8 h-8 rounded-full border border-border-sketch flex items-center justify-center text-text-secondary hover:border-brand hover:text-text-primary transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-montserrat text-text-primary">
                      {selected ? selected.qty : 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCocktailQty(cocktail.name, 1)}
                      className="w-8 h-8 rounded-full border border-border-sketch flex items-center justify-center text-text-secondary hover:border-brand hover:text-text-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <SectionTitle>Комментарий</SectionTitle>
          <TextArea
            rows={4}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Особые пожелания заказчика"
          />

          <div className="sticky bottom-0 bg-bg-card border-t border-border pt-4 mt-8 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="primary" type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
