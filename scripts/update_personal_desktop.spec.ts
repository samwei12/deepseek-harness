import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { COVERAGE_TEST_TIMEOUT_ENV, parseCoverageTestTimeout } from './coverage-partitions.ts'

const updater = fileURLToPath(new URL('./update_personal_desktop.mjs', import.meta.url))
const fixtures: { directory: string; children: ChildProcess[] }[] = []
// Real Git setup and process exits must fit outside the updater's 30-second stop deadline.
const integrationTimeout = Math.max(60_000, parseCoverageTestTimeout(process.env[COVERAGE_TEST_TIMEOUT_ENV]) ?? 0)

afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    await Promise.all(fixture.children.map(async (child) => {
      if (child.exitCode !== null || child.signalCode !== null) return
      const exited = once(child, 'exit')
      const force = setTimeout(() => { child.kill('SIGKILL') }, 1_000)
      child.kill('SIGTERM')
      try { await exited } finally { clearTimeout(force) }
    }))
    rmSync(fixture.directory, { recursive: true, force: true })
  }
}, integrationTimeout)

function write(path: string, source: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, source)
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'dsh-desktop-update-'))
  const children: ChildProcess[] = []
  fixtures.push({ directory, children })
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
  const git = (cwd: string, ...args: string[]): string => {
    const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' })
    if (result.status !== 0) throw new Error(result.stderr)
    return result.stdout.trim()
  }
  const origin = join(directory, 'origin.git')
  const seed = join(directory, 'seed')
  let root = join(directory, 'checkout with spaces')
  mkdirSync(seed)
  git(directory, 'init', '--bare', origin)
  git(seed, 'init', '-b', 'master')
  git(seed, 'config', 'user.name', 'Fixture')
  git(seed, 'config', 'user.email', 'fixture@example.invalid')
  write(join(seed, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-root' }))
  write(join(seed, '.gitignore'), 'apps/desktop/.desktop-build/\napps/cli/lib/\n')
  git(seed, 'add', '.')
  git(seed, 'commit', '-m', 'initial')
  git(seed, 'remote', 'add', 'origin', origin)
  git(seed, 'push', '-u', 'origin', 'master')
  git(directory, 'clone', origin, root)
  root = realpathSync(root)
  const before = git(root, 'rev-parse', 'HEAD')
  write(join(seed, 'updated.txt'), 'new source\n')
  git(seed, 'add', '.')
  git(seed, 'commit', '-m', 'update')
  git(seed, 'push')
  const target = git(seed, 'rev-parse', 'HEAD')
  const appRoot = join(root, 'apps/desktop')
  const bundle = join(appRoot, '.desktop-build/development/Harness Dev.app')
  const stamp = join(bundle, 'Contents/Resources/dsh-development.json')
  const settings = { home: join(directory, 'private home'), userData: join(directory, 'browser data'),
    mainPort: 24449, rendererPort: 24442, hostPort: 24440, openDevtools: '0' }
  write(stamp, JSON.stringify(settings))
  const trace = join(directory, 'trace.jsonl')
  const bin = join(directory, 'bin')
  const pnpm = join(bin, 'pnpm')
  write(pnpm, `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2).join(' ');
fs.appendFileSync(process.env.UPDATE_TEST_TRACE, JSON.stringify({step:args, home:process.env.DSH_HOME, renderer:process.env.DSH_DESKTOP_RENDERER_DEBUG_PORT})+'\\n');
if (args === 'run build' && process.env.UPDATE_TEST_BUILD_FAIL === '1') process.exit(7);
if (args === 'run start:desktop') console.log('dsh web: http://127.0.0.1:40000/?token=fixture-secret');
`)
  chmodSync(pnpm, 0o755)
  write(join(root, 'apps/cli/lib/bin.js'), "console.log('fixture-version');\n")
  const environment = { ...env, PATH: `${bin}:${env.PATH ?? ''}`, UPDATE_TEST_TRACE: trace }
  const lines = () => readFileSync(trace, 'utf8').trim().split('\n').map(line => JSON.parse(line) as {
    step: string
    home?: string
    renderer?: string
  })
  const update = (extra: NodeJS.ProcessEnv = {}) => new Promise<{
    code: number | null
    stdout: string
    stderr: string
  }>((resolve, reject) => {
    const child = spawn(process.execPath, [updater], { cwd: root, env: { ...environment, ...extra } })
    children.push(child)
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += String(chunk) })
    child.stderr.on('data', (chunk) => { stderr += String(chunk) })
    child.once('error', reject)
    child.once('close', (code) => { resolve({ code, stdout, stderr }) })
  })
  const desktop = async (ignoreShellTermination = false) => {
    const electron = join(bundle, 'Contents/MacOS/Electron')
    mkdirSync(dirname(electron), { recursive: true })
    symlinkSync(process.execPath, electron)
    const host = join(directory, 'node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js')
    write(host, `const fs=require('node:fs');
process.on('SIGTERM',()=>{fs.appendFileSync(process.env.UPDATE_TEST_TRACE,JSON.stringify({step:'host-stop'})+'\\n');process.exit(0)});
process.send('ready');setInterval(()=>{},1000);
`)
    const main = join(directory, 'fake_shell.cjs')
    write(main, `const fs=require('node:fs');const {spawn}=require('node:child_process');
const child=spawn(${JSON.stringify(electron)},[${JSON.stringify(host)}],{stdio:['ignore','ignore','ignore','ipc']});
child.on('message',()=>{process.send('ready')});
const finish=()=>{fs.appendFileSync(process.env.UPDATE_TEST_TRACE,JSON.stringify({step:'shell-stop'})+'\\n');process.exit(0)};
process.on('SIGTERM',()=>{if(child.exitCode!==null||child.signalCode!==null){if(process.env.UPDATE_TEST_IGNORE_TERM!=='1')finish()}else{child.once('exit',finish);child.kill('SIGTERM')}});
setInterval(()=>{},1000);
`)
    const child = spawn(electron, [main, appRoot], {
      env: { ...environment, UPDATE_TEST_IGNORE_TERM: ignoreShellTermination ? '1' : '0' },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    })
    children.push(child)
    await once(child, 'message')
    return child
  }
  return { directory, root, before, target, git, settings, stamp, lines, update, desktop, children }
}

// The production entry owns macOS's .app process layout and POSIX termination.
describe.skipIf(process.platform !== 'darwin')('personal desktop command-line update', () => {
  it('stops its Host before its shell, preserves another process, fast-forwards and rebuilds without UI', async () => {
    const test = fixture()
    const app = await test.desktop()
    const otherElectron = join(test.directory, 'unrelated/Harness Dev.app/Contents/MacOS/Electron')
    mkdirSync(dirname(otherElectron), { recursive: true })
    symlinkSync(process.execPath, otherElectron)
    const unrelated = spawn(otherElectron, ['-e', 'process.send("ready");setInterval(()=>{},1000)'], {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    })
    test.children.push(unrelated)
    await once(unrelated, 'message')
    const result = await test.update()
    expect(result.code, result.stderr).toBe(0)
    expect(test.git(test.root, 'rev-parse', 'HEAD')).toBe(test.target)
    expect(test.lines().map(row => row.step)).toEqual(['host-stop', 'shell-stop', 'install --frozen-lockfile', 'run build', 'run start:desktop'])
    expect(test.lines().at(-1)).toMatchObject({ home: test.settings.home, renderer: String(test.settings.rendererPort) })
    expect(result.stdout).toContain('fixture-version')
    expect(result.stdout).toContain('token=[redacted]')
    expect(result.stdout).not.toContain('fixture-secret')
    expect(app.exitCode ?? app.signalCode).not.toBeNull()
    expect(unrelated.exitCode).toBeNull()
    expect(unrelated.signalCode).toBeNull()
  }, integrationTimeout)

  it('leaves a running desktop untouched when source has uncommitted changes', async () => {
    const test = fixture()
    const app = await test.desktop()
    write(join(test.root, 'package.json'), '{"name":"@deepseek-ai/dsh-root","changed":true}')
    const result = await test.update()
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('nothing was stopped')
    expect(app.exitCode).toBeNull()
    expect(app.signalCode).toBeNull()
    expect(test.git(test.root, 'rev-parse', 'HEAD')).toBe(test.before)
  }, integrationTimeout)

  it('force-stops only an unresponsive shell after its Host has exited', async () => {
    const test = fixture()
    const app = await test.desktop(true)
    const result = await test.update()
    expect(result.code, result.stderr).toBe(0)
    expect(result.stdout).toContain('Host exited; force-stopping unresponsive Electron shell')
    expect(test.lines().map(row => row.step)).toEqual(['host-stop', 'install --frozen-lockfile', 'run build', 'run start:desktop'])
    expect(app.signalCode).toBe('SIGKILL')
  }, integrationTimeout)

  it('refuses divergent history before stopping the existing desktop', async () => {
    const test = fixture()
    const app = await test.desktop()
    test.git(test.root, 'config', 'user.name', 'Fixture')
    test.git(test.root, 'config', 'user.email', 'fixture@example.invalid')
    write(join(test.root, 'local.txt'), 'local\n')
    test.git(test.root, 'add', '.')
    test.git(test.root, 'commit', '-m', 'local')
    const result = await test.update()
    expect(result.code).toBe(1)
    expect(app.exitCode).toBeNull()
    expect(app.signalCode).toBeNull()
  }, integrationTimeout)

  it('stops at a failed build without launching an unverified application', async () => {
    const test = fixture()
    await test.desktop()
    const result = await test.update({ UPDATE_TEST_BUILD_FAIL: '1' })
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('update stopped')
    expect(test.lines().map(row => row.step)).toEqual(['host-stop', 'shell-stop', 'install --frozen-lockfile', 'run build'])
  }, integrationTimeout)

  it('updates an already stopped, current checkout through the same command', async () => {
    const test = fixture()
    expect((await test.update()).code).toBe(0)
    expect((await test.update()).code).toBe(0)
    expect(test.lines().filter(row => row.step === 'run start:desktop')).toHaveLength(2)
  }, integrationTimeout)

  it('preserves committed local changes when the tracking branch is already an ancestor', async () => {
    const test = fixture()
    test.git(test.root, 'fetch')
    test.git(test.root, 'merge', '--ff-only', test.target)
    test.git(test.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'local')
    const head = test.git(test.root, 'rev-parse', 'HEAD')
    expect((await test.update()).code).toBe(0)
    expect(test.git(test.root, 'rev-parse', 'HEAD')).toBe(head)
  }, integrationTimeout)
})
