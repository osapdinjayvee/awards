import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { LangProvider } from '@/hooks/use-lang'
import { router } from '@/routes'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-center" />
      </LangProvider>
    </QueryClientProvider>
  </StrictMode>,
)
