import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Plus, Search, ChevronDown, 
    MoreVertical, Settings, Keyboard, 
    Calendar, FileText, IndianRupee, 
    CheckCircle2, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
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
                <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4 w-10">
                                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    </th>
                                    <th className="px-6 py-4">Date <ChevronDown size={12} className="inline ml-1" /></th>
                                    <th className="px-6 py-4">Invoice Number</th>
                                    <th className="px-6 py-4">Party Name</th>
                                    <th className="px-6 py-4">Due In</th>
                                    <th className="px-6 py-4">Amount <ChevronDown size={12} className="inline ml-1" /></th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            No Invoices Found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.invoiceNo}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800 font-black uppercase tracking-tight">{item.partyName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.dueIn || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">₹ {item.amount.toLocaleString()}</div>
                                                {item.status === 'Unpaid' && (
                                                    <div className="text-[10px] text-gray-400 font-medium">(₹ {item.balanceAmount?.toLocaleString()} unpaid)</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wide",
                                                    item.status === 'Paid' 
                                                        ? "bg-green-100/50 text-green-600 border border-green-200" 
                                                        : "bg-red-50 text-red-500 border border-red-100"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(canEdit || canDelete) && (
                                                    <button className="p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile/Card View */}
                <div className="md:hidden space-y-4">
                    {filteredItems.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs bg-white rounded-xl border-2 border-dashed border-gray-100">
                            No Invoices Found
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(item.date).toLocaleDateString()}</div>
                                        <div className="text-sm font-bold text-gray-900">#{item.invoiceNo}</div>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide",
                                        item.status === 'Paid' 
                                            ? "bg-green-100/50 text-green-600 border border-green-200" 
                                            : "bg-red-50 text-red-500 border border-red-100"
                                    )}>
                                        {item.status}
                                    </span>
                                </div>
                                
                                <div className="pt-2 border-t border-gray-50">
                                    <div className="text-sm font-black text-gray-800 uppercase tracking-tight mb-1">{item.partyName}</div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-tight">
                                            Due in: <span className="text-gray-700">{item.dueIn || '-'}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-gray-900">₹ {item.amount.toLocaleString()}</div>
                                            {item.status === 'Unpaid' && (
                                                <div className="text-[10px] text-gray-400 font-medium">(₹ {item.balanceAmount?.toLocaleString()} unpaid)</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button className="flex-1 py-2 text-xs font-black text-[#4F46E5] bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all uppercase tracking-wider">
                                        View Details
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-100 rounded-lg">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default SalesInvoices;
