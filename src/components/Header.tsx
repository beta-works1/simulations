import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import './Header.css'

function SearchIcon() {
  return (
    <svg viewBox="-1 -1 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle className="search-shape" cx="30" cy="30" r="29" />
      <line className="search-shape" x1="75" y1="75" x2="50" y2="50" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="-1 -1 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line className="search-shape" x1="75" y1="75" x2="25" y2="25" />
      <line className="search-shape" x1="75" y1="25" x2="25" y2="75" />
    </svg>
  )
}

interface HeaderProps {
  onSearch?: (query: string) => void
}

export function Header({ onSearch }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isWide, setIsWide] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const apply = () => setIsWide(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen && !isWide)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen, isWide])

  useEffect(() => {
    if (isWide) setMenuOpen(false)
  }, [isWide])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
    setSearchOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div id="skip-nav">
        <a href="#page-content">Skip to Main Content</a>
      </div>

      <div id="page-header" className="ltr">
        <div
          id="page-header-container-wrapper"
          className={isWide ? 'expanded' : 'collapsed'}
        >
          <header id="page-header-container" role="banner">
            <div id="page-header-left">
              <Link to="/" className="phet-logo-link" onClick={closeMenu} aria-label="SimLab home">
                <div className="phet-logo">
                  <Logo />
                </div>
              </Link>
            </div>

            {!isWide && (
              <button
                id="collapsible-menu-toggle"
                type="button"
                className={menuOpen ? 'open' : ''}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="page-header-menus"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <div id="toggle-container" aria-hidden="true">
                  <span id="nw-rotate" className="rotate">
                    <span id="nw-translate" className="line" />
                  </span>
                  <span id="ne-rotate" className="rotate">
                    <span id="ne-translate" className="line" />
                  </span>
                  <span id="sw-rotate" className="rotate">
                    <span id="sw-translate" className="line" />
                  </span>
                  <span id="se-rotate" className="rotate">
                    <span id="se-translate" className="line" />
                  </span>
                  <span id="east-center-line" className="line center-line" />
                  <span id="west-center-line" className="line center-line" />
                </div>
              </button>
            )}

            <div
              id="page-header-menus"
              className={`ltr ${!isWide && menuOpen ? 'open' : ''}`}
            >
              <div id="collapsible-menu">
                <nav id="page-nav-menu" aria-label="Primary">
                  <ul>
                    <li className="nav-menu-item">
                      <NavLink
                        to="/simulations"
                        className={({ isActive }) =>
                          `nav-menu-parent${isActive ? ' is-active' : ''}`
                        }
                        onClick={closeMenu}
                      >
                        <span className="nav-menu-parent-text">Simulations</span>
                      </NavLink>
                    </li>
                  </ul>
                </nav>

                <div id="search" role="search">
                  <div className="search-toggle-container">
                    <button
                      id="search-toggle-button"
                      type="button"
                      aria-label={searchOpen ? 'Close search' : 'Open search'}
                      aria-expanded={searchOpen}
                      onClick={() => setSearchOpen((o) => !o)}
                    >
                      {searchOpen ? <CloseIcon /> : <SearchIcon />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>

        {searchOpen && (
          <div
            id="search-container-desktop"
            className={isWide ? 'wide-search' : 'mobile-search'}
          >
            <form onSubmit={handleSearchSubmit} id="page-nav-search">
              <label htmlFor="search-input" className="screen-reader-only">
                Search simulations
              </label>
              <input
                id="search-input"
                type="search"
                placeholder="Search simulations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" id="search-submit" aria-label="Submit search">
                <SearchIcon />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
