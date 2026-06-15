import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Trash2, Search } from 'lucide-react'
import { useDocumentStore } from '../store/documentStore'
import { useSubjectStore }  from '../store/subjectStore'
import { useAuthStore }     from '../store/authStore'
import { Document } from '../types'
import { formatDate } from '../utils/helpers'
import Card from '../components/cards/Card'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import TextArea from '../components/forms/TextArea'
import Button from '../components/forms/Button'
import EmptyState from '../components/forms/EmptyState'

export default function Dokumente() {
  const { documents, add, update, remove } = useDocumentStore()
  const subjects = useSubjectStore(s => s.subjects)
  const user = useAuthStore(s => s.user)

  const [modal, setModal] = useState(false)
  const [editDoc, setEditDoc] = useState<Document | null>(null)
  const [search, setSearch] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState({ name: '', subjectId: '', category: 'Notiz', content: '', tags: [] as string[] })

  const reset = () => { setForm({ name: '', subjectId: '', category: 'Notiz', content: '', tags: [] }); setEditDoc(null); setTagInput('') }

  const openEdit = (doc: Document) => {
    setEditDoc(doc)
    setForm({ name: doc.name, subjectId: doc.subjectId || '', category: doc.category, content: doc.content, tags: doc.tags })
    setModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !user) return
    if (editDoc) { await update(editDoc.id, form) }
    else { await add(user.id, form) }
    setModal(false); reset()
  }

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] })); setTagInput('')
    }
  }

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.content.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Dokumente</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">{documents.length} Dokumente</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => { reset(); setModal(true) }}>Neues Dokument</Button>
      </div>

      {documents.length > 0 && (
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const sub = subjects.find(s => s.id === doc.subjectId)
            return (
              <Card key={doc.id} hover onClick={() => openEdit(doc)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#6B7280]" />
                    <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] truncate">{doc.name}</h3>
                  </div>
                  <button onClick={e => { e.stopPropagation(); remove(doc.id) }} className="p-1 text-[#6B7280] hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-[#6B7280] line-clamp-3 mb-3">{doc.content || 'Kein Inhalt'}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {sub && <span className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: sub.color }}>{sub.shortName}</span>}
                  <span className="text-[10px] text-[#6B7280]">{doc.category}</span>
                  <span className="text-[10px] text-[#6B7280] ml-auto">{formatDate(doc.updatedAt)}</span>
                </div>
                {doc.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {doc.tags.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[#6B7280]">#{t}</span>)}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={<FileText size={32} />} title="Keine Dokumente" description="Erstelle Notizen, Zusammenfassungen und mehr."
          action={<Button icon={<Plus size={18} />} onClick={() => { reset(); setModal(true) }}>Erstes Dokument</Button>} />
      )}

      <Modal open={modal} onClose={() => { setModal(false); reset() }} title={editDoc ? 'Bearbeiten' : 'Neues Dokument'} size="lg">
        <div className="space-y-4">
          <Input label="Titel" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Zusammenfassung..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Fach" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
              options={[{ value: '', label: 'Kein Fach' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} />
            <Select label="Kategorie" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              options={['Notiz','Zusammenfassung','Formelsammlung','Lernzettel','Sonstige'].map(v => ({ value: v, label: v }))} />
          </div>
          <TextArea label="Inhalt" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Schreibe hier..." rows={8} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Tag + Enter" className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB]" />
              <Button size="sm" onClick={addTag}>+</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {form.tags.map((t, i) => <span key={i} className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center gap-1">#{t}<button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}>×</button></span>)}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1">{editDoc ? 'Speichern' : 'Erstellen'}</Button>
            <Button variant="secondary" onClick={() => { setModal(false); reset() }}>Abbrechen</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}