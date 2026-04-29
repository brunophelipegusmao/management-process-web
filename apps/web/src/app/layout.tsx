import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '../style/globals.css'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/ThemeProvider'

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
})

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
})

export const metadata: Metadata = {
   title: 'Mulim Advogados Associados',
   description: 'Assessoria jurídica com seriedade e comprometimento.',
}

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode
}>) {
   return (
      <html
         lang="pt-BR"
         suppressHydrationWarning
         className={cn(
            'h-full antialiased',
            geistSans.variable,
            geistMono.variable,
            'font-sans',
         )}
      >
         <body className="min-h-full flex flex-col">
            <ThemeProvider>{children}</ThemeProvider>
         </body>
      </html>
   )
}
