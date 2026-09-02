import { useState, useRef, useEffect, useMemo } from "react"
import { Search, ChevronDown, Check } from "lucide-react"

export interface SelectOption {
  key: string
  name: string
  category?: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Выбрать...",
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(() => {
    if (!value) return undefined
    const cleanVal = value.trim().toLowerCase().replace(/^\(пф\)\s*/i, "")
    return options.find(
      (opt) =>
        opt.key === value ||
        opt.name === value ||
        opt.key.toLowerCase() === value.toLowerCase() ||
        opt.name.toLowerCase() === value.toLowerCase() ||
        opt.key.toLowerCase().replace(/^\(пф\)\s*/i, "") === cleanVal
    )
  }, [options, value])

  const filteredOptions = useMemo(() => {
    const rawQ = search.trim().toLowerCase()
    if (!rawQ) return options

    const cleanQ = rawQ.replace(/^(\(?пф\)?[:\s-]*)+/gi, "").trim()

    return options.filter((opt) => {
      const name = opt.name.toLowerCase()
      const cleanName = name.replace(/^(\(?пф\)?[:\s-]*)+/gi, "").trim()
      const key = opt.key.toLowerCase()
      const cleanKey = key.replace(/^(\(?пф\)?[:\s-]*)+/gi, "").trim()

      return (
        name.includes(rawQ) ||
        cleanName.includes(cleanQ) ||
        key.includes(rawQ) ||
        cleanKey.includes(cleanQ)
      )
    })
  }, [options, search])

  // Закрытие при клике вне элемента
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const displayName = selectedOption ? selectedOption.name : value ? value : null

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Кнопка открытия селектора */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setSearch("")
        }}
        className="w-full flex items-center justify-between gap-1.5 text-left bg-transparent font-montserrat text-xs sm:text-sm text-text-primary px-1 py-1 rounded hover:bg-surface-secondary/20 transition-colors focus:outline-none"
      >
        <span className="truncate font-medium">
          {displayName ? displayName : <span className="text-text-tertiary font-normal">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Выпадающий блок с поиском */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 bg-bg-card border-2 border-border-sketch rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Поле поиска */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full bg-bg-app border border-border-sketch rounded pl-8 pr-2 py-1.5 font-montserrat text-xs text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          {/* Список результатов */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
            {filteredOptions.length === 0 ? (
              <p className="text-xs font-montserrat text-text-tertiary py-3 text-center">
                Ничего не найдено
              </p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.key === value || opt.name === value
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onChange(opt.key)
                      setIsOpen(false)
                      setSearch("")
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs font-montserrat transition-colors ${
                      isSelected
                        ? "bg-accent-primary text-text-primary font-medium"
                        : "text-text-secondary hover:bg-surface-secondary/40 hover:text-text-primary"
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-text-primary shrink-0 ml-2" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
