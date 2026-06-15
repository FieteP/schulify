import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Document, Semester } from '../types'

interface DocumentRow {
  id: string; user_id: string; name: string; subject_id: string | null
  semester: string | null; category: string; content: string
  tags: string[]; file_path: string | null; file_name: string | null
  file_size: number | null; file_type: string | null
  created_at: string; updated_at: string
}

function rowToDoc(r: DocumentRow): Document {
  return {
    id: r.id, name: r.name, subjectId: r.subject_id ?? undefined,
    semester: r.semester as Semester | undefined, category: r.category,
    content: r.content, tags: r.tags,
    filePath: r.file_path ?? undefined, fileName: r.file_name ?? undefined,
    fileSize: r.file_size ?? undefined, fileType: r.file_type ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

interface DocumentState {
  documents: Document[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  add: (userId: string, d: Omit<Document, 'id'|'createdAt'|'updatedAt'>, file?: File) => Promise<void>
  update: (id: string, updates: Partial<Document>) => Promise<void>
  remove: (id: string) => Promise<void>
  getFileUrl: (filePath: string) => Promise<string | null>
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

  add: async (userId, d, file) => {
    let filePath: string | null = null
    let fileName: string | null = null
    let fileSize: number | null = null
    let fileType: string | null = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })
      
      if (!error) {
        filePath = path
        fileName = file.name
        fileSize = file.size
        fileType = file.type
      }
    }

    const { data } = await supabase.from('documents').insert({
      user_id: userId, name: d.name, subject_id: d.subjectId ?? null,
      semester: d.semester ?? null, category: d.category,
      content: d.content, tags: d.tags,
      file_path: filePath, file_name: fileName,
      file_size: fileSize, file_type: fileType,
    }).select().single()
    if (data) set({ documents: [rowToDoc(data), ...get().documents] })
  },

  update: async (id, u) => {
    const mapped: Record<string, unknown> = {}
    if (u.name     !== undefined) mapped.name      = u.name
    if (u.content  !== undefined) mapped.content   = u.content
    if (u.category !== undefined) mapped.category  = u.category
    if (u.tags     !== undefined) mapped.tags      = u.tags
    if (u.subjectId !== undefined) mapped.subject_id = u.subjectId ?? null

    const { data } = await supabase.from('documents').update(mapped).eq('id', id).select().single()
    if (data) set({ documents: get().documents.map(d => d.id === id ? rowToDoc(data) : d) })
  },

  remove: async (id) => {
    const doc = get().documents.find(d => d.id === id)
    if (doc?.filePath) {
      await supabase.storage.from('documents').remove([doc.filePath])
    }
    await supabase.from('documents').delete().eq('id', id)
    set({ documents: get().documents.filter(d => d.id !== id) })
  },

  getFileUrl: async (filePath) => {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600) // 1 hour
    return data?.signedUrl ?? null
  },
}))