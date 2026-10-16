import {HomeIcon} from './HomeArtwork'

const pages = [
  ['home', 'Home'],
  ['pokemon', 'My Pokémon'],
  ['battle', 'Battle'],
  ['resources', 'Resources'],
]

export default function AppNavigation({activePage, battleDesign, onNavigate}) {
  return <nav
    className={battleDesign ? 'matchup-live-nav' : 'bottom-nav home97-nav'}
    aria-label="Main navigation"
  >
    {pages.map(([page, label]) => <button
      key={page}
      type="button"
      className={activePage === page ? 'active' : ''}
      aria-current={activePage === page ? 'page' : undefined}
      onClick={event => onNavigate(page, event)}
      onDoubleClick={page === 'battle' ? event => event.preventDefault() : undefined}
    >
      {!battleDesign && <span className={`nav-icon nav-${page}-icon`}><HomeIcon kind={page}/></span>}
      <span>{label}</span>
    </button>)}
  </nav>
}
