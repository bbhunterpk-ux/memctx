import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import SessionDetail from './pages/SessionDetail'
import Search from './pages/Search'
import Live from './pages/Live'
import Memory from './pages/Memory'
import MetricsDashboard from './pages/MetricsDashboard'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import ToastContainer from './components/Toast'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  useKeyboardShortcuts()

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/project/:id/memory" element={<Memory />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/live" element={<Live />} />
          <Route path="/metrics" element={<MetricsDashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <ToastContainer />
      <KeyboardShortcutsHelp />
    </>
  )
}
