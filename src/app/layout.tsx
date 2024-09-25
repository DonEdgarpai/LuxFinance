import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LuxFinance',
  description: 'Tu aplicación de control de gastos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="bg-black text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}