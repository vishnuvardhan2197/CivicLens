import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export function PortalLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="portal-wrapper">
      <Navbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="portal-body">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="portal-main-content">
          <div className="portal-page-container">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}

export default PortalLayout
