import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Document, Semester } from '../types'
import type { DocumentRow } from '../lib/supabase'

function rowToDoc(r: DocumentRow): Document {
  return {
    id: r.id, name: r.name, subjectId: r.subject_id ?? undefined,
    semester: r.semester as Semester | undefined, category: r.category,
    content: r.content, tags: r.tags,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

interface DocumentState {
  documents: Document[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, d: Omit<Document, 'id'|'createdAt'|'updatedAt'>) => Promise<void>
  update: (id: string, updates: Partial<Document>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('documents').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
    set({ documents: (data ?? []).map(rowToDoc), loading: false })
  },

  add: async (userId, d) => {
    const { data } = await supabase.from('documents').insert({
      user_id: userId, name: d.name, subject_id: d.subjectId ?? null,
      semester: d.semester ?? null, category: d.category,
      content: d.content, tags: d.tags,
    }).select().single()
    if (data) set({ documents: [rowToDoc(data), ...get().documents] })
  },

  update: async (id, u) => {
    const mapped: Record<string, unknown> = {}
    if (u.name     !== undefined) mapped.name      = u.name
    if (u.content  !== undefined) mapped.content   = u.content
    if (u.category !== undefined) mapped.category  = u.category
    if (u.tags     !== undefined) mapped.tags      = u.tags

    const { data } = await supabase.from('documents').update(mapped).eq('id', id).select().single()
    if (data) set({ documents: get().documents.map(d => d.id === id ? rowToDoc(data) : d) })
  },

  remove: async (id) => {
    await supabase.from('documents').delete().eq('id', id)
    set({ documents: get().documents.filter(d => d.id !== id) })
  },
}))