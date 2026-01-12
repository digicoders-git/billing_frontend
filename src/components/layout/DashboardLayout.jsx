import React from 'react';
import Sidebar from './Sidebar';
import { User, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Function to get page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    if (path.startsWith('/sales')) return 'Sales Management';
    if (path.startsWith('/items')) return 'Inventory & Items';
    if (path.startsWith('/purchases')) return 'Purchase Track';
    if (path.startsWith('/parties')) return 'Party Directory';
    if (path.startsWith('/cash-bank')) return 'Financial Hub';
    if (path.startsWith('/branches')) return 'Branch Network';
    if (path.startsWith('/reports')) return 'Reports';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="no-print">
        <Sidebar />
      </div>
      
      <main className="lg:ml-64 transition-all duration-300 min-h-screen flex flex-col relative">
        {/* Top Navigation Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-8 h-16 flex items-center justify-between no-print shadow-sm w-full">
            <div className="flex items-center gap-4">
                {/* Mobile Spacing for Menu Button */}
                <div className="w-12 lg:hidden"></div>
                <div>
                   <h2 className="text-lg font-bold text-gray-900 tracking-tight">{getPageTitle()}</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">Faizan Aquaculture • Live</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Action Buttons */}
                <button 
                  onClick={() => navigate('/add-invoice')}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-95"
                >
                    <Plus size={16} />
                    <span className="hidden md:inline uppercase tracking-widest">New Invoice</span>
                </button>
               
                <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

                <button 
                  onClick={() => navigate('/profile')}
                  className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all group"
                  title="User Profile"
                >
                    <User size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-8 flex-1 w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in w-full h-full">
              {children}
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardLayout;