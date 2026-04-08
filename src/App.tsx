import { useDarkMode } from './hooks/useDarkMode'
import Bio from './components/Bio'
import Footer from './components/Footer'
import Hobbies from './components/Hobbies'
import Projects from './components/Projects'
import ThemeToggle from './components/ThemeToggle'
import TrinketLayer from './components/TrinketLayer'
import Volunteering from './components/Volunteering'
import Work from './components/Work'

export default function App() {
  const [isDark, toggleTheme] = useDarkMode()

  return (
    <>
      <div id="theme-flash" aria-hidden="true" />
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      <main id="top">
        <TrinketLayer />
        <Bio />
        <Projects />
        <Work />
        <Volunteering />
        <Hobbies />
      </main>
      <Footer />
    </>
  )
}
