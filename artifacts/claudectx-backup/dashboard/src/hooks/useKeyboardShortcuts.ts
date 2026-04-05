import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    let waitingForSecondKey = false

    function handleKeyPress(e: KeyboardEvent) {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Focus search
      if (e.key === '/') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        searchInput?.focus()
        return
      }

      // Close modals
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('close-modal'))
        return
      }

      // Show shortcuts help
      if (e.key === '?') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('show-shortcuts'))
        return
      }

      // Navigation with 'g' prefix
      if (e.key === 'g' && !waitingForSecondKey) {
        waitingForSecondKey = true

        const timeout = setTimeout(() => {
          waitingForSecondKey = false
        }, 1000)

        const handleNext = (e2: KeyboardEvent) => {
          clearTimeout(timeout)
          waitingForSecondKey = false

          if (e2.key === 'h') navigate('/')
          else if (e2.key === 's') navigate('/search')
          else if (e2.key === 'l') navigate('/live')
          else if (e2.key === 'm') navigate('/metrics')
          else if (e2.key === 'b') navigate('/memory')

          window.removeEventListener('keydown', handleNext)
        }

        window.addEventListener('keydown', handleNext)
        return
      }

      // J/K navigation (next/previous)
      if (e.key === 'j' || e.key === 'k') {
        const items = document.querySelectorAll('[data-keyboard-nav]')
        if (items.length === 0) return

        const focusedIndex = Array.from(items).findIndex(item =>
          item === document.activeElement || item.contains(document.activeElement)
        )

        let nextIndex = focusedIndex
        if (e.key === 'j') {
          nextIndex = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0
        } else {
          nextIndex = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1
        }

        const nextItem = items[nextIndex] as HTMLElement
        nextItem?.focus()
        nextItem?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigate])
}
