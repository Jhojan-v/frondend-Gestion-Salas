import { docLinks, socialLinks } from '../../../shared/constants/externalLinks'

function NextStepsSection() {
  return (
    <section id="next-steps">
      <div id="docs">
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#documentation-icon"></use>
        </svg>
        <h2>Documentation</h2>
        <p>Your questions, answered</p>
        <ul>
          {docLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.imageSrc ? (
                  <img className={link.imageClassName} src={link.imageSrc} alt="" />
                ) : (
                  <svg
                    className={link.iconClassName}
                    role="presentation"
                    aria-hidden="true"
                  >
                    <use href={link.iconHref}></use>
                  </svg>
                )}
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div id="social">
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#social-icon"></use>
        </svg>
        <h2>Connect with us</h2>
        <p>Join the Vite community</p>
        <ul>
          {socialLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer">
                <svg
                  className={link.iconClassName}
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href={link.iconHref}></use>
                </svg>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default NextStepsSection
