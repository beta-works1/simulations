import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [isWide, setIsWide] = useState(window.innerWidth >= 900)

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 900)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen && !isWide)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen, isWide])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

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
              <Link to="/" className="phet-logo-link">
                <div className="phet-logo">
                  <Logo />
                </div>
              </Link>
              <div className="cu-logo">
                <a href="#" target="_blank" rel="noreferrer">
                  <div className="cu-logo-image-clip">
                    <svg viewBox="0 0 120 24" xmlns="http://www.w3.org/2000/svg" aria-label="University">
                      <rect x="0" y="2" width="20" height="20" fill="#CFB87C" rx="2" />
                      <text x="26" y="17" fontFamily="Roboto, sans-serif" fontSize="11" fill="#000">
                        UNIVERSITY
                      </text>
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            {!isWide && (
              <button
                id="collapsible-menu-toggle"
                type="button"
                className={menuOpen ? 'open' : ''}
                aria-label="Toggle Primary Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <div id="toggle-container">
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
                <nav id="page-nav-menu" role="navigation">
                  <span className="screen-reader-only">Website Navigation</span>
                  <ul role="menubar">
                    <li className="nav-menu-item">
                      <Link to="/simulations" className="nav-menu-parent nav0" role="menuitem">
                        <span className="nav-menu-parent-text">Simulations</span>
                      </Link>
                    </li>
                  </ul>
                </nav>

                <div id="search" role="search">
                  <div className="search-toggle-container">
                    <button
                      id="search-toggle-button"
                      type="button"
                      aria-label="Search"
                      aria-expanded={searchOpen}
                      onClick={() => setSearchOpen(!searchOpen)}
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
                Search the SimLab Website
              </label>
              <input
                id="search-input"
                type="search"
                placeholder="Search the SimLab Website"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" id="search-submit" aria-label="Search">
                <SearchIcon />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
