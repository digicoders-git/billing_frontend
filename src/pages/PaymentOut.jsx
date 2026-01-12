import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Keyboard, Calendar, MoreVertical,
    Plus, Wallet, History, Receipt,
    Trash2, Edit3, Eye, Filter,
    ArrowUpRight, ArrowDownLeft, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const PaymentOut = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ todayOut: 0, monthlyOut: 0, totalPayable: 0 });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const [payRes, statsRes] = await Promise.all([
                api.get('/payments?type=Payment Out'),
                api.get('/payments/stats')
            ]);
            
            setPayments(payRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            Swal.fire({
                icon: 'error',
                title: 'Sync Error',
                text: 'Could not load payment records.',
                confirmButtonColor: '#111827'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This transaction will be permanently removed!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Yes, Delete',
            background: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/payments/${id}`);
                setPayments(payments.filter(p => p._id !== id));
                Swal.fire('Deleted!', 'Transaction has been removed.', 'success');
                // Refresh stats
                const statsRes = await api.get('/payments/stats');
                setStats(statsRes.data);
            } catch (error) {
                Swal.fire('Error', 'Failed to delete transaction', 'error');
            }
        }
    };

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const filteredPayments = useMemo(() => {
        const referenceDate = new Date(); // Current date for filtering
        referenceDate.setHours(0, 0, 0, 0);
        
        return payments.filter(pay => {
            const partyName = pay.partyName || (pay.party ? pay.party.name : 'Unknown');
            const matchesSearch = 
                partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                pay.receiptNo.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (dateRange === 'All Time') return matchesSearch;

            const payDate = new Date(pay.date);
            payDate.setHours(0,0,0,0);
            
            if (isNaN(payDate.getTime())) return matchesSearch;

            const diffTime = referenceDate - payDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            if (dateRange === 'Today') matchesDate = diffDays === 0;
            else if (dateRange === 'Yesterday') matchesDate = diffDays === 1;
            else if (dateRange === 'Last 7 Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            else if (dateRange === 'Last 30 Days') matchesDate = diffDays >= 0 && diffDays <= 30;
            else if (dateRange === 'This Month') {
                matchesDate = payDate.getMonth() === referenceDate.getMonth() && 
                             payDate.getFullYear() === referenceDate.getFullYear();
            }
            else if (dateRange === 'Last 365 Days') matchesDate = diffDays >= 0 && diffDays <= 365;

            return matchesSearch && matchesDate;
        });
    }, [searchTerm, dateRange, payments]);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8 space-y-8 bg-gray-50/30 min-h-screen">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
                            Payment Out Ledger
                            <span className="bg-red-50 text-red-500 text-[10px] not-italic px-3 py-1 rounded-full border border-red-100 animate-pulse">Live</span>
                        </h1>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] mt-1">Vendor Payments & Cash Expenses Tracking</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => navigate('/add-payment-out')}
                            className="flex-1 md:flex-none px-8 py-4 bg-gray-900 text-white rounded-[20px] text-[11px] font-black shadow-2xl shadow-gray-300 hover:bg-indigo-600 hover:-translate-y-1 transition-all uppercase tracking-[2px] flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Plus size={18} /> Record New Entry
                        </button>
                        <button className="p-4 text-gray-400 bg-white hover:text-indigo-600 rounded-[20px] border border-gray-100 transition-all shadow-sm hover:shadow-md">
                            <Settings size={20} />
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
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Out Today</span>
                            <span className="text-2xl font-black text-gray-900 italic mt-1">₹ {(stats?.todayOut || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform"><History size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">30 Days</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Monthly Out</span>
                            <span className="text-2xl font-black text-gray-900 italic mt-1 text-indigo-600">₹ {(stats?.monthlyOut || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl group-hover:scale-110 transition-transform"><Wallet size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Due</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Payable</span>
                            <span className="text-2xl font-black text-gray-900 italic mt-1 text-yellow-600">₹ {(stats?.totalPayable || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 text-green-500 rounded-2xl group-hover:scale-110 transition-transform"><Receipt size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Count</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Entries</span>
                            <span className="text-2xl font-black text-gray-900 italic mt-1 text-green-600">{payments.length} Records</span>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="SEARCH BY VENDOR NAME OR RECEIPT ID ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-transparent border-2 rounded-2xl text-[12px] font-black outline-none transition-all focus:bg-white focus:border-indigo-100 placeholder:text-gray-300 uppercase tracking-widest"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative group w-full lg:w-auto">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full lg:min-w-[200px] flex items-center justify-between gap-4 px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:border-indigo-100 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-indigo-400" />
                                    <span>{dateRange}</span>
                                </div>
                                <ChevronDown size={14} className={cn("text-gray-300 transition-transform duration-300", showDateMenu && "rotate-180")} />
                            </button>
                            {showDateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                    <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="px-5 mb-2 pb-2 border-b border-gray-50">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2"><Filter size={10} /> Filter Range</span>
                                        </div>
                                        {dateOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setDateRange(opt);
                                                    setShowDateMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-6 py-2.5 text-[10px] font-black uppercase tracking-[2px] transition-all",
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
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-[3px]">
                                    <th className="px-10 py-6 text-left">Timeline</th>
                                    <th className="px-8 py-6 text-left">Document ID</th>
                                    <th className="px-8 py-6 text-left">Vendor Account</th>
                                    <th className="px-8 py-6 text-left">Mode</th>
                                    <th className="px-8 py-6 text-right">Debit Value</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 size={40} className="animate-spin text-indigo-500" />
                                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Syncing with servers...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <div className="p-8 bg-gray-100 rounded-full"><Receipt size={64} /></div>
                                                <p className="text-xl font-black uppercase tracking-[8px] text-gray-400">Zero Entries Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <tr key={payment._id} className="hover:bg-gray-50/80 transition-all group cursor-default">
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-gray-900 uppercase italic">{new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                                    {payment.receiptNo}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <div className="text-[13px] font-black text-gray-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                                        {payment.partyName || (payment.party ? payment.party.name : 'Unknown')}
                                                    </div>
                                                    {payment.notes && (
                                                        <div className="text-[10px] font-bold text-gray-400 truncate max-w-[150px] mt-1 italic">"{payment.notes}"</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        payment.paymentMode === 'Cash' ? "bg-orange-400" : "bg-blue-400"
                                                    )} />
                                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{payment.paymentMode}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="text-lg font-black text-gray-900 italic tracking-tight">
                                                        <span className="text-[11px] font-bold text-red-500 mr-2 not-italic">DR</span>
                                                        <span className="text-[11px] font-bold text-gray-300 mr-1 not-italic">₹</span>
                                                        {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={() => navigate(`/purchases/view-payment-out/${payment._id}`)}
                                                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/purchases/edit-payment-out/${payment._id}`)}
                                                        className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                        title="Edit Entry"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(payment._id)}
                                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete Entry"
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
                </div>

            </div>
        </DashboardLayout>
    );
};

export default PaymentOut;
