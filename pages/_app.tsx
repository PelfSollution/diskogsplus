import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter, JetBrains_Mono } from 'next/font/google'

// Tipografías (docs/design.md §3): Inter para todo, mono para A1, BPM y Camelot
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-mono', display: 'swap' })

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sans.variable} ${mono.variable} tw-font-sans`}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp
