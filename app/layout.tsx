import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Morse Decrypt App',
  description: 'Professional Morse code scanner and decryptor with Passkey security',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
