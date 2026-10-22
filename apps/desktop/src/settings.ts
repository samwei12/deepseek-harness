/**
 * Local Electron shell settings, loaded once per process independently of the Host.
 * Ownership: .agents/notes/implemented/architecture/2026-10-08-desktop-shell-configuration.md.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Resolved shell preferences; absent fields use the defaults without rewriting existing files. */
export interface DesktopSettings {
  readonly appearance: {
    readonly zoomFactor: number
  }
  readonly updates: {
    readonly allowTestAuthPopupWindow: boolean
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function zoomFactor(value: unknown): number {
  if (value === undefined) return 1
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.5 || value > 2) {
    throw new Error('appearance.zoomFactor must be a number between 0.5 and 2')
  }
  return value
}

/**
 * Save the main-window scale without replacing other fields or a settings symlink.
 * @param userData - Electron's userData directory.
 * @param factor - Scale between 0.5 and 2; 1 is 100 percent.
 * @throws When the value, existing document, or file write is invalid.
 */
export function writeDesktopZoomFactor(userData: string, factor: number): void {
  zoomFactor(factor)
  const path = join(userData, 'desktop', 'settings.json')
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!record(value) || (value.appearance !== undefined && !record(value.appearance))) {
    throw new Error(`${path}: expected a JSON object with an optional appearance object`)
  }
  value.appearance = { ...value.appearance, zoomFactor: factor }
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

/**
 * Read shell settings, creating the default document exclusively when missing.
 * @param userData - Electron's userData directory, independent of DSH_HOME.
 * @returns Validated settings, or defaults when reading, creating or validating fails; changes require a restart.
 */
export function readDesktopSettings(userData: string): DesktopSettings {
  const directory = join(userData, 'desktop')
  const path = join(directory, 'settings.json')
  const defaults: DesktopSettings = { appearance: { zoomFactor: 1 }, updates: { allowTestAuthPopupWindow: false } }
  try {
    let raw: string
    try { raw = readFileSync(path, 'utf8') } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      mkdirSync(directory, { recursive: true, mode: 0o700 })
      try { writeFileSync(path, `${JSON.stringify(defaults, null, 2)}\n`, { flag: 'wx', mode: 0o600 }) } catch (error) {
        // An existing document belongs to the user, including one created during initialization.
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }
      raw = readFileSync(path, 'utf8')
    }
    const value: unknown = JSON.parse(raw)
    if (!record(value) || (value.updates !== undefined && !record(value.updates))
      || (value.appearance !== undefined && !record(value.appearance))) {
      throw new Error('expected a JSON object with optional appearance and updates objects')
    }
    const allow = value.updates?.allowTestAuthPopupWindow
    if (allow !== undefined && typeof allow !== 'boolean') {
      throw new Error('updates.allowTestAuthPopupWindow must be true or false')
    }
    return { appearance: { zoomFactor: zoomFactor(value.appearance?.zoomFactor) }, updates: { allowTestAuthPopupWindow: allow ?? false } }
  } catch (error) {
    try {
      console.warn(`desktop settings: ${path}: using defaults because settings could not be loaded`, error)
    } catch (_logError) {
      // Diagnostic output is best effort; its failure must not make optional settings fatal.
      // TODO: Persist settings diagnostics when console output is unavailable, without blocking startup.
    }
    return defaults
  }
}
