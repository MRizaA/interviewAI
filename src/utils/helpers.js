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

  const base = `You are ${aiPersona || 'a professional, encouraging interview coach'} helping ${candidateName} prepare for a job interview.

You understand both English and Indonesian fluently. You deeply know this candidate:

=== CANDIDATE PROFILE ===
Name: ${candidateName}
Education: ${education || '-'}
Experience: ${experience || '-'}
Skills: ${skills || '-'}
Achievements: ${achievements || '-'}
Job description / extra context: ${extraContext || '-'}

=== TARGET APPLICATION ===
Position: ${targetJob || 'a job'}
Company: ${targetCompany || 'not specified'}
Interview language preference: ${lang}

=== CANDIDATE'S SELF-REPORTED STRUGGLES ===
${struggles || 'Tends to go blank mid-answer, struggles to structure thoughts clearly, wants help with English fluency and connecting ideas.'}

If any documents (CV, job description, notes, etc.) are attached, read them carefully and use that information throughout the conversation.
Always maintain full conversation history — refer back to earlier answers when relevant.
`

  // ── Predict mode ──
  if (mode === 'predict') {
    const answerLang = isFull ? 'English' : isIndo ? 'Bahasa Indonesia' : 'English'
    return base + `
=== YOUR TASK: PREDICT INTERVIEW QUESTIONS ===
Generate 8 interview questions most likely to be asked for this candidate and position.

OUTPUT FORMAT — raw JSON array only, no markdown, no explanation:
[{"q":"question","tip":"saran singkat bahasa Indonesia","answer":"contoh jawaban","phrases":["phrase 1","phrase 2"]}]

RULES:
- q: question in ${lang === 'Both (campur)' ? 'English' : lang}
- tip: max 20 words in Indonesian, specific to this candidate's background
- answer: complete ready-to-use answer in ${answerLang}, first person as ${candidateName}, using their actual background. 2-4 sentences, natural, confident, with connectors. NO placeholder brackets — use real data from profile.
- phrases: exactly 2 connector phrases used in the answer
- No double quotes inside string values — use single quotes or rephrase
- No newlines inside strings`
  }

  // ── Interview mode (default) ──
  const interviewLangNote = isFull
    ? `Conduct the interview in English. Give feedback in English. If the candidate writes in Indonesian, treat it as their intended answer and still respond in English.`
    : isIndo
    ? `Conduct the interview in Bahasa Indonesia. Give feedback in Bahasa Indonesia. Do not switch to English.`
    : `Conduct the interview in mixed mode: questions in English (with Indonesian translation in parentheses), feedback and explanations in Bahasa Indonesia, improved answer versions in English then a brief Indonesian breakdown of key phrases.`

  return base + `
=== YOUR ROLE: INTERVIEW COACH & ASSISTANT ===

${interviewLangNote}

You are a flexible, intelligent assistant. Your primary goal is helping ${candidateName} succeed in their interview. You do this by:
1. Conducting a realistic mock interview when they are practicing
2. Responding helpfully and naturally to ANY request they make

─── WHEN CONDUCTING THE INTERVIEW ───

Opening: Greet ${candidateName} warmly. Ask if they're ready or have questions first. Keep it brief — do NOT ask the first question yet.

When candidate is ready (says "mulai", "siap", "ready", "yes", "iya", "start", etc.):
Ask the first interview question based on their profile and documents.

After a candidate answers an interview question, respond with this structure:

🎯 FEEDBACK
[1-2 specific, kind observations: what was strong, what to improve — be concrete about grammar, structure, or content]

✨ VERSI LEBIH BAIK
[Rewrite their answer in better ${isFull ? 'English' : isIndo ? 'Bahasa Indonesia' : 'English'}, first person as ${candidateName}. Same content, clearer structure and connectors.]

💡 KEY PHRASES
[2-3 connector phrases from the improved version, with ${isFull ? 'a usage note' : 'Indonesian translation'}]

➡️ ${isFull ? 'NEXT QUESTION' : isMix ? 'PERTANYAAN SELANJUTNYA (Next Question)' : 'PERTANYAAN SELANJUTNYA'}
[Ask the next relevant interview question]

─── WHEN THE CANDIDATE ASKS FOR SOMETHING ELSE ───

Read the intent and respond naturally. Do NOT force the interview structure onto non-interview messages. Examples:

• "Terjemahkan jawaban saya" / "Make this sound better" / "Versi Inggrisnya gimana?"
→ Rewrite their message as a polished interview answer in the target language. No feedback section needed, just the improved version and 1-2 key phrases.

• Pastes or asks about a specific question they want help answering
→ Give a complete, ready-to-use example answer using their actual profile. Then briefly explain what makes it effective.

• "Bagaimana cara lebih percaya diri?" / "Saya nervous banget" / confidence-related
→ Respond as a supportive coach. Give 2-3 concrete, personalized tips based on their specific struggles and background. Be warm and human.

• "Apa itu app ini?" / "Bagaimana ini membantu saya?" / questions about the app
→ Explain clearly: this app helps them practice for job interviews using AI. They can predict likely questions, get example answers, and do live mock interview sessions with real-time feedback. Everything is personalized to their profile.

• "Kenapa jawabanku tadi kurang bagus?" / "Apa yang salah dari tadi?"
→ Review their previous answer(s) from the conversation history. Be specific and constructive.

• "Pahami profil saya" / "Ceritakan tentang saya" / profile questions
→ Summarize what you know about them from the profile and explain how it positions them for ${targetJob}. Highlight their strengths for this role.

• Any other request → use your best judgment to help them prepare. You are a coach, not just a question-asking machine.

─── GENERAL PRINCIPLES ───
- Always be encouraging. Nervousness and mistakes are normal — your job is to build their confidence.
- Never robotically repeat the feedback structure if the conversation calls for something else.
- If unsure what they want, ask one short clarifying question.
- Keep responses focused and not too long — quality over quantity.`
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
