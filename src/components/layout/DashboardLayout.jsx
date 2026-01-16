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
    
    // Dashboard/Home
    if (path === '/') return 'Dashboard Overview';
    
    // Sales Routes
    if (path === '/sales/invoices') return 'Sales Invoices';
    if (path === '/add-invoice') return 'Create New Invoice';
    if (path.startsWith('/edit-invoice/')) return 'Edit Invoice';
    if (path.startsWith('/view-invoice/')) return 'View Invoice';
    if (path === '/sales/quotations') return 'Quotations';
    if (path === '/add-quotation') return 'Create Quotation';
    if (path.startsWith('/edit-quotation/')) return 'Edit Quotation';
    if (path.startsWith('/view-quotation/')) return 'View Quotation';
    if (path === '/sales/sales-orders') return 'Sales Orders';
    if (path === '/sales/delivery-challans') return 'Delivery Challans';
    if (path === '/sales/credit-notes') return 'Credit Notes';
    if (path === '/add-credit-note') return 'Create Credit Note';
    if (path.startsWith('/edit-credit-note/')) return 'Edit Credit Note';
    if (path.startsWith('/view-credit-note/')) return 'View Credit Note';
    if (path === '/sales/sales-returns') return 'Sales Returns';
    if (path.startsWith('/view-sales-return/')) return 'View Sales Return';
    
    // Purchase Routes
    if (path === '/purchases/invoices') return 'Purchase Invoices';
    if (path === '/add-purchase') return 'Create Purchase Invoice';
    if (path.startsWith('/edit-purchase/')) return 'Edit Purchase';
    if (path.startsWith('/view-purchase/')) return 'View Purchase';
    if (path === '/purchases/purchase-orders') return 'Purchase Orders';
    if (path === '/add-purchase-order') return 'Create Purchase Order';
    if (path.startsWith('/view-purchase-order/')) return 'View Purchase Order';
    if (path === '/purchases/debit-notes') return 'Debit Notes';
    if (path === '/add-debit-note') return 'Create Debit Note';
    if (path.startsWith('/edit-debit-note/')) return 'Edit Debit Note';
    if (path.startsWith('/view-debit-note/')) return 'View Debit Note';
    if (path === '/purchases/purchase-returns') return 'Purchase Returns';
    if (path.startsWith('/view-purchase-return/')) return 'View Purchase Return';
    
    // Items/Inventory Routes
    if (path === '/items') return 'Items & Inventory';
    if (path === '/add-item') return 'Add New Item';
    if (path.startsWith('/edit-item/')) return 'Edit Item';
    if (path === '/godowns') return 'Godown Management';
    
    // Party Routes
    if (path === '/parties') return 'Party Management';
    if (path === '/add-party') return 'Add New Party';
    if (path.startsWith('/edit-party/')) return 'Edit Party';
    if (path.startsWith('/view-party/')) return 'View Party Details';
    
    // Cash & Bank Routes
    if (path === '/cash-bank') return 'Cash & Bank';
    if (path === '/expenses') return 'Expenses';
    
    // Branch Routes
    if (path === '/branches') return 'Branch Management';
    if (path === '/add-branch') return 'Add New Branch';
    if (path.startsWith('/edit-branch/')) return 'Edit Branch';
    if (path.startsWith('/view-branch/')) return 'View Branch';
    
    // Reports Routes
    if (path === '/reports') return 'Reports & Analytics';
    if (path === '/reports/daybook') return 'Daybook Report';
    if (path === '/reports/gst') return 'GST Reports';
    if (path === '/reports/stock') return 'Stock Reports';
    
    // Staff Routes
    if (path === '/staff-attendance') return 'Staff Attendance';
    
    // Profile
    if (path === '/profile') return 'User Profile';
    
    // Default fallback
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="no-print">
        <Sidebar />
      </div>
      
      <main className="lg:ml-64 print:ml-0 transition-all duration-300 min-h-screen flex flex-col relative">
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
                {/* Action Buttons - Hide New Invoice button on invoice pages */}
                {!location.pathname.startsWith('/add-invoice') && 
                 !location.pathname.startsWith('/edit-invoice') && 
                 !location.pathname.startsWith('/view-invoice') && (
                  <button 
                    onClick={() => navigate('/add-invoice')}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-95"
                  >
                      <Plus size={16} />
                      <span className="hidden md:inline uppercase tracking-widest">New Invoice</span>
                  </button>
                )}
               
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