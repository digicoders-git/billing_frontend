import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Keyboard, Calendar, MoreVertical,
    FileText, DollarSign, AlertCircle,
    Plus, ShoppingCart, Filter,
    Eye, Edit, Trash2, Printer
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

import PurchaseInvoicePrint from '../components/invoices/PurchaseInvoicePrint';

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
    const [printInvoiceData, setPrintInvoiceData] = useState(null);

    const handlePrint = async (id) => {
        try {
            // Fetch full details to ensure we have items
            const response = await api.get(`/purchases/${id}`);
            const data = response.data;
            
            setPrintInvoiceData({
                 ...data,
                // Ensure date object is valid for the component
                date: new Date(data.date),
                invoiceNo: data.invoiceNo,
                partyName: data.partyName || (data.party ? data.party.name : 'Unknown'),
                party: data.party
            });

            // Wait for state update and render, then print
            setTimeout(() => {
                window.print();
                // Optional: Clear after print (or keep it if it doesn't hurt)
                 // setPrintInvoiceData(null); 
            }, 500);

        } catch (error) {
            console.error('Error fetching invoice for print:', error);
            Swal.fire('Error', 'Failed to load invoice for printing', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/purchases/${id}`);
                setInvoices(prev => prev.filter(inv => inv.id !== id));
                Swal.fire(
                    'Deleted!',
                    'Invoice has been deleted.',
                    'success'
                );
            } catch (error) {
                console.error('Error deleting invoice:', error);
                Swal.fire(
                    'Error!',
                    'Failed to delete invoice.',
                    'error'
                );
            }
        }
    };

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
            <div className="hidden print:block fixed inset-0 z-50 bg-white">
                {printInvoiceData && <PurchaseInvoicePrint invoice={printInvoiceData} />}
            </div>

            <div className="p-4 sm:p-6 space-y-6 print:hidden">
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
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F8FAFC] border-b border-gray-100">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-5 rounded-tl-[24px]">Bill Date</th>
                                    <th className="px-6 py-5">Invoice No.</th>
                                    <th className="px-6 py-5">Supplier</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                    <th className="px-6 py-5 text-right">Amount</th>
                                    <th className="px-6 py-5 text-right w-48 rounded-tr-[24px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-[0.1]">
                                                <ShoppingCart size={64} />
                                                <p className="text-sm font-black uppercase tracking-[3px]">No Invoices Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice, idx) => (
                                        <tr 
                                            key={invoice.id} 
                                            onClick={() => navigate(`/purchases/view/${invoice.id}`)}
                                            className="group hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-100 p-2 rounded-lg text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">{invoice.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-black text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">
                                                    {invoice.number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black border border-indigo-100 shadow-sm">
                                                        {invoice.party.substring(0,2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{invoice.party}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Vendor</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                    invoice.status === 'Paid' 
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                        : invoice.status === 'Partial'
                                                            ? "bg-amber-50 text-amber-600 border-amber-100"
                                                            : "bg-rose-50 text-rose-600 border-rose-100"
                                                )}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-gray-800 tracking-tight">₹{invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    {invoice.unpaid > 0 && (
                                                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 rounded mt-0.5">
                                                            Due: ₹{invoice.unpaid.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handlePrint(invoice.id); }}
                                                        className="p-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-500 hover:text-white hover:shadow-md hover:shadow-emerald-200 transition-all"
                                                        title="Print Invoice"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/purchases/view/${invoice.id}`); }}
                                                        className="p-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white hover:shadow-md hover:shadow-indigo-200 transition-all"
                                                        title="View Invoice"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/purchases/edit/${invoice.id}`); }}
                                                        className="p-2 bg-white text-amber-600 border border-amber-100 rounded-xl hover:bg-amber-500 hover:text-white hover:shadow-md hover:shadow-amber-200 transition-all"
                                                        title="Edit Invoice"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id); }}
                                                        className="p-2 bg-white text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white hover:shadow-md hover:shadow-rose-200 transition-all"
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    {/* Mobile View - Premium Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredInvoices.length === 0 ? (
                            <div className="py-24 text-center opacity-[0.3] flex flex-col items-center gap-4">
                                <ShoppingCart size={64} className="text-gray-300" />
                                <p className="text-xs font-black uppercase tracking-[3px] text-gray-400">No Purchase Bills Found</p>
                            </div>
                        ) : (
                            filteredInvoices.map((invoice, idx) => (
                                <div key={idx} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-5 relative overflow-hidden">
                                    
                                    {/* Header: Icon, ID, Date, Status */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#F3F4F6] text-[#6366F1] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                                <ShoppingCart size={22} className="text-indigo-500" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-black text-indigo-500 tracking-[1px] uppercase">{invoice.number}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{invoice.date}</span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm",
                                            invoice.status === 'Paid' 
                                                ? "bg-green-50 text-green-600 border border-green-100" 
                                                : "bg-red-50 text-red-500 border border-red-100"
                                        )}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                    
                                    {/* Content: Vendor & Amounts */}
                                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-50 flex flex-col gap-4">
                                        <div className="flex flex-col pb-4 border-b border-dashed border-gray-200">
                                            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{invoice.party}</span>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Due Information</span>
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-tight",
                                                    invoice.unpaid > 0 ? 'text-red-500' : 'text-indigo-400'
                                                )}>
                                                    {invoice.unpaid > 0 ? `Due: ₹${invoice.unpaid.toLocaleString()}` : '-'}
                                                </span>
                                            </div>
                                            <div className="text-right flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Bill</span>
                                                <div className="text-xl font-black text-gray-900 tracking-tight leading-none">
                                                    <span className="text-xs opacity-40 mr-1">₹</span>
                                                    {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-4 gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePrint(invoice.id); }}
                                            className="h-11 flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors active:scale-95"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/purchases/view/${invoice.id}`); }}
                                            className="h-11 flex items-center justify-center text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors active:scale-95"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/purchases/edit/${invoice.id}`); }}
                                            className="h-11 flex items-center justify-center text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors active:scale-95"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id); }}
                                            className="h-11 flex items-center justify-center text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors active:scale-95"
                                        >
                                            <Trash2 size={18} />
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
