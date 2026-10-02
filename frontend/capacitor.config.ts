import type { CapacitorConfig } from '@capacitor/cli'

// Android app shell around the static Next.js export (`npm run build:android`).
const config: CapacitorConfig = {
  appId: 'app.manakhata.household',
  appName: 'ManaKhata',
  webDir: 'out',
  server: {
    // Pages are served from https://localhost inside the WebView.
    androidScheme: 'https',
  },
  android: {
    // Only allow plain-HTTP APIs in debug builds (e.g. http://10.0.2.2:8080 on the emulator).
    allowMixedContent: false,
  },
}

export default config
