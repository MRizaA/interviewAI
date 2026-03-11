// ─── Storage helpers ──────────────────────────────────────────────────────
export const store = {
  get: (k, def = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  del: (k) => { try { localStorage.removeItem(k) } catch {} },
}

// ─── Build system prompt from profile ────────────────────────────────────
export function buildSystemPrompt(profile, mode = 'interview') {
  const {
    name, education, experience, skills, achievements,
    targetJob, targetCompany, interviewLang,
    struggles, aiPersona, extraContext,
  } = profile

  const lang = interviewLang || 'English'
  const candidateName = name || 'the candidate'
  const isFull = lang === 'English'
  const isIndo = lang === 'Bahasa Indonesia'
  const isMix  = lang === 'Both (campur)'

  const langRules = isFull ? `
=== LANGUAGE RULES (STRICT) ===
The interview language is ENGLISH. Follow these rules without exception:
- ALL your messages must be in English — greetings, questions, feedback, explanations, everything.
- Interview questions: in English.
- Feedback after answers: in English. Be specific about grammar and word choice.
- Improved answer version: in English, first person as ${candidateName}.
- If the candidate writes in Indonesian: still respond fully in English. Treat their Indonesian text as the content of their answer, rewrite it in English, and give feedback in English.
- Do NOT switch to Indonesian for any reason.
` : isIndo ? `
=== LANGUAGE RULES (STRICT) ===
The interview language is BAHASA INDONESIA. Follow these rules without exception:
- ALL your messages must be in Bahasa Indonesia — greetings, questions, feedback, explanations, everything.
- Interview questions: in Bahasa Indonesia.
- Feedback after answers: in Bahasa Indonesia.
- Improved answer version: in Bahasa Indonesia, first person as ${candidateName}.
- Do NOT switch to English for any reason.
` : `
=== LANGUAGE RULES (STRICT) ===
The interview language is MIXED (Bahasa Indonesia + English). Follow these rules without exception:
- Your conversational language (greetings, feedback, explanations, transitions): Bahasa Indonesia.
- Interview questions: in English, followed immediately by a short Indonesian translation in parentheses.
  Example: "Can you tell me about yourself?" (Ceritakan tentang dirimu)
- Feedback section: in Bahasa Indonesia.
- Improved answer version: in English (first person as ${candidateName}), then below it a brief Indonesian breakdown of key phrases used.
- If candidate writes in Indonesian: treat it as their intended answer, give feedback in Indonesian, write English version for them.
`

  const base = `You are ${aiPersona || 'a professional, encouraging interview coach'}.
${langRules}
=== CANDIDATE PROFILE ===
Name: ${candidateName}
Education: ${education || '-'}
Experience: ${experience || '-'}
Skills: ${skills || '-'}
Achievements: ${achievements || '-'}
Extra context / job description notes: ${extraContext || '-'}

=== TARGET APPLICATION ===
Position: ${targetJob || 'a job'}
Company: ${targetCompany || 'not specified'}

=== CANDIDATE STRUGGLES ===
${struggles || 'Often goes blank mid-sentence, forgets English sentence structure, struggles with connectors and articulating thoughts clearly.'}

If any documents (CV, job description, etc.) are attached, read them carefully and use that information throughout the entire conversation.
Always remember the full conversation history — if the candidate refers to a previous answer or asks for improvements, use that context.
`

  // ── Predict mode ──
  if (mode === 'predict') {
    const answerLang = isFull ? 'English' : isIndo ? 'Bahasa Indonesia' : 'English'
    return base + `
=== YOUR TASK: PREDICT INTERVIEW QUESTIONS ===
Based on the candidate profile and target position, generate 8 interview questions most likely to be asked.

STRICT JSON FORMAT — output ONLY a JSON array, nothing else, no markdown:
[{"q":"question","tip":"saran singkat bahasa Indonesia","answer":"contoh jawaban","phrases":["phrase 1","phrase 2"]}]

FIELD RULES:
- q: the interview question, following the language setting
- tip: max 20 words in Indonesian, specific advice for this candidate
- answer: a complete, ready-to-use example answer in ${answerLang}, first person as ${candidateName}. Use their actual background (name, education, experience, skills). 2-4 sentences, natural and confident. Use connectors. NO placeholder brackets like [nama] — use the actual profile data.
- phrases: exactly 2 connector phrases used in the answer (e.g. "In addition to that," / "One example of this is,")
- No double quotes inside string values — use single quotes or rephrase
- No newlines inside strings
- Output raw JSON only, no explanation`
  }

  // ── Interview mode (default) ──
  const feedbackLang  = isFull ? 'English' : 'Bahasa Indonesia'
  const questionLabel = isFull ? 'NEXT QUESTION' : isMix ? 'PERTANYAAN SELANJUTNYA (Next Question)' : 'PERTANYAAN SELANJUTNYA'
  const betterLabel   = isFull ? 'BETTER VERSION' : 'VERSI LEBIH BAIK'
  const phrasesLabel  = 'KEY PHRASES'

  return base + `
=== YOUR TASK: MOCK INTERVIEW ===

OPENING:
Greet ${candidateName} according to the language rules above.
Ask if they are ready to begin or if they have any questions first.
Keep it short — 2-3 sentences. Do NOT ask the first interview question yet.

WHEN CANDIDATE IS READY (says "mulai", "siap", "start", "yes", "ready", "iya", etc.):
Ask the first interview question relevant to ${targetJob} at ${targetCompany || 'the company'}, based on their profile and any documents provided.

AFTER EACH CANDIDATE ANSWER — respond with this structure:

🎯 FEEDBACK
[1-2 kind, specific notes in ${feedbackLang}: what was good, what can be improved — grammar, connectors, structure]

✨ ${betterLabel}
[Rewrite their answer in fluent ${isFull ? 'English' : isMix ? 'English' : 'Bahasa Indonesia'}. First person, as if YOU are ${candidateName}. Same content, better language.]
${isMix ? '[Below the English version, add a short Indonesian breakdown of 2-3 key phrases or connectors used]' : ''}

💡 ${phrasesLabel}
[2-3 useful connectors or phrases used, with ${isFull ? 'a brief explanation of usage' : 'Indonesian translation'}]
${isFull ? 'Format: "Furthermore, ..." — used to add a supporting point' : 'Format: "Furthermore, ..." → "Selain itu, ..."'}

➡️ ${questionLabel}
[Ask the next interview question — following language rules above]

FLEXIBLE REQUESTS — always help when candidate asks:
- Asks if their answer was good → review it honestly
- Asks for an example answer → give a complete ready-to-use answer for the last question
- Asks to repeat the question → repeat it
- Asks for next question → skip and ask next
- Any other prep request → use judgment to help them

Always be encouraging. Mistakes are how they improve.`
}

// ─── Call AI (Gemini) ──────────────────────────────────────────────────────
export async function callAI({ apiKey, system, messages, maxTokens = 2000, files = [], model = 'gemini-2.5-flash-lite' }) {
  const contents = []

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    const role = m.role === 'assistant' ? 'model' : 'user'
    const isLastUser = m.role === 'user' && i === messages.length - 1

    if (isLastUser && files.length > 0) {
      const parts = []
      for (const f of files) {
        if (f.type === 'image') {
          parts.push({ inlineData: { mimeType: f.mediaType, data: f.data } })
        } else if (f.type === 'pdf') {
          parts.push({ inlineData: { mimeType: 'application/pdf', data: f.data } })
        } else {
          parts.push({ text: `[Dokumen: ${f.name}]\n${f.text}` })
        }
      }
      parts.push({ text: typeof m.content === 'string' ? m.content : '' })
      contents.push({ role, parts })
    } else {
      contents.push({ role, parts: [{ text: typeof m.content === 'string' ? m.content : '' }] })
    }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
}

// ─── Robust JSON parser for predict responses ─────────────────────────────
export function parseQuestionsJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    if (start !== -1 && end !== -1) {
      return JSON.parse(clean.slice(start, end + 1))
    }
  } catch {}

  // Fallback regex — now also captures optional answer field
  const matches = [...clean.matchAll(/\{[^{}]*"q"\s*:\s*"([\s\S]*?)"[^{}]*"tip"\s*:\s*"([\s\S]*?)"[^{}]*"phrases"\s*:\s*\[([\s\S]*?)\][^{}]*\}/g)]
  if (matches.length > 0) {
    return matches.map(m => ({
      q: m[1].replace(/"/g, "'").trim(),
      tip: m[2].replace(/"/g, "'").trim(),
      answer: '',
      phrases: [...m[3].matchAll(/"([^"]+)"/g)].map(p => p[1]),
    }))
  }
  throw new Error('Format respons AI tidak valid. Coba generate ulang.')
}

// ─── File reader helpers ──────────────────────────────────────────────────
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result.split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsText(file)
  })
}

export async function processUploadedFile(file) {
  const name = file.name
  const mime = file.type
  if (mime.startsWith('image/')) {
    const data = await readFileAsBase64(file)
    return { name, type: 'image', mediaType: mime, data }
  }
  if (mime === 'application/pdf') {
    const data = await readFileAsBase64(file)
    return { name, type: 'pdf', mediaType: mime, data }
  }
  const text = await readFileAsText(file)
  return { name, type: 'text', text }
}
