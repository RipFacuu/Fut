import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Users, Calendar, ClipboardList, Trophy, ListFilter, Layers, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4">
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <div className="ml-auto text-sm text-gray-600">
              Bienvenido, <span className="font-medium">{user?.username}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="p-4 bg-primary-600 text-white">
                <h2 className="font-medium text-sm uppercase tracking-wider text-yellow-50">Gestión de Liga</h2>
              </div>
              <div className="p-2">
                <NavLink
                  to="/admin/teams"
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Users size={18} />
                  <span>Equipos</span>
                </NavLink>
                
                <NavLink
                  to="/admin/fixtures"
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Calendar size={18} />
                  <span>Fixtures</span>
                </NavLink>
                
                <NavLink
                  to="/admin/results"
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <ClipboardList size={18} />
                  <span>Resultados</span>
                </NavLink>
                
                <NavLink
                  to="/admin/standings"
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Trophy size={18} />
                  <span>Posiciones</span>
                </NavLink>
                
                <NavLink
                  to="/admin/categories"
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <ListFilter size={18} />
                  <span>Categorías</span>
                </NavLink>
                
                <NavLink
                  to="/admin/zones"
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Layers size={18} />
                  <span>Zonas</span>
                </NavLink>
                
                <NavLink
                  to="/admin/courses"
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <GraduationCap size={18} />
                  <span>Cursos y Capacitaciones</span>
                </NavLink>
              </div>
            </nav>
          </aside>
          
          {/* Main Content */}
          <main className="lg:col-span-5 bg-white rounded-md shadow-sm p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;