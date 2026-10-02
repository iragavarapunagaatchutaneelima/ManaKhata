import type { CapacitorConfig } from '@capacitor/cli'

// Kinfold Android app: the static Next.js export (`npm run build:android`) in a native shell.
const config: CapacitorConfig = {
  appId: 'app.kinfold.mobile',
  appName: 'Kinfold',
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
