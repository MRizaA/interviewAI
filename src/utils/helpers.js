// ─── Storage helpers ──────────────────────────────────────────────────────
export const store = {
  get: (k, def = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  del: (k) => { try { localStorage.removeItem(k) } catch {} },
}

// ─── Cloudflare Workers AI config ────────────────────────────────────────
const CF_WORKER_URL  = 'https://dry-truth-964a.mra474188.workers.dev/'
const CF_DAILY_LIMIT = 30

export function getCFSessionsToday() {
  const today = new Date().toISOString().slice(0, 10)
  const saved = store.get('ic3_cf_sessions', { date: '', count: 0 })
  if (saved.date !== today) return 0
  return saved.count
}

export function incrementCFSessions() {
  const today = new Date().toISOString().slice(0, 10)
  const saved = store.get('ic3_cf_sessions', { date: '', count: 0 })
  const count = saved.date === today ? saved.count + 1 : 1
  store.set('ic3_cf_sessions', { date: today, count })
}

// ─── Detect AI provider from key prefix ──────────────────────────────────
// Prefix yang dikenal — jika tidak cocok, return 'unknown'
export function detectProvider(apiKey) {
  if (!apiKey || apiKey.trim() === '') return 'no_key'
  if (apiKey === 'CF_WORKERS')         return 'cloudflare'
  if (apiKey === 'DEMO')               return 'pollinations'
  if (apiKey.startsWith('AIza'))       return 'gemini'
  if (apiKey.startsWith('gsk_'))       return 'groq'
  if (apiKey.startsWith('sk-or-'))     return 'openrouter'
  if (apiKey.startsWith('sk-ant-'))    return 'anthropic'
  if (apiKey.startsWith('fw-'))        return 'fireworks'
  return 'unknown' // prefix tidak dikenal — tidak bisa dipakai
}

// ─── Provider metadata ────────────────────────────────────────────────────
export const PROVIDER_INFO = {
  gemini:      { label: 'Gemini (Google)',    supported: true,  note: '' },
  groq:        { label: 'Groq',              supported: true,  note: '' },
  openrouter:  { label: 'OpenRouter',        supported: true,  note: '' },
  anthropic:   { label: 'Anthropic (Claude)',supported: true,  note: 'Berbayar' },
  fireworks:   { label: 'Fireworks AI',      supported: true,  note: '' },
  cloudflare:  { label: 'Cloudflare AI',     supported: true,  note: '' },
  pollinations:{ label: 'Pollinations',      supported: false, note: 'Tidak stabil' },
  unknown:     { label: 'Tidak dikenal',     supported: false, note: 'API key tidak didukung' },
  no_key:      { label: '-',                 supported: false, note: '' },
}

// ─── Detect language type ─────────────────────────────────────────────────
function getLangType(lang) {
  if (!lang || lang === 'English') return 'english'
  if (lang === 'Bahasa Indonesia')  return 'indo'
  if (
    lang.includes('+') ||
    lang === 'Both (campur)' ||
    lang === 'Campur (Indo+Eng)' ||
    lang === 'Indonesia + English'
  ) return 'mix'
  return 'custom'
}

// ─── Strict language header — dibaca model sebelum instruksi lain ─────────
function buildLangHeader(lang, langType) {
  if (langType === 'english') return `STRICT RULE: Respond in English ONLY. Every sentence. No Indonesian. No exceptions.\n\n`
  if (langType === 'indo')    return `ATURAN KETAT: Respons dalam Bahasa Indonesia SAJA. Setiap kalimat. Tanpa bahasa Inggris.\n\n`
  if (langType === 'mix')     return `LANGUAGE: Mixed Indonesian + English as described below.\n\n`
  return `STRICT RULE: The ONLY language for this session is "${lang}". Use correct script (kanji/hanzi/arabic/etc). Do NOT use English or Indonesian unless user explicitly requests it.\n\n`
}

// ─── Build system prompt ──────────────────────────────────────────────────
export function buildSystemPrompt(profile, mode = 'interview') {
  const { name, education, experience, skills, achievements, targetJob, targetCompany, interviewLang, struggles, aiPersona, extraContext } = profile

  const lang          = interviewLang || 'Indonesia + English'
  const langType      = getLangType(lang)
  const candidateName = name || 'the candidate'

  const answerLang = langType === 'english' ? 'English'
    : langType === 'indo' ? 'Bahasa Indonesia'
    : langType === 'custom' ? lang
    : 'English'

  const base = `${buildLangHeader(lang, langType)}You are ${aiPersona || 'a professional, encouraging interview coach'} helping ${candidateName} prepare for a job interview.

=== CANDIDATE PROFILE ===
Name: ${candidateName}
Education: ${education || '-'}
Experience: ${experience || '-'}
Skills: ${skills || '-'}
Achievements: ${achievements || '-'}
Extra context / job description: ${extraContext || '-'}

=== TARGET ===
Position: ${targetJob || 'a job'}
Company: ${targetCompany || 'not specified'}
Interview language: ${lang}

=== STRUGGLES ===
${struggles || 'Tends to go blank mid-answer, struggles to structure thoughts clearly.'}

If documents are attached, read and use them. Maintain full conversation history.
`

  // ── Predict ───────────────────────────────────────────────────────────
  if (mode === 'predict') {
    const qLang = langType === 'english' ? 'English' : langType === 'indo' ? 'Bahasa Indonesia' : langType === 'mix' ? 'English' : lang
    return base + `
=== TASK: PREDICT INTERVIEW QUESTIONS ===
Generate 8 likely interview questions. Output ONLY a raw JSON array — no markdown, no backtick, no text before or after.

[{"q":"...","tip":"...","answer":"...","warning":"..."}]

- q: question in ${qLang}
- tip: max 20 words, practical advice
- answer: complete example in ${answerLang}, first person as ${candidateName}, use actual profile data. 2-4 sentences. NO brackets like [name].
- warning: one sentence about common mistakes. Omit field if not applicable.
- Single quotes only inside strings. No newlines inside strings.
- Begin with [ end with ]. Nothing else.`
  }

  // ── Predict one ───────────────────────────────────────────────────────
  if (mode === 'predict_one') {
    return base + `
=== TASK: ANSWER GUIDANCE ===
Return a single JSON object for the question given by the candidate. No markdown, no backtick.

{"q":"...","tip":"...","answer":"...","warning":"..."}

- q: question exactly as written
- tip: max 20 words, specific advice
- answer: complete example in ${answerLang}, first person as ${candidateName}. 2-4 sentences. NO brackets.
- warning: one sentence about mistakes. Omit if not applicable.
- Single quotes inside strings. No newlines inside strings.
- Begin with { end with }. Nothing else.`
  }

  // ── Interview ─────────────────────────────────────────────────────────
  const langNote = langType === 'english'
    ? `Entire interview in English only. No Indonesian.`
    : langType === 'indo'
    ? `Seluruh wawancara dalam Bahasa Indonesia saja. Tidak ada bahasa Inggris.`
    : langType === 'custom'
    ? `Entire interview in ${lang}. Use correct script. If candidate requests another language for explanation, comply — but keep questions in ${lang}.`
    : `Mixed mode: questions in English (Indonesian translation in parentheses). Feedback in Bahasa Indonesia. Improved answers in English then brief Indonesian explanation.`

  const nextQ   = langType === 'english' ? 'NEXT QUESTION' : langType === 'mix' ? 'PERTANYAAN SELANJUTNYA (Next Question)' : langType === 'custom' ? 'NEXT QUESTION' : 'PERTANYAAN SELANJUTNYA'
  const better  = langType === 'english' ? 'BETTER VERSION' : 'VERSI LEBIH BAIK'
  const trigger = langType === 'english' ? 'ready / yes / go / start' : 'mulai / siap / ready / yes / iya / start'

  return base + `
=== ROLE: INTERVIEW COACH ===
${langNote}

Opening: Greet ${candidateName} warmly. Ask if ready. Do NOT ask the first question yet.
When ready (${trigger}): ask the first question.

After each answer:
🎯 FEEDBACK
[1-2 specific observations]

✨ ${better}
[Rewrite their answer in target language, first person as ${candidateName}]

➡️ ${nextQ}
[Next question]

Other requests: respond naturally — no forced structure.
Always be encouraging. Quality over quantity.`
}

// ─── Cloudflare Workers AI ────────────────────────────────────────────────
async function callCloudflareWorker({ system, messages, maxTokens }) {
  if (getCFSessionsToday() >= CF_DAILY_LIMIT) {
    throw new Error('Interviewer AI gratis sudah mencapai batas harian. Coba lagi besok, atau gunakan API key Gemini / Groq sendiri.')
  }
  const res = await fetch(CF_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, maxTokens }),
  })
  if (!res.ok) throw new Error(`Cloudflare error: HTTP ${res.status}`)
  const text = await res.text()
  if (!text || text.trim().length < 2) throw new Error('Interviewer AI tidak merespons.')
  incrementCFSessions()
  return text
}

// ─── Gemini ───────────────────────────────────────────────────────────────
async function callGemini({ apiKey, system, messages, maxTokens, files, model }) {
  const contents = []
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i], role = m.role === 'assistant' ? 'model' : 'user'
    const isLast = m.role === 'user' && i === messages.length - 1
    if (isLast && files.length > 0) {
      const parts = []
      for (const f of files) {
        if (f.type === 'image') parts.push({ inlineData: { mimeType: f.mediaType, data: f.data } })
        else if (f.type === 'pdf') parts.push({ inlineData: { mimeType: 'application/pdf', data: f.data } })
        else parts.push({ text: `[Dokumen: ${f.name}]\n${f.text}` })
      }
      parts.push({ text: typeof m.content === 'string' ? m.content : '' })
      contents.push({ role, parts })
    } else {
      contents.push({ role, parts: [{ text: typeof m.content === 'string' ? m.content : '' }] })
    }
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 } }) }
  )
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Gemini HTTP ${res.status}`) }
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
}

// ─── Anthropic (Claude) ───────────────────────────────────────────────────
// Format berbeda dari OpenAI — pakai endpoint /v1/messages dengan header khusus
async function callAnthropic({ apiKey, system, messages, maxTokens, model }) {
  const anthropicMsgs = messages
    .filter(m => m.content !== '[SESSION_START]')
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: typeof m.content === 'string' ? m.content : '' }))
  // Anthropic butuh pesan pertama dari user
  if (!anthropicMsgs.length || anthropicMsgs[0].role !== 'user') {
    anthropicMsgs.unshift({ role: 'user', content: 'Hello' })
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: model || 'claude-haiku-4-5', system, messages: anthropicMsgs, max_tokens: maxTokens }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Anthropic HTTP ${res.status}`) }
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.[0]?.text || ''
}

// ─── OpenAI-compatible (Groq, OpenRouter, Fireworks) ─────────────────────
async function callOpenAICompat({ endpoint, apiKey, system, messages, maxTokens, files, model, jsonMode = false, extraHeaders = {} }) {
  let fileCtx = ''
  if (files?.length > 0) {
    fileCtx = files.filter(f => f.type === 'text').map(f => `[Doc: ${f.name}]\n${f.text}`).join('\n\n')
    const n = files.filter(f => f.type !== 'text').length
    if (n > 0) fileCtx += `\n\n[Note: ${n} image/PDF file(s) not supported by this provider.]`
  }
  const msgs = [
    { role: 'system', content: system + (fileCtx ? `\n\n${fileCtx}` : '') },
    ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: typeof m.content === 'string' ? m.content : '' })),
  ]
  const body = { model, messages: msgs, max_tokens: maxTokens, temperature: 0.7 }
  if (jsonMode) body.response_format = { type: 'json_object' }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify(body),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`) }
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices?.[0]?.message?.content || ''
}

// ─── Pollinations (legacy, tidak stabil) ─────────────────────────────────
async function callPollinations({ system, messages }) {
  const msgs = [{ role: 'system', content: system }, ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content || '' }))]
  const res = await fetch('https://text.pollinations.ai/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs, model: 'openai' }) })
  if (!res.ok) throw new Error(`Demo error: HTTP ${res.status}`)
  const text = await res.text()
  if (text.includes('IMPORTANT NOTICE') || text.includes('being deprecated')) throw new Error('Mode demo tidak tersedia. Gunakan API key Gemini (gratis).')
  if (!text || text.trim().length < 5) throw new Error('Demo tidak merespons.')
  return text
}

// ─── Main entry point ─────────────────────────────────────────────────────
export async function callAI({ apiKey, system, messages, maxTokens = 2000, files = [], model, mode }) {
  const provider = detectProvider(apiKey)
  const jsonMode = mode === 'predict' || mode === 'predict_one'

  switch (provider) {
    case 'cloudflare':
      return callCloudflareWorker({ system, messages, maxTokens })

    case 'gemini':
      return callGemini({ apiKey, system, messages, maxTokens, files, model: model || 'gemini-2.5-flash-lite' })

    case 'groq':
      // Model aktif per April 2026: llama-3.1-8b-instant (pengganti gemma2-9b-it yang deprecated Agu 2025)
      // llama-3.3-70b-versatile tersedia tapi lebih lambat dan punya rate limit lebih ketat
      return callOpenAICompat({
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey, system, messages, maxTokens, files,
        model: model || 'llama-3.1-8b-instant',
        jsonMode,
      })

    case 'openrouter':
      // OpenRouter gateway — model gratis yang direkomendasikan:
      // meta-llama/llama-3.1-8b-instruct:free, google/gemma-3-4b-it:free, qwen/qwen3-8b:free
      // Kimi (Moonshot): moonshotai/kimi-k2 via OpenRouter
      return callOpenAICompat({
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey, system, messages, maxTokens, files,
        model: model || 'meta-llama/llama-3.1-8b-instruct:free',
        jsonMode,
        extraHeaders: { 'HTTP-Referer': 'https://interviewai.my.id', 'X-Title': 'Interview Coach AI' },
      })

    case 'anthropic':
      // Claude — berbayar, format API berbeda dari OpenAI
      return callAnthropic({ apiKey, system, messages, maxTokens, model: model || 'claude-haiku-4-5' })

    case 'fireworks':
      return callOpenAICompat({
        endpoint: 'https://api.fireworks.ai/inference/v1/chat/completions',
        apiKey, system, messages, maxTokens, files,
        model: model || 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        jsonMode,
      })

    case 'pollinations':
      return callPollinations({ system, messages })

    case 'no_key':
      throw new Error('Belum memilih AI. Buka Pengaturan AI dan pilih provider.')

    case 'unknown':
    default:
      throw new Error('API key tidak dikenal. Prefix key tidak cocok dengan provider yang didukung. Periksa kembali key kamu.')
  }
}

// ─── JSON parsers ─────────────────────────────────────────────────────────
export function parseQuestionsJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    if (s !== -1 && e !== -1) return JSON.parse(clean.slice(s, e + 1)).map(i => ({ q:i.q||'', tip:i.tip||'', answer:i.answer||'', warning:i.warning||'' }))
  } catch {}
  const m = [...clean.matchAll(/\{\s*"q"\s*:\s*"([\s\S]*?)"\s*,\s*"tip"\s*:\s*"([\s\S]*?)"\s*,\s*"answer"\s*:\s*"([\s\S]*?)"[\s\S]*?\}/g)]
  if (m.length > 0) return m.map(x => ({ q:x[1].replace(/"/g,"'").trim(), tip:x[2].replace(/"/g,"'").trim(), answer:x[3].replace(/"/g,"'").trim(), warning:'' }))
  throw new Error('Format respons AI tidak valid. Coba generate ulang.')
}

export function parseOneQuestionJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
    if (s !== -1 && e !== -1) { const p = JSON.parse(clean.slice(s, e+1)); return { q:p.q||'', tip:p.tip||'', answer:p.answer||'', warning:p.warning||'' } }
    const as = clean.indexOf('['), ae = clean.lastIndexOf(']')
    if (as !== -1 && ae !== -1) { const a = JSON.parse(clean.slice(as, ae+1)); if (a.length) return { q:a[0].q||'', tip:a[0].tip||'', answer:a[0].answer||'', warning:a[0].warning||'' } }
  } catch {}
  throw new Error('Format respons AI tidak valid. Coba ulang.')
}

// ─── File helpers ─────────────────────────────────────────────────────────
export function readFileAsBase64(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file) })
}
export function readFileAsText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file) })
}
export async function processUploadedFile(file) {
  const name = file.name, mime = file.type
  if (mime.startsWith('image/')) { const data = await readFileAsBase64(file); return { name, type:'image', mediaType:mime, data } }
  if (mime === 'application/pdf') { const data = await readFileAsBase64(file); return { name, type:'pdf', mediaType:mime, data } }
  const text = await readFileAsText(file); return { name, type:'text', text }
}
