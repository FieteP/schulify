import { useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, FileText, Trash2, Search, Upload, Download,
  File, Image, FileSpreadsheet, Presentation, Filter, X
} from 'lucide-react'
import { useDocumentStore } from '../store/documentStore'
import { useSubjectStore }  from '../store/subjectStore'
import { useAuthStore }     from '../store/authStore'
import type { Document } from '../types'
import { formatDate } from '../utils/helpers'
import Card from '../components/cards/Card'
import Modal from '../components/forms/Modal'
import Input from '../components/forms/Input'
import Select from '../components/forms/Select'
import TextArea from '../components/forms/TextArea'
import Button from '../components/forms/Button'
import EmptyState from '../components/forms/EmptyState'

function getFileIcon(type?: string) {
  if (!type) return <FileText size={18} />
  if (type.startsWith('image/')) return <Image size={18} />
  if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet size={18} />
  if (type.includes('presentation') || type.includes('powerpoint')) return <Presentation size={18} />
  if (type.includes('pdf')) return <FileText size={18} className="text-red-500" />
  if (type.includes('word') || type.includes('document')) return <FileText size={18} className="text-blue-500" />
  return <File size={18} />
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Dokumente() {
  const { documents, add, update, remove, getFileUrl } = useDocumentStore()
  const subjects = useSubjectStore(s => s.subjects)
  const user = useAuthStore(s => s.user)

  const [modal, setModal] = useState(false)
  const [editDoc, setEditDoc] = useState<Document | null>(null)
  const [search, setSearch] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Filters
  const [filterSubject, setFilterSubject]   = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  const [form, setForm] = useState({
    name: '', subjectId: '', category: 'Notiz', content: '', tags: [] as string[]
  })

  const reset = () => {
    setForm({ name: '', subjectId: '', category: 'Notiz', content: '', tags: [] })
    setEditDoc(null)
    setTagInput('')
    setSelectedFile(null)
  }

  const openEdit = (doc: Document) => {
    setEditDoc(doc)
    setForm({
      name: doc.name, subjectId: doc.subjectId || '',
      category: doc.category, content: doc.content, tags: doc.tags
    })
    setModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !user) return
    if (editDoc) {
      await update(editDoc.id, form)
    } else {
      await add(user.id, form, selectedFile || undefined)
    }
    setModal(false)
    reset()
  }

  const handleDownload = async (doc: Document) => {
    if (!doc.filePath) return
    const url = await getFileUrl(doc.filePath)
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName || doc.name
      a.target = '_blank'
      a.click()
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  // Filter & Search
  const filtered = useMemo(() => {
    let result = [...documents]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    if (filterSubject === '__none__') {
      result = result.filter(d => !d.subjectId)
    } else if (filterSubject) {
      result = result.filter(d => d.subjectId === filterSubject)
    }

    if (filterCategory) {
      result = result.filter(d => d.category === filterCategory)
    }

    return result
  }, [documents, search, filterSubject, filterCategory])

  // Group by subject
  const grouped = useMemo(() => {
    const groups: Record<string, Document[]> = {}
    filtered.forEach(doc => {
      const key = doc.subjectId || '__none__'
      if (!groups[key]) groups[key] = []
      groups[key].push(doc)
    })
    return groups
  }, [filtered])

  const categories = ['Notiz', 'Zusammenfassung', 'Formelsammlung', 'Lernzettel', 'Datei', 'Sonstige']

  const hasActiveFilters = filterSubject || filterCategory

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">Dokumente</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">{documents.length} Dokumente</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => { reset(); setModal(true) }}>Neues Dokument</Button>
      </div>

      {/* Search & Filter */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Dokumente durchsuchen..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={16} className="text-[#6B7280]" />
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB]">
              <option value="">Alle Fächer</option>
              <option value="__none__">Nicht zugeordnet</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB]">
              <option value="">Alle Kategorien</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterSubject(''); setFilterCategory('') }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <X size={14} /> Filter zurücksetzen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Documents */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([subjectId, docs]) => {
            const subject = subjects.find(s => s.id === subjectId)
            const groupLabel = subject ? subject.name : 'Nicht zugeordnet'
            const groupColor = subject?.color || '#6B7280'

            return (
              <div key={subjectId}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: groupColor }} />
                  <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{groupLabel}</h2>
                  <span className="text-xs text-[#6B7280]">({docs.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map(doc => (
                    <Card key={doc.id} hover onClick={() => openEdit(doc)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(doc.fileType)}
                          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] truncate">
                            {doc.name}
                          </h3>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {doc.filePath && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDownload(doc) }}
                              className="p-1.5 rounded-lg text-[#6B7280] hover:text-blue-500 transition-colors"
                            >
                              <Download size={14} />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); remove(doc.id) }}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {doc.content && (
                        <p className="text-xs text-[#6B7280] line-clamp-2 mb-3">{doc.content}</p>
                      )}

                      {doc.fileName && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FB] dark:bg-[#0F172A] mb-3">
                          {getFileIcon(doc.fileType)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#111827] dark:text-[#F9FAFB] truncate">{doc.fileName}</p>
                            <p className="text-[10px] text-[#6B7280]">{formatFileSize(doc.fileSize)}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[#6B7280]">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-[#6B7280] ml-auto">{formatDate(doc.updatedAt)}</span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {doc.tags.map((t, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FileText size={32} />}
          title={search || hasActiveFilters ? 'Keine Ergebnisse' : 'Keine Dokumente'}
          description={search || hasActiveFilters ? 'Passe deine Filter an.' : 'Erstelle Notizen oder lade Dateien hoch.'}
          action={!search && !hasActiveFilters ? (
            <Button icon={<Plus size={18} />} onClick={() => { reset(); setModal(true) }}>Erstes Dokument</Button>
          ) : undefined}
        />
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => { setModal(false); reset() }} title={editDoc ? 'Bearbeiten' : 'Neues Dokument'} size="lg">
        <div className="space-y-4">
          <Input label="Titel" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="z.B. Zusammenfassung Kapitel 3" />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Fach (optional)" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
              options={[{ value: '', label: 'Nicht zugeordnet' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} />
            <Select label="Kategorie" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              options={categories.map(v => ({ value: v, label: v }))} />
          </div>

          <TextArea label="Inhalt / Notizen (optional)" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Schreibe hier..." rows={6} />

          {/* File Upload - only for new documents */}
          {!editDoc && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Datei anhängen (optional)</label>
              <input
                ref={fileRef}
                type="file"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setSelectedFile(f)
                    if (!form.name) setForm(prev => ({ ...prev, name: f.name.split('.')[0], category: 'Datei' }))
                  }
                }}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg"
              />
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                  {getFileIcon(selectedFile.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111827] dark:text-[#F9FAFB] truncate">{selectedFile.name}</p>
                    <p className="text-xs text-[#6B7280]">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-[#6B7280] hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-[#E5E7EB] dark:border-[#334155] hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-[#6B7280] hover:text-blue-500"
                >
                  <Upload size={24} />
                  <span className="text-sm">Datei auswählen oder hierher ziehen</span>
                  <span className="text-xs">PDF, Word, Excel, Bilder, etc.</span>
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">Tags (optional)</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Tag + Enter"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F8F9FB] dark:bg-[#0F172A] text-sm text-[#111827] dark:text-[#F9FAFB]" />
              <Button size="sm" onClick={addTag}>+</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {form.tags.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center gap-1">
                    #{t}
                    <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}>×</button>
                  </span>
                ))}
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