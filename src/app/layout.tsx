import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ops Weekly Tracker',
  description: 'ITL Operations Weekly Meeting Tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="dark">
      <body className={`${geist.variable} antialiased bg-[#0d0d0f] text-[#e4e4e7] min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
