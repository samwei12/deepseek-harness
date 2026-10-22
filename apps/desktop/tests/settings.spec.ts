import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import * as fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, onTestFinished, vi } from 'vitest'
import { readDesktopSettings, writeDesktopZoomFactor } from '../src/settings.ts'

vi.mock('node:fs', async importOriginal => ({ ...await importOriginal<typeof import('node:fs')>() }))

beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { vi.restoreAllMocks() })

function fixture() {
  const userData = mkdtempSync(join(tmpdir(), 'dsh-desktop-settings-'))
  onTestFinished(() => { rmSync(userData, { recursive: true, force: true }) })
  const directory = join(userData, 'desktop')
  mkdirSync(directory)
  return { userData, path: join(directory, 'settings.json') }
}

it('creates a discoverable default file on first launch without touching other preferences', () => {
  const { userData, path } = fixture()
  rmSync(join(userData, 'desktop'), { recursive: true })
  writeFileSync(join(userData, 'keybindings.json'), 'existing shortcuts\n')
  const defaults = { appearance: { zoomFactor: 1 }, updates: { allowTestAuthPopupWindow: false } }
  expect(readDesktopSettings(userData)).toEqual(defaults)
  expect(readFileSync(path, 'utf8')).toBe(`${JSON.stringify(defaults, null, 2)}\n`)
  expect(readFileSync(join(userData, 'keybindings.json'), 'utf8')).toBe('existing shortcuts\n')
})

it.each(['{}', '{"updates": {}}', '{"other": 1, "updates": {"other": true}}'])('defaults an older document without rewriting it: %s', (raw) => {
  const { userData, path } = fixture()
  writeFileSync(path, raw)
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(readDesktopSettings(userData).appearance.zoomFactor).toBe(1)
  expect(readFileSync(path, 'utf8')).toBe(raw)
})

it('saves zoom through a symlink and preserves unrelated settings', () => {
  const { userData, path } = fixture()
  const target = join(userData, 'shared-settings.json')
  writeFileSync(target, JSON.stringify({ appearance: { custom: 'keep' }, updates: { allowTestAuthPopupWindow: true }, custom: 7 }))
  symlinkSync(target, path)
  writeDesktopZoomFactor(userData, 1.1)
  expect(lstatSync(path).isSymbolicLink()).toBe(true)
  expect(JSON.parse(readFileSync(target, 'utf8'))).toEqual({
    appearance: { custom: 'keep', zoomFactor: 1.1 }, updates: { allowTestAuthPopupWindow: true }, custom: 7,
  })
  expect(readDesktopSettings(userData).appearance.zoomFactor).toBe(1.1)
})

it.each([0, 0.49, 2.01, NaN, Infinity])('rejects zoom %s before changing the file', (factor) => {
  const { userData, path } = fixture()
  writeFileSync(path, '{}')
  expect(() => { writeDesktopZoomFactor(userData, factor) }).toThrow('appearance.zoomFactor')
  expect(readFileSync(path, 'utf8')).toBe('{}')
})

it.each(['null', '{', '{"appearance":[]}', '{"appearance":null}'])('preserves invalid settings when saving zoom: %s', (raw) => {
  const { userData, path } = fixture()
  writeFileSync(path, raw)
  expect(() => { writeDesktopZoomFactor(userData, 1.1) }).toThrow()
  expect(readFileSync(path, 'utf8')).toBe(raw)
})

it.each(['{"appearance":{"zoomFactor":"1.1"}}', '{"appearance":{"zoomFactor":0}}', '{"appearance":{"zoomFactor":3}}'])('reports invalid zoom and keeps the settings document: %s', (raw) => {
  const { userData, path } = fixture()
  writeFileSync(path, raw)
  expect(readDesktopSettings(userData).appearance.zoomFactor).toBe(1)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), expect.any(Error))
  expect(readFileSync(path, 'utf8')).toBe(raw)
})

it('loads explicit opt-in and opt-out on the next read without changing an earlier process snapshot', () => {
  const { userData, path } = fixture()
  for (const allow of [true, false]) {
    const raw = JSON.stringify({ updates: { allowTestAuthPopupWindow: allow }, custom: 'preserve' })
    writeFileSync(path, raw)
    expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(allow)
    expect(readFileSync(path, 'utf8')).toBe(raw)
  }
  const previous = readDesktopSettings(userData)
  writeFileSync(path, '{"updates":{"allowTestAuthPopupWindow":true}}')
  expect(previous.updates.allowTestAuthPopupWindow).toBe(false)
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(true)
})

it.each(['', '{', 'null', '[]', '{"updates":null}', '{"updates":[]}',
  '{"updates":{"allowTestAuthPopupWindow":"false"}}', '{"updates":{"allowTestAuthPopupWindow":1}}',
  '{"updates":{"allowTestAuthPopupWindow":null}}'])('reports invalid settings with their path and preserves the original: %s', (raw) => {
  const { userData, path } = fixture()
  writeFileSync(path, raw)
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), expect.any(Error))
  expect(readFileSync(path, 'utf8')).toBe(raw)
})

it('reports filesystem errors instead of replacing unreadable settings', () => {
  const { userData, path } = fixture()
  mkdirSync(path)
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), expect.any(Error))
  expect(fs.statSync(path).isDirectory()).toBe(true)
})

it.each(['mkdirSync', 'writeFileSync'] as const)('continues with disabled popups when %s fails', (operation) => {
  const { userData, path } = fixture()
  const failure = Object.assign(new Error('settings creation denied'), { code: 'EACCES' })
  vi.spyOn(fs, operation).mockImplementation(() => { throw failure })
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(path), failure)
})

it('continues with defaults even when warning output fails', () => {
  const { userData, path } = fixture()
  writeFileSync(path, '{')
  vi.mocked(console.warn).mockImplementation(() => { throw new Error('output unavailable') })
  expect(readDesktopSettings(userData).updates.allowTestAuthPopupWindow).toBe(false)
  expect(readFileSync(path, 'utf8')).toBe('{')
})
