import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Keyboard, Calendar, MoreVertical,
    Undo2, Filter, Plus, Eye, Edit, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const SalesReturn = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const response = await api.get('/returns');
            const data = response.data
                .filter(r => r.type === 'Sales Return')
                .map(r => ({
                    ...r,
                    id: r._id,
                    date: new Date(r.date).toLocaleDateString('en-IN'),
                    rawDate: r.date,
                    number: r.returnNo,
                    party: r.partyName || (r.party ? r.party.name : 'Unknown'),
                    invoiceNo: r.originalInvoiceNo || '-',
                    amount: r.totalAmount,
                    status: 'Unpaid' // This logic might need refinement based on payments
                }));
            setReturns(data);
        } catch (error) {
            console.error('Error fetching sales returns:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchReturns();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/returns/${id}`);
                await Swal.fire('Deleted!', 'Return entry has been deleted.', 'success');
                fetchReturns(); // Refresh list
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('Error', 'Failed to delete return entry', 'error');
            }
        }
    };

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const filteredReturns = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        return returns.filter(r => {
            // Search filter
            const matchesSearch = 
                r.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                r.number.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Date filter
            if (dateRange === 'All Time') return matchesSearch;

            const returnDate = new Date(r.rawDate);
            if (isNaN(returnDate.getTime())) return matchesSearch;

            const rDateNormalized = new Date(returnDate);
            rDateNormalized.setHours(0,0,0,0);

            const diffTime = today - rDateNormalized;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            if (dateRange === 'Today') matchesDate = diffDays === 0;
            else if (dateRange === 'Yesterday') matchesDate = diffDays === 1;
            else if (dateRange === 'Last 7 Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            else if (dateRange === 'Last 30 Days') matchesDate = diffDays >= 0 && diffDays <= 30;
            else if (dateRange === 'This Month') {
                matchesDate = returnDate.getMonth() === today.getMonth() && 
                             returnDate.getFullYear() === today.getFullYear();
            }
            else if (dateRange === 'Last 365 Days') matchesDate = diffDays >= 0 && diffDays <= 365;

            return matchesSearch && matchesDate;
        });
    }, [searchTerm, dateRange, returns]);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight uppercase">Sales Return</h1>
                </div>

                {/* Filter & Action Row */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center px-1">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 w-full">
                        <div className="group relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Search size={18} />
                             </div>
                            <input 
                                type="text"
                                placeholder="Search by party or return number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all shadow-sm focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>

                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm min-w-[180px]"
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
                    <button 
                        className="w-full lg:w-auto px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100 hover:bg-[#4338CA] transition-all whitespace-nowrap uppercase tracking-wider"
                        onClick={() => navigate('/add-sales-return')}
                    >
                        <Plus size={18} className="inline mr-1" /> Create Sales Return
                    </button>
                </div>

                {/* Data Table / Card View */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">
                                    <th className="px-6 py-4">Date <ChevronDown size={12} className="inline ml-1" /></th>
                                    <th className="px-6 py-4">Return Number</th>
                                    <th className="px-6 py-4">Party Name</th>
                                    <th className="px-6 py-4">Invoice No</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {filteredReturns.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <Undo2 size={48} />
                                                <p className="text-sm font-black uppercase tracking-widest">No matching returns found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReturns.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-6 py-5 text-sm text-gray-600 font-bold">{r.date}</td>
                                            <td className="px-6 py-5 text-sm text-gray-400 font-black">#{r.number}</td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-black text-gray-800 uppercase tracking-tight max-w-[300px] truncate group-hover:text-indigo-600 transition-colors">
                                                    {r.party}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-500 font-medium">{r.invoiceNo}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1 text-sm font-black text-gray-900 tracking-tight">
                                                    <span className="text-gray-400 font-bold">₹</span>
                                                    {r.amount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-wide",
                                                    r.status === 'Paid' 
                                                        ? "bg-green-50 text-green-600 border border-green-100" 
                                                        : "bg-red-50 text-red-500 border border-red-100"
                                                )}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => navigate(`/sales/return/view/${r.id}`)} 
                                                        className="p-2.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all" 
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/sales/return/edit/${r.id}`)} 
                                                        className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all" 
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(r.id)} 
                                                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all" 
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
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
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredReturns.length === 0 ? (
                            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3">
                                <Undo2 size={48} />
                                <p className="text-xs font-black uppercase tracking-widest">No matching returns</p>
                            </div>
                        ) : (
                            filteredReturns.map((r, idx) => (
                                <div key={idx} className="p-5 space-y-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                <Undo2 size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-red-400 tracking-widest uppercase">#{r.number}</span>
                                                <span className="text-xs font-bold text-gray-400">{r.date}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => navigate(`/sales/return/view/${r.id}`)} 
                                                className="p-2 text-purple-600 bg-purple-50 rounded-lg"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/sales/return/edit/${r.id}`)} 
                                                className="p-2 text-blue-600 bg-blue-50 rounded-lg"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col border-l-2 border-gray-100 pl-3">
                                        <span className="text-sm font-black text-gray-800 uppercase tracking-tight line-clamp-2 leading-tight">{r.party}</span>
                                        <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Original Invoice: {r.invoiceNo}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return Amount</div>
                                        <div className="text-lg font-black text-indigo-600 tracking-tight">
                                            <span className="text-[10px] font-bold opacity-50 mr-1">₹</span>
                                            {r.amount.toLocaleString()}
                                        </div>
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

export default SalesReturn;
