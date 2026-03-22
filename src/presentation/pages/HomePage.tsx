import { useState } from 'react'
import HeroSection from '../components/home/HeroSection'
import NextStepsSection from '../components/home/NextStepsSection'
import './home-page.css'

function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <HeroSection />
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/presentation/pages/HomePage.tsx</code> and save to
            test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((currentCount) => currentCount + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>
      <NextStepsSection />
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default HomePage
