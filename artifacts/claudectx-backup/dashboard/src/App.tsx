import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
import ProjectTabBar from './components/ProjectTabBar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

interface OpenTab {
  id: string
  name: string
  type: 'project' | 'session'
  projectId?: string
}

export default function App() {
  useKeyboardShortcuts()
  const navigate = useNavigate()

  // Load open tabs from localStorage
  const [openTabs, setOpenTabs] = useState<OpenTab[]>(() => {
    const saved = localStorage.getItem('openTabs')
    return saved ? JSON.parse(saved) : []
  })

  // Save to localStorage whenever openTabs changes
  useEffect(() => {
    localStorage.setItem('openTabs', JSON.stringify(openTabs))
  }, [openTabs])

  // Function to add a tab
  const addTab = (id: string, name: string, type: 'project' | 'session', projectId?: string) => {
    setOpenTabs(prev => {
      console.log('addTab called:', { id, name, type, projectId, currentTabs: prev })

      // Check if already open
      if (prev.some(t => t.id === id && t.type === type)) {
        console.log('Tab already exists, skipping')
        return prev
      }

      // If opening a session and its project tab exists, replace the project tab
      if (type === 'session' && projectId) {
        const projectTabIndex = prev.findIndex(t => t.id === projectId && t.type === 'project')
        console.log('Looking for project tab:', projectId, 'found at index:', projectTabIndex)
        if (projectTabIndex !== -1) {
          const newTabs = [...prev]
          newTabs[projectTabIndex] = { id, name, type, projectId }
          console.log('Replaced project tab with session tab')
          return newTabs
        }
      }

      // If opening a project and a session from that project exists, replace the session tab
      if (type === 'project') {
        const sessionTabIndex = prev.findIndex(t => t.projectId === id && t.type === 'session')
        console.log('Looking for session tab from project:', id, 'found at index:', sessionTabIndex)
        if (sessionTabIndex !== -1) {
          const newTabs = [...prev]
          newTabs[sessionTabIndex] = { id, name, type }
          console.log('Replaced session tab with project tab')
          return newTabs
        }
      }

      // Add new tab
      console.log('Adding new tab')
      return [...prev, { id, name, type, projectId }]
    })
  }

  // Function to close a tab
  const closeTab = (id: string) => {
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.id !== id)
      // If closing the active tab, navigate to home or first tab
      const currentPath = window.location.pathname
      if (currentPath.includes(`/${id}`)) {
        if (filtered.length > 0) {
          const nextTab = filtered[filtered.length - 1]
          navigate(`/${nextTab.type}/${nextTab.id}`)
        } else {
          navigate('/')
        }
      }
      return filtered
    })
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Projects onOpenProject={(id, name) => addTab(id, name, 'project')} />} />
          <Route path="/project/:id" element={<ProjectDetail onOpenProject={(id, name) => addTab(id, name, 'project')} />} />
          <Route path="/project/:id/memory" element={<Memory />} />
          <Route path="/session/:id" element={<SessionDetail onOpenSession={(id, name, projectId) => addTab(id, name, 'session', projectId)} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/live" element={<Live />} />
          <Route path="/metrics" element={<MetricsDashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <ProjectTabBar openTabs={openTabs} onCloseTab={closeTab} />
      <ToastContainer />
      <KeyboardShortcutsHelp />
    </>
  )
}
