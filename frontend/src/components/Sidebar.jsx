import { Users, Calendar, Hash, CalendarDays, BarChart3, FolderOpen } from "lucide-react"
import { createContext } from "react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"


const MENU_ITEMS = [
  { icon: Users, label: "My Groups", path: "/groups" },
  { icon: Calendar, label: "My Events", path: "/events" },
]



export const SideBarItemsContext = createContext(null);

export default function Sidebar({ children }) {
  const [headerHeight, setHeaderHeight] = useState(65)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const [sideBarItems, setSideBarItems] = useState([])

  const addSidebarCluster = (items={groupLabel:'',menuItems:[]}) => {
    // console.log("sidebar items:");
    // console.log([...sideBarItems, items]);
    if(sideBarItems.find((elm)=>elm.groupLabel===items.groupLabel)) return;

    setSideBarItems([...sideBarItems, items])
    // console.log("total sidebar items: " + [...sideBarItems, items].map(cluster => ""+cluster.map(i => i.label)));
  }

  const removeSidebarCluster = (groupLabel='') => {
        // console.log("REMOVED sidebar items:");
    // console.log([groupLabel]);
    setSideBarItems(sideBarItems.filter(itemGroup=>itemGroup.groupLabel !== groupLabel))
  }


  // resizes sidebar to match header
  useEffect(() => {
    addSidebarCluster({menuItems:MENU_ITEMS, groupLabel:'_'})

    const update = () => {
      const header = document.getElementById("main-header")
      if (header) setHeaderHeight(header.offsetHeight)
    }

    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // remove extended sidebar items when leaving a group page
  useEffect(() => {
    const isGroupsPage = pathname.startsWith("/groups/")
    if (!isGroupsPage) {
      setSideBarItems(prev => prev.filter(item => item.groupLabel === '_'))
    }
  }, [pathname])

  // console.log(sideBarItems)
  return (
    <div>

      <aside
        className="fixed left-0 z-40 w-16 bg-white border-r border-gray-200 shadow-lg"
        style={{
          top: headerHeight,
          height: `calc(100vh - ${headerHeight}px)`
        }}
      >
        <nav className="h-full flex flex-col px-3 py-2">
          <ul className="flex-1">
            
            {/* {MENU_ITEMS.map((item) => (
              <SidebarItem
              key={item.path}
              icon={<item.icon size={20} />}
                label={item.label}
                active={pathname === item.path}
                onClick={() => navigate(item.path)}
                />
            ))} */}


            {/* Sidebar items */}
            {(
            sideBarItems.map((itemsGroup, idx,) => {
              return (<>
                {itemsGroup.menuItems.map((item) => 
                  <SidebarItem
                  key={itemsGroup.groupLabel + item.label}
                  icon={<item.icon size={20} />}
                  label={item.label}
                  onClick={item.onClick || (() => navigate(item.path))}
                  />
                )}
                  
                  {/* adds little divider */}
                {idx !== sideBarItems.length-1 && (<li className="my-2 border-t border-gray-200" />)}
              </>)
            })
            )}
          </ul>
        </nav>
      </aside >

      <SideBarItemsContext.Provider value={{addSidebarCluster, removeSidebarCluster}}>
        {children}
      </SideBarItemsContext.Provider>
    </div >
  )
}



function SidebarItem({ icon, label, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`
        relative flex items-center py-3 px-3 my-1 rounded-md cursor-pointer
        transition-colors group text-gray-600 hover:bg-green-50
        
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
