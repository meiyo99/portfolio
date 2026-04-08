import Bio from './components/Bio'
import Footer from './components/Footer'
import Hobbies from './components/Hobbies'
import Projects from './components/Projects'
import TrinketLayer from './components/TrinketLayer'
import Volunteering from './components/Volunteering'
import Work from './components/Work'

export default function App() {
  return (
    <>
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
