import heroImg from '../../../assets/hero.png'
import reactLogo from '../../../assets/react.svg'
import viteLogo from '../../../assets/vite.svg'

function HeroSection() {
  return (
    <div className="hero">
      <img src={heroImg} className="base" width="170" height="179" alt="" />
      <img src={reactLogo} className="framework" alt="React logo" />
      <img src={viteLogo} className="vite" alt="Vite logo" />
    </div>
  )
}

export default HeroSection
