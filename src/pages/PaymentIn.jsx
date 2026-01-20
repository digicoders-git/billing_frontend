import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Keyboard, Calendar, MoreVertical,
    HandCoins, Filter, IndianRupee, Plus, X, Eye, Edit, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const PaymentIn = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    
    const [payments, setPayments] = useState([]);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchPayments = async () => {
        try {
            const response = await api.get('/payments');
            const data = response.data
                .filter(p => p.type === 'Payment In')
                .map(p => ({
                    ...p,
                    id: p._id,
                    date: new Date(p.date).toLocaleDateString('en-IN'),
                    rawDate: p.date, // Store ISO date for filtering
                    number: p.receiptNo,
                    party: p.partyName || (p.party ? p.party.name : 'Unknown'),
                    amount: p.amount
                }));
            setPayments(data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    React.useEffect(() => {
        fetchPayments();
    }, []);

    // Reset pagination when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateRange]);

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const filteredPayments = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0); // Normalize today to start of day

        return payments.filter(p => {
            // Search filter
            const matchesSearch = 
                p.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.number.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Date filter
            if (dateRange === 'All Time') return matchesSearch;

            const paymentDate = new Date(p.rawDate);
            if (isNaN(paymentDate.getTime())) return matchesSearch;

            // Normalize payment date to start of day for accurate comparison
            const pDateNormalized = new Date(paymentDate);
            pDateNormalized.setHours(0,0,0,0);

            const diffTime = today - pDateNormalized;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            
            if (dateRange === 'Today') {
                matchesDate = diffDays === 0;
            } else if (dateRange === 'Yesterday') {
                matchesDate = diffDays === 1;
            } else if (dateRange === 'Last 7 Days') {
                matchesDate = diffDays >= 0 && diffDays <= 7;
            } else if (dateRange === 'Last 30 Days') {
                matchesDate = diffDays >= 0 && diffDays <= 30;
            } else if (dateRange === 'This Month') {
                matchesDate = paymentDate.getMonth() === today.getMonth() && 
                             paymentDate.getFullYear() === today.getFullYear();
            } else if (dateRange === 'Last 365 Days') {
                matchesDate = diffDays >= 0 && diffDays <= 365;
            }

            return matchesSearch && matchesDate;
        });
    }, [searchTerm, dateRange, payments]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );


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
                await api.delete(`/payments/${id}`);
                await Swal.fire('Deleted!', 'Payment has been deleted.', 'success');
                fetchPayments(); // Refresh list
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('Error', 'Failed to delete payment', 'error');
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payment In</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Track and manage all received payments</p>
                    </div>
                </div>

                {/* Sub-tabs */}
                <div className="border-b border-gray-100">
                    <div className="flex items-center gap-2 px-1">
                        <button className="flex items-center gap-2 px-6 py-3 text-[#4F46E5] text-sm font-black border-b-2 border-[#4F46E5] -mb-px uppercase tracking-wider relative">
                            <HandCoins size={18} className="text-[#4F46E5]" />
                            <span>Payment Received</span>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#4F46E5] rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.3)]" />
                        </button>
                    </div>
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
                                placeholder="Search by party or payment number..."
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
                        onClick={() => navigate('/sales/payment-in/add')}
                    >
                        <Plus size={18} className="inline mr-1" /> Create Payment In
                    </button>
                </div>

                {/* Data Table / Card View */}
                <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-sm overflow-hidden backdrop-blur-xl">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-6 py-5">Receipt No</th>
                                    <th className="px-6 py-5">Party Details</th>
                                    <th className="px-6 py-5 text-right">Amount</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <div className="p-4 bg-gray-100 rounded-full">
                                                    <HandCoins size={32} className="text-gray-500" />
                                                </div>
                                                <p className="text-xs font-black uppercase tracking-[3px] text-gray-400">No records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPayments.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/40 transition-all group duration-200">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700">{p.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">#{p.number}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors cursor-pointer">
                                                    {p.party}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="text-sm font-black text-gray-900">
                                                    <span className="text-gray-400 font-bold mr-1">₹</span>
                                                    {p.amount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-all duration-200">
                                                    <button 
                                                        onClick={() => navigate(`/sales/payment-in/view/${p.id}`)} 
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/sales/payment-in/edit/${p.id}`)} 
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p.id)} 
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
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
                    <div className="md:hidden divide-y divide-gray-50">
                        {paginatedPayments.length === 0 ? (
                            <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
                                <HandCoins size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No payments</p>
                            </div>
                        ) : (
                            paginatedPayments.map((p, idx) => (
                                <div key={idx} className="p-5 space-y-4 bg-white active:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{p.party}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{p.number} • {p.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                             <button onClick={() => navigate(`/sales/payment-in/edit/${p.id}`)} className="p-2 text-gray-300 hover:text-blue-600 active:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                             <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-300 hover:text-red-600 active:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <button 
                                            onClick={() => navigate(`/sales/payment-in/view/${p.id}`)}
                                            className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full"
                                        >
                                            View Reference
                                        </button>
                                        <div className="text-xl font-black text-gray-900 tracking-tighter">
                                            <span className="text-gray-300 text-sm font-bold mr-1">₹</span>
                                            {p.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {filteredPayments.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-black text-gray-900 px-2">{currentPage}</span>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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

export default PaymentIn;
