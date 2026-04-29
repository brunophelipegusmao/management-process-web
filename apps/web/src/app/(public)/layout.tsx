import Header from '@/components/Header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
   return (
      <>
         <Header />
         <main className="flex-1 pt-16 md:pt-20">{children}</main>
      </>
   )
}
