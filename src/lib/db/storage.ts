import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const TMP_DIR = path.join(os.tmpdir(), 'boke-data')
const PROJECT_DIR = path.join(process.cwd(), '.data')

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function readJsonFile<T>(filename: string, defaultValue: T): T {
  const tmpPath = path.join(TMP_DIR, filename)
  const projPath = path.join(PROJECT_DIR, filename)

  // 1. Try /tmp first (runtime writes)
  ensureDir(TMP_DIR)
  if (fs.existsSync(tmpPath)) {
    try {
      return JSON.parse(fs.readFileSync(tmpPath, 'utf-8'))
    } catch {}
  }

  // 2. Try project .data/ (seed data committed to repo)
  if (fs.existsSync(projPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(projPath, 'utf-8'))
      // Copy to /tmp for faster subsequent access
      writeJsonFile(filename, data)
      return data
    } catch {}
  }

  return defaultValue
}

export function writeJsonFile<T>(filename: string, data: T): void {
  ensureDir(TMP_DIR)
  const tmpPath = path.join(TMP_DIR, filename)
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
}
