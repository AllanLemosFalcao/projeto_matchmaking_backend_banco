import { createBrowserRouter } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { RotaProtegida } from './components/RotaProtegida'
import { Buscar } from './pages/Buscar'
import { Cadastro } from './pages/Cadastro'
import { Conversas } from './pages/Conversas'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { Perfil } from './pages/Perfil'
import { PlanosPagina } from './pages/PlanosPagina'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/cadastro', element: <Cadastro /> },
  {
    element: <RotaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'buscar', element: <Buscar /> },
          { path: 'perfil', element: <Perfil /> },
          { path: 'conversas/:matchId?', element: <Conversas /> },
          { path: 'planos', element: <PlanosPagina /> },
        ],
      },
    ],
  },
  { path: '*', element: <NaoEncontrada /> },
])
