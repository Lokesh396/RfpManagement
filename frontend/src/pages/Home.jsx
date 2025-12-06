import { SidebarProvider } from '@/components/ui/sidebar'
import {Outlet} from 'react-router-dom'
import AppSidebar from './AppSidebar'
function Home() {
  return (
    <SidebarProvider>
        <AppSidebar />
        <Outlet />
    </SidebarProvider>
  )
}

export default Home