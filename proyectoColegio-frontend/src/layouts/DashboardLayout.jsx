import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminTopbar from "../components/admin/AdminTopbar";
import SidebarAdmin from "../components/sidebar/SidebarAdmin";

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-navy">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de administración"
          className="fixed inset-0 z-30 bg-navy/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <SidebarAdmin
        isOpen={mobileMenuOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
        onNavigate={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setMobileMenuOpen((open) => !open)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
