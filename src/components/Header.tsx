import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import './Header.css'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  const inputRef = useRef<HTMLInputElement>(null)
  const searchPanelRef = useRef<HTMLDivElement>(null)
  const searchInputId = useId()
  const location = useLocation()

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
    document.body.classList.toggle('search-open', searchOpen)
    return () => document.body.classList.remove('search-open')
  }, [searchOpen])

  useEffect(() => {
    if (isWide) setMenuOpen(false)
  }, [isWide])

  // Close panels on route change
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!searchOpen) return
    inputRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (searchPanelRef.current?.contains(target)) return
      if ((e.target as HTMLElement).closest?.('#search-toggle-button')) return
      setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [searchOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
    setSearchOpen(false)
  }

  return (
    <>
      <div id="skip-nav">
        <a href="#page-content">Skip to Main Content</a>
      </div>

      <header id="site-header" className={isWide ? 'is-wide' : 'is-narrow'}>
        <div className="header-bar">
          <Link to="/" className="brand-link" onClick={closeMenu} aria-label="SimLab home">
            <Logo />
          </Link>

          <div className="header-actions">
            {isWide && (
              <nav className="primary-nav" aria-label="Primary">
                <NavLink
                  to="/simulations"
                  className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                >
                  Simulations
                </NavLink>
              </nav>
            )}

            <button
              id="search-toggle-button"
              type="button"
              className="icon-button"
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
              aria-controls="header-search-panel"
              onClick={() => {
                setSearchOpen((o) => !o)
                setMenuOpen(false)
              }}
            >
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>

            {!isWide && (
              <button
                type="button"
                className={`icon-button hamburger${menuOpen ? ' is-open' : ''}`}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-panel"
                onClick={() => {
                  setMenuOpen((o) => !o)
                  setSearchOpen(false)
                }}
              >
                <span className="hamburger-lines" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {!isWide && menuOpen && (
          <nav id="mobile-nav-panel" className="mobile-nav" aria-label="Primary">
            <NavLink
              to="/simulations"
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              onClick={closeMenu}
            >
              Simulations
            </NavLink>
          </nav>
        )}

        {searchOpen && (
          <div
            id="header-search-panel"
            className="search-panel"
            ref={searchPanelRef}
            role="search"
          >
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <label htmlFor={searchInputId} className="screen-reader-only">
                Search simulations
              </label>
              <input
                ref={inputRef}
                id={searchInputId}
                type="search"
                placeholder="Search science experiment simulations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                enterKeyHint="search"
              />
              <button type="submit" className="search-submit" aria-label="Search">
                <SearchIcon />
              </button>
            </form>
          </div>
        )}
      </header>
    </>
  )
}
