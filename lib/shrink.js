'use client'
// Makes photos smaller in the visitor's browser before sending (max 1600px, JPEG), so a form with
// many phone photos stays under the website's upload limit and loads fast later.
// Photos the browser can't read (like some iPhone HEIC files) are sent unchanged.
export async function shrinkImage(file, max = 1600, quality = 0.82) {
  if (!file || !file.size || !/^image\//.test(file.type)) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
    if (scale === 1 && file.size < 900 * 1024 && /jpe?g|webp/.test(file.type)) return file
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * scale)
    c.height = Math.round(bmp.height * scale)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', quality))
    return blob ? new File([blob], (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}

/** Shrink every photo in a FormData field, in place. */
export async function shrinkForm(fd, field) {
  const files = fd.getAll(field).filter((f) => f && typeof f === 'object' && f.size > 0)
  if (!files.length) return
  const small = await Promise.all(files.map((f) => shrinkImage(f)))
  fd.delete(field)
  small.forEach((f) => fd.append(field, f))
}
