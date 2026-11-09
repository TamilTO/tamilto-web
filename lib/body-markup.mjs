// Story text <-> stored blocks.
//
// Editors type stories as plain text with a few simple marks (shown beside the box in the admin).
// The website stores and shows them as "portable text" blocks (the format the story pages already use).
//
//   Blank line            new paragraph
//   ## Heading            big heading        ### Heading   small heading
//   - item                bullet list        1. item       numbered list
//   > Quote -- Name       pull quote (the "-- Name" part is optional)
//   #1 Name | Area | Why  best-of list item (consecutive #-lines form one list)
//   ![Caption](link)      photo
//   [embed](link)         Instagram, TikTok or YouTube post
//   **bold**  *italic*  [words](https://link)

let n = 0
const key = () => (Date.now().toString(36) + (n++).toString(36) + Math.random().toString(36).slice(2, 6)).slice(-12)

const PLATFORM = (url) => (/youtu\.?be/i.test(url) ? 'youtube' : /tiktok\.com/i.test(url) ? 'tiktok' : /instagram\.com/i.test(url) ? 'instagram' : null)

/** "**a** and [b](https://x)" -> children spans + markDefs. */
function inline(text) {
  const children = []
  const markDefs = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:|tel:)[^)\s]+)\)/g
  let last = 0
  let m
  const push = (t, marks = []) => t && children.push({ _type: 'span', _key: key(), text: t, marks })
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index))
    if (m[1] !== undefined) push(m[1], ['strong'])
    else if (m[2] !== undefined) push(m[2], ['em'])
    else {
      const k = key()
      markDefs.push({ _type: 'link', _key: k, href: m[4] })
      push(m[3], [k])
    }
    last = re.lastIndex
  }
  push(text.slice(last))
  if (!children.length) push(' ')
  return { children, markDefs }
}

const block = (text, extra = {}) => ({ _type: 'block', _key: key(), style: 'normal', ...inline(text), ...extra })

export function markupToBlocks(src) {
  const out = []
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n')
  let para = []
  const flush = () => {
    if (para.length) out.push(block(para.join(' ').trim()))
    para = []
  }
  for (const raw of lines) {
    const line = raw.trim()
    let m
    if (!line) { flush(); continue }
    if ((m = line.match(/^(#{2,3})\s+(.+)$/))) { flush(); out.push(block(m[2], { style: m[1].length === 2 ? 'h2' : 'h3' })); continue }
    if ((m = line.match(/^[-*•]\s+(.+)$/))) { flush(); out.push(block(m[1], { listItem: 'bullet', level: 1 })); continue }
    if ((m = line.match(/^\d+[.)]\s+(.+)$/))) { flush(); out.push(block(m[1], { listItem: 'number', level: 1 })); continue }
    if ((m = line.match(/^>\s*(.+?)(?:\s+--\s+(.+))?$/))) { flush(); out.push({ _type: 'pullQuote', _key: key(), text: m[1].replace(/^["“]|["”]$/g, ''), attribution: m[2] || '' }); continue }
    if ((m = line.match(/^#\d+\s+(.+)$/))) {
      flush()
      const [name, neighbourhood = '', ...note] = m[1].split('|').map((s) => s.trim())
      const item = { _key: key(), name, neighbourhood, note: note.join(' | ') }
      const prev = out[out.length - 1]
      if (prev && prev._type === 'bestOfList' && prev._open) prev.items.push(item)
      else out.push({ _type: 'bestOfList', _key: key(), items: [item], _open: true })
      continue
    }
    if ((m = line.match(/^!\[([^\]]*)\]\((\S+)\)$/))) { flush(); out.push({ _type: 'image', _key: key(), url: m[2], alt: m[1], caption: m[1] }); continue }
    if ((m = line.match(/^\[embed\]\((\S+)\)$/i)) || (PLATFORM(line) && /^https?:\/\/\S+$/.test(line) && (m = [line, line]))) {
      flush()
      out.push({ _type: 'embed', _key: key(), platform: PLATFORM(m[1]) || 'instagram', url: m[1], caption: '' })
      continue
    }
    // A plain line closes any open best-of list and joins the current paragraph.
    para.push(line)
  }
  flush()
  return out.map((b) => { if (b._open) { const { _open, ...rest } = b; return rest } return b })
}

function spansToText(b) {
  const defs = Object.fromEntries((b.markDefs || []).map((d) => [d._key, d]))
  return (b.children || [])
    .map((s) => {
      let t = s.text || ''
      for (const mk of s.marks || []) {
        if (mk === 'strong') t = `**${t}**`
        else if (mk === 'em') t = `*${t}*`
        else if (defs[mk]?.href) t = `[${t}](${defs[mk].href})`
      }
      return t
    })
    .join('')
    .trim()
}

export function blocksToMarkup(blocks) {
  const parts = []
  let prevList = false
  for (const b of Array.isArray(blocks) ? blocks : []) {
    let s = ''
    const isList = b._type === 'block' && !!b.listItem
    if (b._type === 'block') {
      const t = spansToText(b)
      if (b.listItem) s = (b.listItem === 'number' ? '1. ' : '- ') + t
      else if (b.style === 'h2') s = '## ' + t
      else if (b.style === 'h3' || b.style === 'h4') s = '### ' + t
      else s = t
    } else if (b._type === 'pullQuote') s = '> ' + b.text + (b.attribution ? ' -- ' + b.attribution : '')
    else if (b._type === 'bestOfList') s = (b.items || []).map((it, i) => `#${i + 1} ${[it.name, it.neighbourhood || '', it.note || ''].join(' | ').replace(/( \| )+$/, '')}`).join('\n')
    else if (b._type === 'image' && b.url) s = `![${b.caption || b.alt || ''}](${b.url})`
    else if (b._type === 'embed') s = `[embed](${b.url})`
    else if (b._type === 'gallery') s = (b.images || []).filter((i) => i.url).map((i) => `![${i.caption || i.alt || ''}](${i.url})`).join('\n\n')
    if (!s) continue
    parts.push((parts.length ? (isList && prevList ? '\n' : '\n\n') : '') + s)
    prevList = isList
  }
  return parts.join('')
}
