import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export function useTheme() {
  const theme = useSettingsStore(s => s.theme)
  useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      document.body.className = mq.matches ? 'dark' : 'light'
      const h = (e: MediaQueryListEvent) => { document.body.className = e.matches ? 'dark' : 'light' }
      mq.addEventListener('change', h)
      return () => mq.removeEventListener('change', h)
    }
    document.body.className = theme
  }, [theme])
}