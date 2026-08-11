// Real image hosting via Supabase Storage (supabase/schema.sql: the
// `club-photos` bucket) — replaces the old base64-in-localStorage
// approach (imageToDataUrl.js), which was never real hosting, just a
// per-browser prototype capped by localStorage's ~5-10MB quota.

import { supabase } from './supabaseClient.js'

// Downscales large phone photos client-side before upload — keeps
// bandwidth/storage reasonable without needing a server-side image
// pipeline. Same dimension/quality defaults the old data-URL approach used.
function downscaleToBlob(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image file'))
    }
    img.src = objectUrl
  })
}

// Uploads a photo into club-photos/{folder}/{uuid}.jpg and returns its
// public URL. `folder` just keeps uploads organized in the bucket
// (e.g. 'club-page/hero', 'meetings/<meetingId>', 'excom-profiles').
export async function uploadClubPhoto(file, folder, options) {
  const blob = await downscaleToBlob(file, options)
  const path = `${folder}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('club-photos').upload(path, blob, {
    contentType: 'image/jpeg',
  })
  if (error) {
    console.error('[storage] uploadClubPhoto failed:', error.message)
    throw error
  }
  return supabase.storage.from('club-photos').getPublicUrl(path).data.publicUrl
}

export async function deleteClubPhoto(url) {
  const marker = '/club-photos/'
  const index = url.indexOf(marker)
  if (index === -1) return
  const path = url.slice(index + marker.length)
  const { error } = await supabase.storage.from('club-photos').remove([path])
  if (error) console.error('[storage] deleteClubPhoto failed:', error.message)
}
