import React, { useState, useEffect } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Client } from "@/types"
import { useClients } from "@/context/ClientsContext"

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  client?: Client | null
}

export function ClientFormModal({ open, onClose, client }: ClientFormModalProps) {
  const { addClient, updateClient } = useClients()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (client) {
      setName(client.name || "")
      setPhone(client.phone || "")
      setEmail(client.email || "")
      setCompany(client.company || "")
      setNotes(client.notes || "")
    } else {
      setName("")
      setPhone("")
      setEmail("")
      setCompany("")
      setNotes("")
    }
  }, [client, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (client) {
      updateClient(client.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
      })
    } else {
      addClient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
      })
    }

    onClose()
  }

  const isEdit = !!client

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Редактировать заказчика" : "Новый заказчик"}
      description={
        isEdit
          ? "Измените контактную информацию и заметки о заказчике"
          : "Заполните контактную информацию заказчика"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
            Имя и Фамилия / Название *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Екатерина Романова"
            className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@agency.com"
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div>
          <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
            Компания / Агентство
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Event Bureau / Корпорация"
            className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
            Заметки / Предпочтения
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Особые пожелания, любимые коктейли, условия работы..."
            className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary">
            {isEdit ? "Сохранить изменения" : "Создать заказчика"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
