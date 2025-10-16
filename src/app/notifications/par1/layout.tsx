// app/layout.tsx
import './globals.css'

export const metadata = {
  title: 'Sistema de Solicitudes - Fixers',
  description: 'Sistema de gestión de solicitudes para Fixers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
