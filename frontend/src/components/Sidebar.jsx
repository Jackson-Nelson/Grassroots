import { Users, Calendar, Hash, CalendarDays, BarChart3, FolderOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const MENU_ITEMS = [
  { icon: Users, label: "Groups", path: "/groups" },
  { icon: Calendar, label: "Events", path: "/events" },
]

const GROUPS_PAGE_ITEMS = [
  { icon: Hash, label: "Channels", path: "/groups/channels" },
  { icon: CalendarDays, label: "Group Events", path: "/groups/events" },
  { icon: BarChart3, label: "Polls", path: "/groups/polls" },
  { icon: FolderOpen, label: "Resources", path: "/groups/resources" },
]

export default function Sidebar() {
  const [headerHeight, setHeaderHeight] = useState(65)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // resizes sidebar to match header
  useEffect(() => {
    const update = () => {
      const header = document.getElementById("main-header")
      if (header) setHeaderHeight(header.offsetHeight)
    }

    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const isGroupsPage = pathname.startsWith("/groups/")

  return (
    <aside
      className="fixed left-0 z-40 w-16 bg-white border-r border-gray-200 shadow-lg"
      style={{
        top: headerHeight,
        height: `calc(100vh - ${headerHeight}px)`
      }}
    >
      <nav className="h-full flex flex-col px-3 py-2">
        <ul className="flex-1">
          {MENU_ITEMS.map((item) => (
            <SidebarItem
              key={item.path}
              icon={<item.icon size={20} />}
              label={item.label}
              active={pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
          
          {/* Additional items shown only on Groups page */}
          {isGroupsPage && (
            <>
              <li className="my-2 border-t border-gray-200"></li>
              {GROUPS_PAGE_ITEMS.map((item) => (
                <SidebarItem
                  key={item.path}
                  icon={<item.icon size={20} />}
                  label={item.label}
                  active={pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </>
          )}
        </ul>
      </nav>
    </aside>
  )
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`
        relative flex items-center py-3 px-3 my-1 rounded-md cursor-pointer
        transition-colors group
        ${active
          ? "bg-green-100 text-green-800"
          : "text-gray-600 hover:bg-green-50"
        }
      `}
    >
      <span>{icon}</span>

      {/* hover label */}
      <span
        className="
          absolute left-full ml-6 px-2 py-1 rounded-md bg-green-100
          text-green-800 text-sm whitespace-nowrap pointer-events-none z-50
          opacity-0 invisible -translate-x-3 transition-all
          group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
        "
      >
        {label}
      </span>
    </li>
  )
}
