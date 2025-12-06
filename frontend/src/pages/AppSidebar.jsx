import {User,File,AppWindow} from 'lucide-react'
import { Link,useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
const menuItems = [
  {
    title: "Create RFP",
    path: "/",
    icon:  AppWindow
  },
  {
    title: "ALL RFPs",
    path: "/rfps",
    icon: File
  },
  {
    title: "Vendors",
    path: "/vendors",
    icon: User
  },
  
]



function AppSidebar() {
  const location = useLocation()
  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-black">RFP Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="m-0 p-0">
              {menuItems.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className={
                    location.pathname === item.path
                      ? "bg-gray-200 list-none" // Active link background color
                      : "list-none" // Default list item style
                  }
                >
                  <SidebarMenuButton asChild>
                    <Link to={item.path} className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
     
    </Sidebar>

  )
}

export default AppSidebar