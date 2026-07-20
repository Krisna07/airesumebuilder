import { randomUUID } from 'crypto'
import type { ResumeData } from '@/types/types'

const SECTION_HEADERS = ['summary', 'skills', 'experience', 'education', 'projects', 'certifications']

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitLines(text: string) {
  const normalized = normalizeText(text)
  const withSectionBreaks = SECTION_HEADERS.reduce(
    (value, header) => value.replace(new RegExp(`\\b${header}\\b`, 'gi'), `\n${header.toUpperCase()}\n`),
    normalized,
  )

  return withSectionBreaks
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''
}

function extractPhone(text: string) {
  return text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] || ''
}

function extractLinks(text: string) {
  const matches = text.match(/(?:https?:\/\/|www\.)[^\s,]+/gi) || []
  return matches.slice(0, 4).map((url) => ({
    type: url.includes('linkedin') ? 'LinkedIn' : url.includes('github') ? 'GitHub' : 'Link',
    url: url.startsWith('http') ? url : `https://${url}`,
  }))
}

function extractName(lines: string[], email: string, phone: string) {
  const firstLine = lines[0] || ''
  if (email && firstLine.includes(email)) {
    const leadingText = firstLine.slice(0, firstLine.indexOf(email)).replace(/[^A-Za-z .'-]/g, ' ').replace(/\s+/g, ' ').trim()
    const leadingWords = leadingText.split(' ').filter(Boolean)
    if (leadingWords.length >= 2 && leadingWords.length <= 5) {
      return leadingText
    }
  }

  for (const line of lines) {
    if (line.includes('@') || line.includes(phone) || /^(summary|skills|experience|education)$/i.test(line)) {
      continue
    }

    const cleaned = line.replace(/[^A-Za-z .'-]/g, ' ').replace(/\s+/g, ' ').trim()
    const words = cleaned.split(' ').filter(Boolean)
    if (words.length >= 2 && words.length <= 5) {
      return cleaned
    }
  }

  return email ? email.split('@')[0].replace(/[._-]+/g, ' ') : 'Imported Resume'
}

function extractSection(lines: string[], sectionName: string) {
  const startIdx = lines.findIndex((line) => line.toLowerCase() === sectionName)
  if (startIdx === -1) return [] as string[]

  const collected: string[] = []
  for (let index = startIdx + 1; index < lines.length; index += 1) {
    const value = lines[index]
    if (SECTION_HEADERS.includes(value.toLowerCase())) {
      break
    }
    collected.push(value)
  }
  return collected
}

function extractSummary(lines: string[]) {
  const summaryLines = extractSection(lines, 'summary')
  if (summaryLines.length > 0) {
    return summaryLines.join(' ')
  }

  const proseLines = lines.filter((line) => !SECTION_HEADERS.includes(line.toLowerCase()) && !/@/.test(line))
  return proseLines.slice(1, 3).join(' ').slice(0, 400)
}

function extractSkillGroups(lines: string[]) {
  const skillLines = extractSection(lines, 'skills')
  const rawSkills = skillLines.length > 0 ? skillLines.join(', ') : lines.join(', ')
  const skills = rawSkills
    .split(/[|,]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 1 && value.length < 40)
    .filter((value) => !SECTION_HEADERS.includes(value.toLowerCase()))
    .filter((value) => !/@/.test(value))
    .slice(0, 16)

  return skills.length > 0 ? [{ type: 'Core Skills', skills }] : []
}

function buildRawContentSection(text: string) {
  return [{
    id: randomUUID(),
    title: 'Imported Content',
    subsections: [{
      id: randomUUID(),
      title: 'Raw Resume Text',
      content: text.slice(0, 5000),
    }],
  }]
}

export function buildResumeFallback(text: string): ResumeData {
  const normalized = normalizeText(text)
  const lines = splitLines(normalized)
  const email = extractEmail(normalized)
  const phone = extractPhone(normalized)
  const links = extractLinks(normalized)
  const fullname = extractName(lines, email, phone)
  const summary = extractSummary(lines)
  const skills = extractSkillGroups(lines)

  return {
    id: '',
    userId: '',
    title: fullname ? `${fullname} Resume` : 'Imported Resume',
    template: 'modern',
    profile: {
      fullname,
      email,
      phone,
      location: '',
      links,
      summary,
    },
    skills,
    experiences: [],
    educations: [],
    customSections: buildRawContentSection(normalized),
  }
}