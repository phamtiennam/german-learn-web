import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/translate', label: 'Translate', icon: '🔤' },
  { to: '/vocabulary', label: 'List', icon: '📚' },
  { to: '/review', label: 'Review', icon: '🎯' },
  { to: '/voice', label: 'Call', icon: '📞' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
