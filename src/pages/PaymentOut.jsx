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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredPayments = useMemo(() => {
        const referenceDate = new Date(); 
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

    // Pagination Logic
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateRange]);

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Payment Out</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Manage vendor payments and expenses</p>
                    </div>
                    <button 
                        onClick={() => navigate('/add-payment-out')}
                        className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all uppercase tracking-wider"
                    >
                        <Plus size={18} /> Record Payment
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Paid', value: `₹${(stats?.totalPayable || 0).toLocaleString()}`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'This Month', value: `₹${(stats?.monthlyOut || 0).toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Today', value: `₹${(stats?.todayOut || 0).toLocaleString()}`, color: 'text-gray-900', bg: 'bg-gray-50' },
                        { label: 'Transactions', value: payments.length, color: 'text-gray-600', bg: 'bg-white border-gray-100' }
                    ].map((stat, i) => (
                        <div key={i} className={`p-4 rounded-xl border border-transparent shadow-sm flex flex-col items-center justify-center text-center ${stat.bg} ${i === 3 ? 'border-gray-200' : ''}`}>
                            <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative group w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        />
                    </div>
                    <div className="relative w-full md:w-auto">
                        <button 
                            onClick={() => setShowDateMenu(!showDateMenu)}
                            className="w-full md:w-48 flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-500" />
                                <span>{dateRange}</span>
                            </div>
                            <ChevronDown size={14} className={cn("text-gray-400 transition-transform", showDateMenu && "rotate-180")} />
                        </button>
                        {showDateMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1">
                                    {dateOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                setDateRange(opt);
                                                setShowDateMenu(false);
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                                                dateRange === opt ? "bg-gray-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"
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

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Voucher No</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Party Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">Payment Mode</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 size={24} className="animate-spin text-indigo-600" />
                                                <span className="text-sm font-medium text-gray-500">Loading records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center text-gray-500 text-sm">
                                            No payment records found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPayments.map((payment) => (
                                        <tr key={payment._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="inline-block px-2 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-mono font-medium text-gray-600">
                                                    {payment.receiptNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col max-w-[200px]">
                                                    <span className="text-sm font-bold text-gray-900 truncate">
                                                        {payment.partyName || payment.party?.name || 'Unknown'}
                                                    </span>
                                                    {payment.notes && (
                                                        <span className="text-[11px] text-gray-400 truncate mt-0.5">
                                                            {payment.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center whitespace-nowrap">
                                                <span className={cn(
                                                    "inline-flex px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap uppercase tracking-wide",
                                                    payment.paymentMode === 'Cash' 
                                                        ? "bg-orange-50 text-orange-600 border-orange-100" 
                                                        : "bg-blue-50 text-blue-600 border-blue-100"
                                                )}>
                                                    {payment.paymentMode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900 font-mono">
                                                    ₹ {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => navigate(`/purchases/view-payment-out/${payment._id}`)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/purchases/edit-payment-out/${payment._id}`)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(payment._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete"
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
                    
                    {/* Pagination Footer */}
                    {!loading && filteredPayments.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-xs font-medium text-gray-500">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="hidden sm:flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                                                currentPage === page 
                                                    ? "bg-black text-white shadow-sm" 
                                                    : "text-gray-500 hover:bg-gray-100"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PaymentOut;
