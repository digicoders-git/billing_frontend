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
    if (path.startsWith('/sales/credit-note/edit/')) return 'Edit Credit Note';
    if (path.startsWith('/sales/credit-note/view/')) return 'View Credit Note';
    if (path === '/sales/returns') return 'Sales Returns';
    if (path === '/add-sales-return') return 'Create Sales Return';
    if (path.startsWith('/sales/return/edit/')) return 'Edit Sales Return';
    if (path.startsWith('/sales/return/view/')) return 'View Sales Return';
    if (path === '/sales/payment-in') return 'Payment In';
    if (path === '/sales/payment-in/add') return 'Add Payment';
    if (path.startsWith('/sales/payment-in/edit/')) return 'Edit Payment';
    if (path.startsWith('/sales/payment-in/view/')) return 'View Payment';
    if (path === '/sales/proforma-invoices') return 'Proforma Invoices';
    
    // Purchase Routes
    // Purchase Routes
    if (path === '/purchases/invoices' || path === '/purchases') return 'Purchase Invoices';
    if (path === '/add-purchase-invoice' || path === '/add-purchase') return 'Create Purchase Invoice';
    if (path.startsWith('/purchases/edit/')) return 'Edit Purchase';
    if (path.startsWith('/purchases/view/')) return 'View Purchase';
    if (path === '/purchases/payment-out') return 'Payment Out';
    if (path === '/add-payment-out') return 'Add Payment Out';
    if (path.startsWith('/purchases/edit-payment-out/')) return 'Edit Payment Out';
    if (path.startsWith('/purchases/view-payment-out/')) return 'View Payment Out';
    if (path === '/purchases/orders') return 'Purchase Orders';
    if (path === '/add-purchase-order') return 'Create Purchase Order';
    if (path.startsWith('/purchases/order/edit/')) return 'Edit Purchase Order';
    if (path.startsWith('/purchases/order/view/')) return 'View Purchase Order';
    if (path === '/purchases/debit-notes') return 'Debit Notes';
    if (path === '/add-debit-note') return 'Create Debit Note';
    if (path.startsWith('/purchases/debit-note/edit/')) return 'Edit Debit Note';
    if (path.startsWith('/purchases/debit-note/view/')) return 'View Debit Note';
    if (path === '/purchases/returns') return 'Purchase Returns';
    if (path === '/add-purchase-return') return 'Create Purchase Return';
    if (path.startsWith('/purchases/return/edit/')) return 'Edit Purchase Return';
    if (path.startsWith('/purchases/return/view/')) return 'View Purchase Return';
    
    // Items/Inventory Routes
    if (path === '/items' || path === '/items/inventory') return 'Items & Inventory';
    if (path === '/add-item') return 'Add New Item';
    if (path.startsWith('/edit-item/')) return 'Edit Item';
    if (path === '/items/godown') return 'Godown Management';
    
    // Party Routes
    if (path === '/parties') return 'Party Management';
    if (path === '/add-party') return 'Add New Party';
    if (path.startsWith('/edit-party/')) return 'Edit Party';
    if (path.startsWith('/view-party/')) return 'View Party Details';
    
    // Cash & Bank Routes
    if (path === '/cash-bank') return 'Cash & Bank';
    if (path === '/add-cash-bank') return 'Add New Account';
    if (path.startsWith('/view-account/')) return 'View Account Details';
    if (path.startsWith('/edit-account/')) return 'Edit Account';
    if (path === '/expenses') return 'Expenses';
    if (path === '/add-expense') return 'Record Expense';
    if (path.startsWith('/expenses/edit/')) return 'Edit Expense';
    if (path.startsWith('/expenses/print/')) return 'Expense Voucher';
    
    // Branch Routes
    if (path === '/branches') return 'Branch Management';
    if (path === '/branches/create') return 'Add New Branch';
    if (path.startsWith('/branches/edit/')) return 'Edit Branch';
    if (path.startsWith('/branches/view/')) return 'View Branch';
    
    // Reports Routes
    if (path === '/reports') return 'Reports & Analytics';
    if (path === '/daybook') return 'Daybook';
    if (path === '/reports/balance-sheet') return 'Balance Sheet';
    if (path === '/reports/profit-loss') return 'Profit & Loss Report';
    
    // Generic Dynamic Reports handler
    if (path.startsWith('/reports/')) {
        const reportType = path.split('/reports/')[1];
        // Handle GSTR specifically
        if (reportType.toLowerCase().startsWith('gstr')) {
             return reportType.toUpperCase() + ' Report';
        }
        // Format simple hypenated names (e.g. 'stock-summary' -> 'Stock Summary Report')
        return reportType
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') + ' Report';
    }
    
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