// Server-only connection to Supabase with the secret service key, used by the public forms
// (quote requests, claims, tips) and activity counting. The key lives only in Netlify's settings.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const CAN_SAVE = !!(URL_ && KEY)

let client
export const admin = () =>
  (client ||= createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }))

/** Save a photo a visitor sent into the media bucket. Returns its storage path. */
export async function savePhoto(file, folder) {
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type] || 'jpg'
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const { error } = await admin().storage.from('media').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false, cacheControl: '31536000' })
  if (error) throw new Error('photo upload failed: ' + error.message)
  return path
}
