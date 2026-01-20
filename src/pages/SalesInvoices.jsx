import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Plus, Search, ChevronDown, 
    MoreVertical, Settings, Keyboard, 
    Calendar, FileText, IndianRupee, 
    CheckCircle2, AlertCircle, Pencil, Trash2, Printer
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import Pagination from '../components/shared/Pagination';
import useUserPermissions from '../hooks/useUserPermissions';

const SalesInvoices = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const { canCreate, canEdit, canDelete } = useUserPermissions('Sales');
    
    // Read query param for initial filter
    const queryParams = new URLSearchParams(location.search);
    const initialStatus = queryParams.get('status') 
        ? (queryParams.get('status').charAt(0).toUpperCase() + queryParams.get('status').slice(1)) 
        : 'All';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/invoices');
            const data = response.data.map(inv => ({
                ...inv,
                id: inv._id,
                amount: inv.totalAmount,
                // Calculate Days Due/Overdue for display if needed, or use Due date
            }));
            setItems(data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            // Swal.fire('Error', 'Failed to fetch invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInvoice = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Invoice?',
            text: "This action cannot be undone. It will restore stock and adjust party balance.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#000',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/invoices/${id}`);
                setItems(prev => prev.filter(inv => inv.id !== id));
                Swal.fire('Deleted!', 'Invoice has been removed.', 'success');
            } catch (error) {
                console.error('Error deleting invoice:', error);
                Swal.fire('Error', error.response?.data?.message || 'Failed to delete invoice', 'error');
            }
        }
    };

    React.useEffect(() => {
        fetchInvoices();
    }, []);

    // Update filter if URL changes
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        if (status) {
            setStatusFilter(status.charAt(0).toUpperCase() + status.slice(1));
        }
    }, [location.search]);

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const filteredItems = useMemo(() => {
        const referenceDate = new Date();
        
        return items.filter(item => {
            // Search filter
            const partyName = item.partyName || item.party?.name || '';
            const matchesSearch = 
                partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            // Map "Unpaid" filter to include Partial as well if needed, generally logic specific
            let matchesStatus = true;
            if (statusFilter !== 'All') {
                if (statusFilter === 'Unpaid') {
                     matchesStatus = item.status === 'Unpaid' || item.status === 'Partial';
                } else {
                     matchesStatus = item.status === statusFilter;
                }
            }

            // Date filter
            if (dateRange === 'All Time') return matchesSearch && matchesStatus;

            const itemDate = new Date(item.date);
            if (isNaN(itemDate.getTime())) return matchesSearch && matchesStatus;

            const diffTime = referenceDate - itemDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            if (dateRange === 'Today') matchesDate = diffDays === 0;
            else if (dateRange === 'Yesterday') matchesDate = diffDays === 1;
            else if (dateRange === 'Last 7 Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            else if (dateRange === 'Last 30 Days') matchesDate = diffDays >= 0 && diffDays <= 30;
            else if (dateRange === 'This Month') {
                matchesDate = itemDate.getMonth() === referenceDate.getMonth() && 
                             itemDate.getFullYear() === referenceDate.getFullYear();
            }
            else if (dateRange === 'Last 365 Days') matchesDate = diffDays >= 0 && diffDays <= 365;

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [searchTerm, statusFilter, dateRange, items]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, dateRange]);

    // Calculate Stats dynamically
    const stats = useMemo(() => {
        const totalSales = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const paidAmount = items.reduce((sum, item) => sum + (item.amountReceived || 0), 0); // Assuming amountReceived exists, or calc from status
        const unpaidAmount = items.reduce((sum, item) => sum + (item.balanceAmount || 0), 0);

        return [
            { label: 'Total Sales', value: `₹ ${totalSales.toLocaleString()}`, color: 'border-purple-200 bg-purple-50/30', textColor: 'text-purple-600', icon: IndianRupee },
            { label: 'Paid', value: `₹ ${paidAmount.toLocaleString()}`, color: 'border-green-100 bg-green-50/20', textColor: 'text-green-600', icon: CheckCircle2 },
            { label: 'Unpaid', value: `₹ ${unpaidAmount.toLocaleString()}`, color: 'border-red-100 bg-red-50/20', textColor: 'text-red-500', icon: AlertCircle },
        ];
    }, [items]);

    const filterTabs = ['All', 'Paid', 'Unpaid'];

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Sales Invoices</h1>
                   
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className={cn("p-4 sm:p-5 rounded-xl border-2 transition-all hover:shadow-md", stat.color)}>
                            <div className="flex items-center gap-2 mb-2">
                                <stat.icon size={16} className={stat.textColor} />
                                <span className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest", stat.textColor)}>{stat.label}</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex border-b border-gray-200 -mb-px">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setStatusFilter(tab);
                                // Optional: Update URL to reflect clean state or just manage internally
                                navigate('/sales/invoices', { replace: true }); // Clear query params on manual change
                            }}
                            className={cn(
                                "px-6 py-3 text-sm font-black transition-all relative uppercase tracking-wider",
                                (statusFilter === tab || (tab === 'Unpaid' && statusFilter === 'Partial')) 
                                    ? "text-[#4F46E5]" 
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                            {(statusFilter === tab || (tab === 'Unpaid' && statusFilter === 'Partial')) && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#4F46E5] rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.3)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Filters & Actions */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Search by party or invoice number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
                            />
                        </div>
                        
                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <Calendar size={18} className="text-gray-400" />
                                <span className="whitespace-nowrap uppercase tracking-tight">{dateRange}</span>
                                <ChevronDown size={14} className={cn("ml-auto text-gray-400 transition-transform", showDateMenu && "rotate-180")} />
                            </button>

                            {showDateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
                                        {dateOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setDateRange(opt);
                                                    setShowDateMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 transition-colors",
                                                    dateRange === opt ? "text-indigo-600 bg-indigo-50/50" : "text-gray-600"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                       
                        {canCreate && (
                            <button 
                                onClick={() => navigate('/add-invoice')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#000000] text-white rounded-lg text-sm font-black shadow-lg shadow-blue-200 hover:bg-[#4338CA] transition-all whitespace-nowrap uppercase tracking-wider"
                            >
                                <Plus size={18} /> <span className="sm:inline">Create Invoice</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Section - Desktop */}
                <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Invoice Info</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Customer Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Payment Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Invoice Amount</th>
                                    <th className="px-6 py-4 text-right border-b border-gray-50 w-32"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex justify-center items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">
                                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                Processing Invoices...
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                                <FileText size={32} className="opacity-10 mb-2" />
                                                No Invoices Found
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/80 transition-all duration-200 group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 text-sm tracking-tight">{item.invoiceNo}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 text-sm uppercase tracking-tight">{item.partyName}</span>
                                                    {item.dueIn && <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Due {item.dueIn}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border w-fit shadow-sm transition-all",
                                                        item.status === 'Paid' 
                                                            ? "bg-green-50 text-green-600 border-green-100/50" 
                                                            : item.status === 'Partial'
                                                            ? "bg-orange-50 text-orange-600 border-orange-100/50"
                                                            : "bg-red-50 text-red-500 border-red-100/50"
                                                    )}>
                                                        {item.status}
                                                    </span>
                                                    {item.balanceAmount > 0 && item.status !== 'Paid' && (
                                                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-tight px-1">₹{item.balanceAmount?.toLocaleString()} Pending</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className="font-black text-base text-gray-900 tabular-nums italic">₹{item.amount.toLocaleString()}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter opacity-70">Tax Inclusive</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => navigate(`/view-invoice/${item.id}`)} className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 shadow-sm rounded-lg transition-all" title="View Details"><FileText size={16} /></button>
                                                    {canEdit && <button onClick={() => navigate(`/edit-invoice/${item.id}`)} className="p-2 text-gray-400 hover:text-black bg-white border border-gray-100 shadow-sm rounded-lg transition-all" title="Edit"><Pencil size={16} /></button>}
                                                    <button onClick={() => navigate(`/invoice-pdf/${item.id}`)} className="p-2 text-gray-400 hover:text-green-600 bg-white border border-gray-100 shadow-sm rounded-lg transition-all" title="Print"><Printer size={16} /></button>
                                                    {canDelete && <button onClick={() => handleDeleteInvoice(item.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white border border-gray-100 shadow-sm rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredItems.length > 0 && (
                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 flex justify-center">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredItems.length}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Mobile/Card View */}
                <div className="md:hidden space-y-4 mb-8">
                    {loading ? (
                         <div className="py-20 text-center text-indigo-600 font-bold uppercase tracking-widest text-[10px]">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            Loading Invoices...
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-white rounded-2xl border-2 border-dashed border-gray-100">
                             <FileText size={32} className="mx-auto mb-2 opacity-10" />
                            No Invoices Found
                        </div>
                    ) : (
                        currentItems.map((item) => (
                            <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 relative overflow-hidden active:scale-[0.99] transition-all">
                                {/* Subtle Status Bar */}
                                <div className={cn(
                                    "absolute top-0 left-0 h-1 w-full",
                                    item.status === 'Paid' ? "bg-green-500" : item.status === 'Partial' ? "bg-orange-500" : "bg-red-500"
                                )}></div>

                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">#{item.invoiceNo}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-tight truncate">{item.partyName}</h3>
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border shadow-sm",
                                        item.status === 'Paid' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-500 border-red-100"
                                    )}>
                                        {item.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6 py-4 border-y border-gray-50 bg-gray-50/20 px-2 rounded-2xl">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Due In</p>
                                        <p className="font-bold text-gray-700 text-xs">{item.dueIn || 'Nil'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="font-black italic text-gray-900 text-lg tabular-nums">₹{item.amount.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex flex-col">
                                        {item.balanceAmount > 0 && (
                                            <>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Pending Balance</span>
                                                <span className="font-bold text-red-500 text-xs">₹{item.balanceAmount?.toLocaleString()}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => navigate(`/view-invoice/${item.id}`)} className="p-2.5 text-gray-400 bg-white border border-gray-100 shadow-sm rounded-xl active:scale-95 transition-all"><FileText size={18} /></button>
                                        {canEdit && <button onClick={() => navigate(`/edit-invoice/${item.id}`)} className="p-2.5 text-gray-400 bg-white border border-gray-100 shadow-sm rounded-xl active:scale-95 transition-all"><Pencil size={18} /></button>}
                                        <button onClick={() => navigate(`/invoice-pdf/${item.id}`)} className="p-2.5 text-gray-400 bg-white border border-gray-100 shadow-sm rounded-xl active:scale-95 transition-all"><Printer size={18} /></button>
                                        {canDelete && <button onClick={() => handleDeleteInvoice(item.id)} className="p-2.5 text-gray-400 bg-white border border-gray-100 shadow-sm rounded-xl active:scale-95 active:text-red-500 transition-all"><Trash2 size={18} /></button>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    
                    {filteredItems.length > 0 && (
                        <div className="pt-6 flex justify-center">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredItems.length}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default SalesInvoices;
