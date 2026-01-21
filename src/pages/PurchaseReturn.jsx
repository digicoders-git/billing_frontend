import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Calendar, MoreVertical,
    Plus, RefreshCcw, Eye, Edit3, Trash2, 
    ArrowUpRight, ShoppingCart, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const PurchaseReturn = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayCount: 0,
        todayAmount: 0,
        totalCount: 0,
        totalAmount: 0
    });

    const fetchReturnsData = async () => {
        setLoading(true);
        try {
            const [returnsRes, statsRes] = await Promise.all([
                api.get('/returns'),
                api.get('/returns/stats?type=Purchase Return')
            ]);

            const data = returnsRes.data
                .filter(r => r.type === 'Purchase Return')
                .map(r => ({
                    ...r,
                    id: r._id,
                    date: new Date(r.date).toLocaleDateString('en-IN'),
                    rawDate: r.date,
                    number: r.returnNo,
                    party: r.partyName || (r.party ? r.party.name : 'Unknown'),
                    purchaseNo: r.originalInvoiceNo || '-',
                    amount: r.totalAmount,
                    status: 'Completed'
                }));

            setReturns(data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching purchase returns:', error);
            Swal.fire('Error', 'Failed to load purchase return data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturnsData();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This return record will be permanently deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/returns/${id}`);
                setReturns(returns.filter(r => r.id !== id));
                Swal.fire('Deleted!', 'Purchase Return has been deleted.', 'success');
                // Refresh stats
                const statsRes = await api.get('/returns/stats?type=Purchase Return');
                setStats(statsRes.data);
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('Error', 'Failed to delete record', 'error');
            }
        }
    };

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const filteredReturns = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return returns.filter(ret => {
            const matchesSearch = 
                ret.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                ret.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ret.purchaseNo.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (dateRange === 'All Time') return matchesSearch;

            const retDate = new Date(ret.rawDate);
            retDate.setHours(0, 0, 0, 0);
            
            if (isNaN(retDate.getTime())) return matchesSearch;

            const diffTime = today - retDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            if (dateRange === 'Today') matchesDate = diffDays === 0;
            else if (dateRange === 'Yesterday') matchesDate = diffDays === 1;
            else if (dateRange === 'Last 7 Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            else if (dateRange === 'Last 30 Days') matchesDate = diffDays >= 0 && diffDays <= 30;
            else if (dateRange === 'This Month') {
                matchesDate = retDate.getMonth() === today.getMonth() && 
                             retDate.getFullYear() === today.getFullYear();
            }
            else if (dateRange === 'Last 365 Days') matchesDate = diffDays >= 0 && diffDays <= 365;

            return matchesSearch && matchesDate;
        });
    }, [searchTerm, dateRange, returns]);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8 space-y-8 bg-gray-50/30 min-h-screen">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    {/* Mobile Header Design */}
                    <div className="md:hidden flex flex-col gap-5">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h1 className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none">
                                    <span className="block border-b-[6px] border-indigo-100 pb-1 mb-1 w-max">PURCHASE</span>
                                    <span className="block border-b-[6px] border-indigo-100 pb-1 w-max">RETURN</span>
                                </h1>
                            </div>
                            <div className="bg-[#EEF2FF] px-4 py-2.5 rounded-[18px] flex flex-col items-center justify-center border border-indigo-50">
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-0.5">Audit</span>
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">Mode</span>
                            </div>
                        </div>
                        
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] leading-relaxed">
                            Stock Outward Registry & <br/> Vendor Settlement Audit
                        </p>

                        <button 
                            onClick={() => navigate('/add-purchase-return')}
                            className="w-full bg-[#0F172A] text-white py-4 rounded-[20px] flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl shadow-gray-200 active:scale-95 transition-all text-sm group"
                        >
                            <Plus size={20} className="text-white group-hover:scale-110 transition-transform" />
                            <span className="font-black uppercase tracking-[2px]">Issue Purchase Return</span>
                        </button>
                    </div>

                    {/* Desktop Header Design */}
                    <div className="hidden md:flex flex-row justify-between items-center gap-6">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic decoration-indigo-500/20 underline decoration-4 underline-offset-8">Purchase Return</h1>
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Audit Mode</span>
                            </div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] mt-4">Stock Outward Registry & Vendor Settlement Audit</p>
                        </div>
                        <button 
                            className="w-auto px-8 py-4 bg-gray-900 text-white rounded-[22px] text-[11px] font-black shadow-2xl shadow-gray-200 hover:bg-indigo-600 hover:-translate-y-1 transition-all uppercase tracking-[2px] flex items-center justify-center gap-3 active:scale-95"
                            onClick={() => navigate('/add-purchase-return')}
                        >
                            <Plus size={18} /> Issue Purchase Return
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:scale-110 transition-transform"><ArrowUpRight size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Today</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Return Value</span>
                            <span className="text-2xl font-black text-gray-900 italic mt-1">₹ {(stats?.todayAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Overall</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Returned</span>
                            <span className="text-2xl font-black text-indigo-600 italic mt-1">₹ {(stats?.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 text-green-500 rounded-2xl group-hover:scale-110 transition-transform"><RefreshCcw size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Count</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Entries</span>
                            <span className="text-2xl font-black text-green-600 italic mt-1">{returns.length} Records</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform"><Clock size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Status</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Inventory Health</span>
                            <span className="text-2xl font-black text-amber-600 italic mt-1">Optimized</span>
                        </div>
                    </div>
                </div>

                {/* Filter & Action Row */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center px-1">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 w-full">
                        <div className="group relative flex-1">
                             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Search size={18} />
                             </div>
                            <input 
                                type="text"
                                placeholder="Search vendor, return # or reference ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[22px] text-sm font-bold outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 placeholder:text-gray-300 uppercase tracking-tight"
                            />
                        </div>

                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full flex items-center gap-4 px-8 py-4 bg-white border border-gray-100 rounded-[22px] text-[11px] text-gray-600 font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm min-w-[220px]"
                            >
                                <Calendar size={18} className="text-indigo-400" />
                                <span>{dateRange}</span>
                                <ChevronDown size={14} className={cn("ml-auto text-gray-300 transition-transform", showDateMenu && "rotate-180")} />
                            </button>

                            {showDateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-50 py-4 animate-in fade-in zoom-in-95 duration-200">
                                        {dateOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setDateRange(opt);
                                                    setShowDateMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-wider transition-colors",
                                                    dateRange === opt ? "text-indigo-600 bg-indigo-50/50" : "text-gray-500 hover:bg-gray-50 hover:text-indigo-400"
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
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FDFDFF] border-b border-gray-100/50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
                                    <th className="px-10 py-7">Date</th>
                                    <th className="px-6 py-7">Return Number</th>
                                    <th className="px-6 py-7">Party Name</th>
                                    <th className="px-6 py-7 text-center">Reference</th>
                                    <th className="px-6 py-7 text-right">Amount</th>
                                    <th className="px-6 py-7 text-center">Status</th>
                                    <th className="px-10 py-7 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Syncing database...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredReturns.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-[0.05]">
                                                <RefreshCcw size={84} />
                                                <p className="text-xl font-black uppercase tracking-[8px]">No Returns Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReturns.map((ret, idx) => (
                                        <tr key={ret.id} className="hover:bg-indigo-50/10 transition-all group cursor-pointer">
                                            <td className="px-10 py-9 text-[13px] font-bold text-gray-900">{ret.date}</td>
                                            <td className="px-6 py-9">
                                                <span className="font-black text-indigo-600 uppercase tracking-tighter text-[14px]">
                                                    {ret.number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-9">
                                                <div className="text-[13px] font-black text-gray-900 uppercase tracking-tighter italic">{ret.party}</div>
                                            </td>
                                            <td className="px-6 py-9 text-center">
                                                <div className="inline-flex flex-col items-center bg-green-50/50 border border-green-100 rounded-xl px-3 py-1">
                                                    <span className="text-[9px] font-black text-green-600 leading-none">30</span>
                                                    <span className="text-[7px] font-black text-green-400 uppercase tracking-widest mt-0.5">Days</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-9 text-right">
                                                <div className="text-[15px] font-black text-gray-900 italic tracking-tighter">
                                                    <span className="text-[11px] font-bold opacity-40 mr-1.5 not-italic">₹</span>
                                                    {ret.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-9 text-center">
                                                <span className={cn(
                                                    "px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] border shadow-sm transition-all",
                                                    ret.status === 'Completed' 
                                                        ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                                                        : "bg-yellow-50 text-yellow-600 border-yellow-100"
                                                )}>
                                                    Open
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={() => navigate(`/purchases/return/view/${ret.id}`)}
                                                        className="p-3 text-indigo-600 bg-white border border-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/purchases/return/edit/${ret.id}`)}
                                                        className="p-3 text-amber-600 bg-white border border-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(ret.id)}
                                                        className="p-3 text-red-600 bg-white border border-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
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

                    {/* Mobile View - Card Layout */}
                    <div className="md:hidden space-y-4 p-4">
                        {loading ? (
                             <div className="flex flex-col items-center gap-4 py-12">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Loading...</p>
                            </div>
                        ) : filteredReturns.length === 0 ? (
                            <div className="flex flex-col items-center gap-6 opacity-30 py-12">
                                <RefreshCcw size={64} className="text-gray-400" />
                                <p className="text-sm font-black uppercase tracking-[4px] text-gray-400">No Returns Found</p>
                            </div>
                        ) : (
                            filteredReturns.map((ret, idx) => (
                                <div key={ret.id} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm relative overflow-hidden group">
                                     {/* Header */}
                                     <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center border border-red-100 shadow-sm">
                                                <ArrowUpRight size={22} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{ret.number}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{ret.date}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                            ret.status === 'Completed' 
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                                                : "bg-yellow-50 text-yellow-600 border-yellow-100"
                                        )}>
                                            {ret.status || 'Open'}
                                        </span>
                                     </div>

                                     {/* Content */}
                                     <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-50 mb-4 space-y-4">
                                         <div>
                                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Party Name</span>
                                             <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{ret.party}</p>
                                         </div>
                                         <div className="flex justify-between items-end pt-3 border-t border-dashed border-gray-200">
                                             <div>
                                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Reference</span>
                                                 <p className="text-xs font-bold text-gray-600">{ret.purchaseNo}</p>
                                             </div>
                                             <div className="text-right">
                                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Return Amount</span>
                                                 <p className="text-xl font-black text-gray-900 tracking-tight">
                                                     <span className="text-xs text-gray-400 mr-1">₹</span>
                                                     {ret.amount.toLocaleString()}
                                                 </p>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Actions */}
                                     <div className="grid grid-cols-3 gap-3">
                                        <button 
                                            onClick={() => navigate(`/purchases/return/view/${ret.id}`)}
                                            className="h-11 flex items-center justify-center gap-2 bg-white border border-indigo-100 rounded-xl text-indigo-600 shadow-sm hover:bg-indigo-50 transition-all active:scale-95"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/purchases/return/edit/${ret.id}`)}
                                            className="h-11 flex items-center justify-center gap-2 bg-white border border-amber-100 rounded-xl text-amber-600 shadow-sm hover:bg-amber-50 transition-all active:scale-95"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(ret.id)}
                                            className="h-11 flex items-center justify-center gap-2 bg-white border border-red-100 rounded-xl text-red-600 shadow-sm hover:bg-red-50 transition-all active:scale-95"
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

export default PurchaseReturn;
