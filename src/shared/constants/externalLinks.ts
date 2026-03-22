import reactLogo from '../../assets/react.svg'
import viteLogo from '../../assets/vite.svg'

type ImageLink = {
  href: string
  label: string
  imageSrc: string
  imageClassName: string
  iconHref?: never
  iconClassName?: never
}

type IconLink = {
  href: string
  label: string
  iconHref: string
  iconClassName: string
  imageSrc?: never
  imageClassName?: never
}

export const docLinks: ImageLink[] = [
  {
    href: 'https://vite.dev/',
    label: 'Explore Vite',
    imageSrc: viteLogo,
    imageClassName: 'logo',
  },
  {
    href: 'https://react.dev/',
    label: 'Learn more',
    imageSrc: reactLogo,
    imageClassName: 'button-icon',
  },
]

export const socialLinks: IconLink[] = [
  {
    href: 'https://github.com/vitejs/vite',
    label: 'GitHub',
    iconHref: '/icons.svg#github-icon',
    iconClassName: 'button-icon',
  },
  {
    href: 'https://chat.vite.dev/',
    label: 'Discord',
    iconHref: '/icons.svg#discord-icon',
    iconClassName: 'button-icon',
  },
  {
    href: 'https://x.com/vite_js',
    label: 'X.com',
    iconHref: '/icons.svg#x-icon',
    iconClassName: 'button-icon',
  },
  {
    href: 'https://bsky.app/profile/vite.dev',
    label: 'Bluesky',
    iconHref: '/icons.svg#bluesky-icon',
    iconClassName: 'button-icon',
  },
]
