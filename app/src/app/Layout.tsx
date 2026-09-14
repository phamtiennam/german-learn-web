import { Outlet } from 'react-router-dom'
import BottomTabBar from '../ui/BottomTabBar'

export default function Layout() {
  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
