import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let cache

/** Logo PNGs (rendered from components/Logo geometry) as data URIs for next/og ImageResponse. */
export async function ogLogos() {
  if (!cache) {
    const load = async (f) => `data:image/png;base64,${(await readFile(join(process.cwd(), 'assets', f))).toString('base64')}`
    cache = { dark: await load('logo-wordmark.png'), white: await load('logo-wordmark-white.png') }
  }
  return cache
}

// Wordmark PNG aspect ratio (width / height) — keep in sync if the assets are re-rendered.
export const LOGO_RATIO = 1256 / 462
