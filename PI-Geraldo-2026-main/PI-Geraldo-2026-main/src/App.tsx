import { RouterProvider } from 'react-router'
import { AtualizacaoPWA } from './components/AtualizacaoPWA'
import { AuthProvider } from './contexts/AuthProvider'
import { router } from './routes'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <AtualizacaoPWA />
    </AuthProvider>
  )
}

export default App
