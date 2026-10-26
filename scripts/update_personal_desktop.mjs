#!/usr/bin/env node
/** Update this fork's existing macOS development app from an external terminal. */
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { setTimeout } from 'node:timers/promises'
import { parseArgs } from 'node:util'

function output(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function processes() {
  return output('ps', ['-axo', 'pid=,ppid=,command=']).split('\n').map(line => {
    const match = /^\s*(\d+)\s+(\d+)\s+(.+)$/.exec(line)
    if (match === null) throw new Error('Cannot read the process table')
    return { pid: Number(match[1]), parent: Number(match[2]), command: match[3] }
  })
}

function belongsTo(row, parent, rows) {
  const visited = new Set()
  while (!visited.has(row.pid)) {
    visited.add(row.pid)
    if (row.parent === parent) return true
    row = rows.find(candidate => candidate.pid === row.parent)
    if (row === undefined) return false
  }
  return false
}

function isMain(row, appRoot, executable) {
  return row.command.startsWith(`${executable} `) && row.command.endsWith(` ${appRoot}`)
}

function isHost(row) {
  return row.command.includes('/@deepseek-ai/dsh-desktop-host/lib/index.js')
}

async function terminate(row, shell = false) {
  const sameProcess = () => processes().some(item => item.pid === row.pid && item.command === row.command)
  if (!sameProcess()) return
  console.log(`Stopping DSH process ${row.pid} with SIGTERM`)
  try { process.kill(row.pid, 'SIGTERM') } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
  let deadline = Date.now() + (shell ? 5_000 : 30_000)
  let forced = false
  while (sameProcess()) {
    if (Date.now() >= deadline) {
      if (!shell || forced) throw new Error(`DSH process ${row.pid} has not exited; update stopped`)
      const rows = processes()
      if (rows.some(candidate => isHost(candidate) && belongsTo(candidate, row.pid, rows))) {
        throw new Error('A Host is still running; refusing to force-stop the Electron shell')
      }
      console.log(`Host exited; force-stopping unresponsive Electron shell ${row.pid}`)
      process.kill(row.pid, 'SIGKILL')
      forced = true
      deadline = Date.now() + 5_000
    }
    await setTimeout(100)
  }
}

async function stopDesktop(appRoot, executable) {
  const rows = processes()
  const mains = rows.filter(row => isMain(row, appRoot, executable))
  if (mains.length > 1) throw new Error('Multiple DSH main processes use this checkout; update stopped')
  const main = mains[0]
  if (main === undefined) return
  const caller = rows.find(row => row.pid === process.pid)
  if (caller !== undefined && belongsTo(caller, main.pid, rows)) {
    throw new Error('Run the updater from an external terminal, outside the DSH being updated')
  }
  const children = rows.filter(row => belongsTo(row, main.pid, rows))
  const hosts = children.filter(isHost)
  // The Host's existing SIGTERM handler disposes the profile before exiting.
  for (const host of hosts) await terminate(host)
  await terminate(main, true)
  const deadline = Date.now() + 10_000
  for (;;) {
    const remaining = processes().filter(row => isMain(row, appRoot, executable)
      || children.some(child => child.pid === row.pid && child.command === row.command))
    if (remaining.length === 0) return
    if (Date.now() >= deadline) throw new Error(`DSH processes remain: ${remaining.map(row => row.pid).join(', ')}; update stopped`)
    await setTimeout(100)
  }
}

function launchEnvironment(stamp) {
  const settings = JSON.parse(readFileSync(stamp, 'utf8'))
  if (settings === null || typeof settings !== 'object') throw new Error('Invalid development app settings')
  const environment = { ...process.env }
  for (const [field, key] of [
    ['home', 'DSH_HOME'], ['userData', 'DSH_DESKTOP_USER_DATA_DIR'],
    ['openDevtools', 'DSH_DESKTOP_OPEN_DEVTOOLS'],
    ['mainPort', 'DSH_DESKTOP_MAIN_INSPECT_PORT'], ['rendererPort', 'DSH_DESKTOP_RENDERER_DEBUG_PORT'],
    ['hostPort', 'DSH_DESKTOP_HOST_INSPECT_PORT'],
  ]) {
    const value = settings[field]
    if (field.endsWith('Port')) {
      if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) throw new Error(`Invalid saved ${field}`)
    } else if (typeof value !== 'string' || value === '') throw new Error(`Invalid saved ${field}`)
    if (environment[key] === undefined) environment[key] = String(value)
  }
  return environment
}

async function run(command, args, cwd, env = process.env) {
  console.log(`Running: ${command} ${args.join(' ')}`)
  const child = spawn(command, args, { cwd, env, stdio: ['inherit', 'pipe', 'pipe'] })
  for (const [stream, destination] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    const reader = createInterface({ input: stream })
    reader.on('line', line => { destination.write(`${line.replace(/([?&]token=)[^\s&]+/g, '$1[redacted]')}\n`) })
  }
  await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} failed: ${signal ?? code}; update stopped`))
    })
  })
}

async function main() {
  const { values } = parseArgs({ options: { ref: { type: 'string' }, help: { type: 'boolean' } } })
  if (values.help) {
    console.log('Usage: node scripts/update_personal_desktop.mjs [--ref <revision>]\nRun in the DSH checkout, outside DSH itself. Defaults to the configured tracking branch.\nStops this checkout\'s DSH, fast-forwards clean source, installs locked dependencies, builds and launches.\nThe final official launcher stays in the foreground until DSH exits.')
    return
  }
  if (process.platform !== 'darwin') throw new Error('This updater owns the existing macOS Harness Dev.app only')
  const root = output('git', ['rev-parse', '--show-toplevel'], process.cwd())
  const git = args => output('git', args, root)
  if (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name !== '@deepseek-ai/dsh-root') {
    throw new Error('Run this command in the deepseek-harness checkout')
  }
  if (git(['status', '--porcelain']) !== '') throw new Error('Commit or preserve local changes before updating; nothing was stopped')
  const appRoot = join(root, 'apps/desktop')
  const bundle = join(appRoot, '.desktop-build/development/Harness Dev.app')
  const environment = launchEnvironment(join(bundle, 'Contents/Resources/dsh-development.json'))
  const before = git(['rev-parse', 'HEAD'])
  await run('git', ['fetch'], root)
  let target = git(['rev-parse', '--verify', `${values.ref ?? '@{upstream}'}^{commit}`])
  const ancestor = (base, tip) => {
    try { git(['merge-base', '--is-ancestor', base, tip]); return true } catch (error) {
      if (error.status === 1) return false
      throw error
    }
  }
  if (!ancestor(before, target)) {
    if (values.ref === undefined && ancestor(target, before)) target = before
    else throw new Error('Target is not a fast-forward; merge source separately before updating. Nothing was stopped')
  }
  console.log(`Source before update: ${before}\nTarget source: ${target}`)
  await stopDesktop(appRoot, join(bundle, 'Contents/MacOS/Electron'))
  if (git(['status', '--porcelain']) !== '') throw new Error('Source changed during shutdown; update stopped')
  await run('git', ['merge', '--ff-only', '--no-stat', target], root)
  await run('pnpm', ['install', '--frozen-lockfile'], root)
  await run('pnpm', ['run', 'build'], root)
  await run(process.execPath, [join(root, 'apps/cli/lib/bin.js'), '--version'], root)
  console.log(`Build verified at ${target}; launching with the existing home and desktop preferences`)
  await run('pnpm', ['run', 'start:desktop'], root, environment)
}

await main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
