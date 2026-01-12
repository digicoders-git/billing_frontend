import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Keyboard, Calendar, MoreVertical,
    FileText, DollarSign, AlertCircle,
    Plus, ShoppingCart, Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';

const PurchaseInvoices = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Read query param for initial filter
    const queryParams = new URLSearchParams(location.search);
    const initialStatus = queryParams.get('status') 
        ? (queryParams.get('status').charAt(0).toUpperCase() + queryParams.get('status').slice(1)) 
        : 'All';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/purchases');
            const data = response.data.map(inv => {
                let status = 'Paid';
                if (inv.balanceAmount > 0) {
                    status = inv.balanceAmount < inv.totalAmount ? 'Partial' : 'Unpaid';
                }
                
                return {
                    ...inv,
                    id: inv._id,
                    date: new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                    number: inv.invoiceNo,
                    party: inv.partyName || (inv.party ? inv.party.name : 'Unknown'),
                    amount: inv.totalAmount,
                    unpaid: inv.balanceAmount,
                    status: status,
                    dueIn: inv.balanceAmount > 0 ? 'Pending' : '-'
                };
            });
            setInvoices(data);
        } catch (error) {
            console.error('Error fetching purchase invoices:', error);
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

    const filteredInvoices = useMemo(() => {
        const referenceDate = new Date();
        
        return invoices.filter(inv => {
            const matchesSearch = 
                inv.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                inv.number.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter (simplified logic for client-side filtering)
            let matchesStatus = true;
            if (statusFilter !== 'All') {
                if (statusFilter === 'Unpaid') {
                    matchesStatus = inv.status === 'Unpaid' || inv.status === 'Partial';
                } else {
                    matchesStatus = inv.status === statusFilter;
                }
            }
            
            if (dateRange === 'All Time') return matchesSearch && matchesStatus;

            const invDate = new Date(inv.date);
            if (isNaN(invDate.getTime())) return matchesSearch && matchesStatus;

            const diffTime = referenceDate - invDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            if (dateRange === 'Today') matchesDate = diffDays === 0;
            else if (dateRange === 'Yesterday') matchesDate = diffDays === 1;
            else if (dateRange === 'Last 7 Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            else if (dateRange === 'Last 30 Days') matchesDate = diffDays >= 0 && diffDays <= 30;
            else if (dateRange === 'This Month') {
                matchesDate = invDate.getMonth() === referenceDate.getMonth() && 
                             invDate.getFullYear() === referenceDate.getFullYear();
            }
            else if (dateRange === 'Last 365 Days') matchesDate = diffDays >= 0 && diffDays <= 365;

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [searchTerm, statusFilter, dateRange, invoices]);

    // Stats data based on FULL invoices list (not filtered)
    const stats = useMemo(() => {
        const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const unpaidTotal = invoices.reduce((sum, inv) => sum + (inv.unpaid || 0), 0);
        const paidTotal = total - unpaidTotal;
        return [
            { label: 'Total Purchases', amount: total, icon: FileText, color: 'blue', type: 'All' },
            { label: 'Paid', amount: paidTotal, icon: DollarSign, color: 'green', type: 'Paid' },
            { label: 'Unpaid', amount: unpaidTotal, icon: AlertCircle, color: 'red', type: 'Unpaid' }
        ];
    }, [invoices]); // Changed dependency to invoices

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-gray-800 tracking-tight uppercase">Purchase Invoices</h1>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Vendor Bills & Inventory Inward</span>
                    </div>
                </div>

                {/* Stats Cards - Make them clickable to filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {stats.map((stat, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => {
                                setStatusFilter(stat.type);
                                // Remove query params to prevent reload issues or conflicting states
                                navigate('/purchases/invoices'); 
                            }}
                            className={cn(
                                "bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 cursor-pointer active:scale-95",
                                statusFilter === stat.type && "ring-2 ring-indigo-500 ring-offset-2"
                            )}
                        >
                             <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110`}>
                                <stat.icon size={96} />
                             </div>
                             <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center",
                                            stat.color === 'blue' && 'bg-blue-50 text-blue-600',
                                            stat.color === 'green' && 'bg-green-50 text-green-600',
                                            stat.color === 'red' && 'bg-red-50 text-red-600'
                                        )}>
                                            <stat.icon size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{stat.label}</span>
                                    </div>
                                    <div className="text-2xl font-black text-gray-900 tracking-tight">
                                        <span className="text-sm font-bold opacity-30 mr-1">₹</span>
                                        {stat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>

                {/* Filters & Action Row */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 px-1">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 w-full">
                        <div className="group relative flex-1">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Search size={18} />
                             </div>
                            <input 
                                type="text"
                                placeholder="Search supplier or bill number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-[18px] text-sm font-bold outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 placeholder:text-gray-300 placeholder:font-normal uppercase focus:placeholder:opacity-0"
                            />
                        </div>

                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full h-full flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-[18px] text-[11px] text-gray-600 font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm min-w-[200px]"
                            >
                                <Calendar size={18} className="text-indigo-400" />
                                <span>{dateRange}</span>
                                <ChevronDown size={14} className={cn("ml-auto text-gray-300 transition-transform", showDateMenu && "rotate-180")} />
                            </button>

                            {showDateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-[22px] shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-5 py-2 mb-2 border-b border-gray-50">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[3px]">Select Range</span>
                                        </div>
                                        {dateOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setDateRange(opt);
                                                    setShowDateMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors relative",
                                                    dateRange === opt ? "text-indigo-600 bg-indigo-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-indigo-400"
                                                )}
                                            >
                                                {opt}
                                                {dateRange === opt && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-600 rounded-r-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <button 
                        className="w-full lg:w-auto px-8 py-3.5 bg-gray-900 text-white rounded-[18px] text-[11px] font-black shadow-xl shadow-gray-200 hover:bg-indigo-600 transition-all hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-[2px] flex items-center justify-center gap-3"
                        onClick={() => navigate('/add-purchase-invoice')}
                    >
                        <Plus size={18} /> Record Purchase Bill
                    </button>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FDFDFF] border-b border-gray-50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-8 py-5">Bill Date <ChevronDown size={12} className="inline ml-1 opacity-40" /></th>
                                    <th className="px-4 py-5 font-black">Ref Number</th>
                                    <th className="px-4 py-5">Supplier Account</th>
                                    <th className="px-4 py-5 text-center">Status</th>
                                    <th className="px-4 py-5 text-right w-32">Total Value</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-[0.08]">
                                                <ShoppingCart size={84} />
                                                <p className="text-lg font-black uppercase tracking-[5px]">No Bills Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/20 transition-all group cursor-pointer">
                                            <td className="px-8 py-6">
                                                <div className="text-xs font-black text-gray-400 group-hover:text-indigo-400 transition-colors uppercase">{invoice.date}</div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="text-xs font-black text-indigo-600/60 bg-indigo-50/50 px-2 py-1 rounded inline-block uppercase tracking-wider">{invoice.number}</div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{invoice.party}</span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest mt-1",
                                                        invoice.dueIn.includes('Overdue') ? 'text-red-400' : 'text-gray-300'
                                                    )}>{invoice.dueIn}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    invoice.status === 'Paid' 
                                                        ? "bg-green-50 text-green-600 border-green-100/50 shadow-sm shadow-green-50/50" 
                                                        : "bg-red-50 text-red-600 border-red-100/50 shadow-sm shadow-red-50/50"
                                                )}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-6 text-right">
                                                <div className="text-base font-black text-gray-900 tracking-tight italic">
                                                    <span className="text-[10px] font-bold opacity-30 mr-1 not-italic">₹</span>
                                                    {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                                {invoice.unpaid > 0 && (
                                                    <div className="text-[9px] text-red-400 font-black uppercase tracking-tighter opacity-60">
                                                        - ₹ {invoice.unpaid.toLocaleString()} Bal
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredInvoices.length === 0 ? (
                            <div className="py-24 text-center opacity-[0.1] flex flex-col items-center gap-4">
                                <ShoppingCart size={64} />
                                <p className="text-xs font-black uppercase tracking-[3px]">Empty Purchase Registry</p>
                            </div>
                        ) : (
                            filteredInvoices.map((invoice, idx) => (
                                <div key={idx} className="p-5 space-y-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100/20">
                                                <ShoppingCart size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-indigo-400 tracking-[2px] uppercase">{invoice.number}</span>
                                                <span className="text-[9px] font-black text-gray-300 uppercase">{invoice.date}</span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                                            invoice.status === 'Paid' 
                                                ? "bg-green-50 text-green-600 border-green-100 shadow-sm shadow-green-50/50" 
                                                : "bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-50/50"
                                        )}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-col bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                        <span className="text-sm font-black text-gray-800 uppercase tracking-tight">{invoice.party}</span>
                                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-200/50 border-dashed">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Information</span>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-tighter italic",
                                                    invoice.dueIn.includes('Overdue') ? 'text-red-500' : 'text-indigo-400'
                                                )}>{invoice.dueIn}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Bill</span>
                                                <div className="text-xl font-black text-gray-900 tracking-tight">
                                                    <span className="text-xs opacity-30 mr-1 italic">₹</span>
                                                    {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button className="flex-1 py-3 text-[10px] font-black text-indigo-600 bg-white border border-indigo-50 rounded-[14px] shadow-sm uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all">
                                            View Snapshot
                                        </button>
                                        <button className="px-4 text-gray-300 border border-gray-50 rounded-[14px]">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PurchaseInvoices;
