import type { CapacitorConfig } from '@capacitor/cli'

// ManaKhata Android app: the static Next.js export (`npm run build:android`) in a native shell.
const config: CapacitorConfig = {
  appId: 'app.manakhata.household',
  appName: 'ManaKhata',
  webDir: 'out',
  server: {
    // Pages are served from https://localhost inside the WebView.
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
