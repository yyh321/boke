import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DATA_DIR = path.join(os.tmpdir(), 'boke-data')

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch {
    // ignore parse errors
  }
  return defaultValue
}

export function writeJsonFile<T>(filename: string, data: T): void {
  ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
