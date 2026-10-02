// Builds the static web bundle for the Android app and syncs it into android/.
//
//   npm run build:android                                   -> offline demo app (no server needed)
//   NEXT_PUBLIC_API_URL=https://api.example.com npm run build:android  -> app talks to your API
//
// Works the same on Windows, macOS and Linux (no cross-env needed).
import { execSync } from 'node:child_process'
import { cpSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const apiUrl = process.env.NEXT_PUBLIC_API_URL
const env = {
  ...process.env,
  BUILD_TARGET: 'android',
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? (apiUrl ? 'false' : 'true'),
}

console.log(`[android] demo mode: ${env.NEXT_PUBLIC_DEMO_MODE}, API: ${apiUrl || '(none)'}`)
rmSync('out', { recursive: true, force: true })
execSync('npx next build', { stdio: 'inherit', env })
flattenRscPayloads('out')
execSync('npx cap sync android', { stdio: 'inherit', env })
console.log('[android] done. Open with `npx cap open android` or build an APK with `cd android && ./gradlew assembleDebug`.')

// The static export writes client-navigation payloads for route groups as nested
// folders (dashboard/__next.!KGRhc2hib2FyZCk/dashboard/__PAGE__.txt) while the router
// requests the dotted file name (dashboard/__next.!KGRhc2hib2FyZCk.dashboard.__PAGE__.txt).
// Without a matching file every in-app navigation falls back to a full page reload,
// so write a copy under the dotted name next to each nested payload.
function flattenRscPayloads(root) {
  let copied = 0
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (!statSync(full).isDirectory()) continue
      if (name.startsWith('__next.')) {
        const files = []
        const collect = (d, parts) => {
          for (const n of readdirSync(d)) {
            const f = join(d, n)
            if (statSync(f).isDirectory()) collect(f, [...parts, n])
            else files.push({ f, parts: [...parts, n] })
          }
        }
        collect(full, [])
        for (const { f, parts } of files) {
          cpSync(f, join(dir, [name, ...parts].join('.')))
          copied++
        }
      } else {
        walk(full)
      }
    }
  }
  walk(root)
  console.log(`[android] flattened ${copied} navigation payload file(s)`)
}
