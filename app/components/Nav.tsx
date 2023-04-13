import {
  Menu,
  MenuButton,
  MenuItems,
  MenuLink,
  MenuPopover,
  useMenuButtonContext,
} from '@reach/menu-button'

import {Link, useLocation} from '@remix-run/react'
import clsx from 'clsx'
import {
  AnimatePresence,
  motion,
  useAnimation,
  useReducedMotion,
} from 'framer-motion'
import {useEffect} from 'react'
import {Theme, Themed, useTheme} from '~/utils/theme-provider'
import {MoonIcon, SunIcon} from './icons'

const LINKS: {name: string; to: string; type?: string}[] = [
  {name: 'Blog', to: '/'},
  {name: 'About', to: 'https://github.com/walbuc', type: 'anchor'},
  {name: 'GitHub', to: 'https://github.com/walbuc/wb-arena', type: 'anchor'},
]

const MOBILE_LINKS = [{name: 'Home', to: '/'}, ...LINKS]

function NavLink({
  to,
  type,
  ...rest
}: Omit<Parameters<typeof Link>['0'], 'to'> & {to: string}) {
  const location = useLocation()
  const isSelected =
    to === location.pathname || location.pathname.startsWith(`${to}/`)

  return (
    <li className="px-5 py-2">
      {type === 'anchor' ? (
        <a
          className={clsx(
            'underlined block whitespace-nowrap text-lg font-medium hover:text-purple-300 focus:text-purple-300 focus:outline-none',
            {
              'active text-team-current': isSelected,
              'text-secondary': !isSelected,
            },
          )}
          href={to}
          {...rest}
        />
      ) : (
        <Link
          prefetch="intent"
          className={clsx(
            'underlined block whitespace-nowrap text-lg font-medium hover:text-purple-300 focus:text-purple-300 focus:outline-none',
            {
              'active text-team-current': isSelected,
              'text-secondary': !isSelected,
            },
          )}
          to={to}
          {...rest}
        />
      )}
    </li>
  )
}

const iconTransformOrigin = {transformOrigin: '50% 100px'}

function DarkModeToggle({variant = 'icon'}: {variant?: 'icon' | 'labelled'}) {
  const [, setTheme] = useTheme()
  return (
    <button
      onClick={e => {
        e.preventDefault()
        setTheme(previousTheme => {
          console.log(previousTheme)
          return previousTheme === Theme.DARK ? Theme.LIGHT : Theme.DARK
        })
      }}
      className={clsx(
        'border-secondary duration-600 inline-flex h-14 items-center justify-center overflow-hidden rounded-full border-2 p-1 transition duration-500 hover:border-purple-700 focus:border-purple-700 focus:outline-none',
        {
          'w-14': variant === 'icon',
          'px-8': variant === 'labelled',
        },
      )}
    >
      {/* note that the duration is longer then the one on body, controlling the bg-color */}
      <div className="relative h-8 w-8">
        <span
          className="duration-600 absolute inset-0 rotate-90 transform text-black transition motion-reduce:duration-[0s] dark:rotate-0 dark:text-white"
          style={iconTransformOrigin}
        >
          <MoonIcon />
        </span>
        <span
          className="duration-600 absolute inset-0 rotate-0 transform text-black transition motion-reduce:duration-[0s] dark:-rotate-90 dark:text-white"
          style={iconTransformOrigin}
        >
          <SunIcon />
        </span>
      </div>
      <span
        className={clsx('ml-4 text-black dark:text-white', {
          'sr-only': variant === 'icon',
        })}
      >
        <Themed dark="switch to light mode" light="switch to dark mode" />
      </span>
    </button>
  )
}

function MobileMenuList() {
  const {isExpanded} = useMenuButtonContext()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (isExpanded) {
      // don't use overflow-hidden, as that toggles the scrollbar and causes layout shift
      document.body.classList.add('fixed')
      document.body.classList.add('overflow-y-scroll')
      // alternatively, get bounding box of the menu, and set body height to that.
      document.body.style.height = '100vh'
    } else {
      document.body.classList.remove('fixed')
      document.body.classList.remove('overflow-y-scroll')
      document.body.style.removeProperty('height')
    }
  }, [isExpanded])

  return (
    <AnimatePresence>
      {isExpanded ? (
        <MenuPopover
          position={r => ({
            top: `calc(${Number(r?.top) + Number(r?.height)}px + 2.25rem)`, // 2.25 rem = py-9 from navbar
            left: 0,
            bottom: 0,
            right: 0,
          })}
          style={{display: 'block'}}
          className="z-50"
        >
          <motion.div
            initial={{y: -50, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: -50, opacity: 0}}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.15,
              ease: 'linear',
            }}
            className="bg-primary flex h-full flex-col overflow-y-scroll border-t border-gray-200 pb-12 dark:border-gray-600"
          >
            <MenuItems className="border-none bg-transparent p-0">
              {MOBILE_LINKS.map(link => (
                <MenuLink
                  className="hover:bg-secondary focus:bg-secondary text-primary border-b border-gray-200 px-5vw py-9 hover:text-purple-700 dark:border-gray-600"
                  key={link.to}
                  as={Link}
                  to={link.to}
                >
                  {link.name}
                </MenuLink>
              ))}
              <div className="noscript-hidden py-9 text-center">
                {/* <DarkModeToggle variant="labelled" /> */}
              </div>
            </MenuItems>
          </motion.div>
        </MenuPopover>
      ) : null}
    </AnimatePresence>
  )
}

const topVariants = {
  open: {rotate: 45, y: 7},
  closed: {rotate: 0, y: 0},
}

const centerVariants = {
  open: {opacity: 0},
  closed: {opacity: 1},
}

const bottomVariants = {
  open: {rotate: -45, y: -5},
  closed: {rotate: 0, y: 0},
}

function MobileMenu() {
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? {duration: 0} : {}
  return (
    <Menu>
      {({isExpanded}) => {
        const state = isExpanded ? 'open' : 'closed'
        return (
          <>
            <MenuButton className="focus:border-primary hover:border-primary border-secondary text-primary inline-flex h-14 w-14 items-center justify-center rounded-full border-2 p-1 transition focus:outline-none">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.rect
                  animate={state}
                  variants={topVariants}
                  transition={transition}
                  x="6"
                  y="9"
                  width="20"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
                <motion.rect
                  animate={state}
                  variants={centerVariants}
                  transition={transition}
                  x="6"
                  y="15"
                  width="20"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
                <motion.rect
                  animate={state}
                  variants={bottomVariants}
                  transition={transition}
                  x="6"
                  y="21"
                  width="20"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            </MenuButton>

            <MobileMenuList />
          </>
        )
      }}
    </Menu>
  )
}

function Navbar() {
  //   const {requestInfo, userInfo} = useRootData()
  //   const avatar = userInfo ? userInfo.avatar : 'waht'
  return (
    <div className="px-5vw py-9 lg:py-12">
      <nav className="text-primary mx-auto flex max-w-8xl items-center justify-between">
        <div className="flex justify-center gap-4 align-middle">
          <Link
            className="block whitespace-nowrap bg-gradient-to-r from-indigo-500 to-rose-300 bg-clip-text text-4xl font-bold text-transparent"
            prefetch="intent"
            to="/"
          >
            <h1>w. arena</h1>
          </Link>
        </div>

        <ul className="hidden lg:flex">
          {LINKS.map(link => (
            <NavLink key={link.to} to={link.to} type={link.type}>
              {link.name}
            </NavLink>
          ))}
        </ul>

        <div className="flex items-center justify-center">
          <div className="block lg:hidden">
            <MobileMenu />
          </div>
          <div className="noscript-hidden hidden lg:block">
            <DarkModeToggle />
          </div>
          {/* <Form action="/logout" method="post">
          <button
            type="submit"
            className="active:bg-blue-600 rounded bg-slate-500 py-2 px-4 text-blue-100 hover:animate-pulse hover:bg-blue-500"
          >
            Logout
          </button>
        </Form> */}
        </div>
      </nav>
    </div>
  )
}

export {Navbar}
