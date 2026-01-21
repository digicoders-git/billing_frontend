import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Calendar, MoreVertical, 
    Plus, ShoppingCart, Filter,
    Trash2, Edit, Eye, Download, Printer, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const PurchaseOrders = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateRange]);
    
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/purchase-orders');
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching purchase orders:", error);
            Swal.fire('Error', 'Failed to load purchase orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This purchase order will be removed permanently!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#4f46e5',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/purchase-orders/${id}`);
                setOrders(orders.filter(o => o._id !== id));
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Purchase Order removed from records.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error("Delete error:", error);
                Swal.fire('Error', 'Failed to delete record', 'error');
            }
        }
    };

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const filteredOrders = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders.filter(order => {
            const matchesSearch = 
                (order.partyName || (order.party?.name || '')).toLowerCase().includes(searchTerm.toLowerCase()) || 
                order.orderNo.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (dateRange === 'All Time') return matchesSearch;

            const orderDate = new Date(order.date);
            orderDate.setHours(0, 0, 0, 0);
            
            if (isNaN(orderDate.getTime())) return matchesSearch;

            const diffTime = today - orderDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            if (dateRange === 'Today') matchesDate = diffDays === 0;
            else if (dateRange === 'Yesterday') matchesDate = diffDays === 1;
            else if (dateRange === 'Last 7 Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            else if (dateRange === 'Last 30 Days') matchesDate = diffDays >= 0 && diffDays <= 30;
            else if (dateRange === 'This Month') {
                matchesDate = orderDate.getMonth() === today.getMonth() && 
                             orderDate.getFullYear() === today.getFullYear();
            }
            else if (dateRange === 'Last 365 Days') matchesDate = diffDays >= 0 && diffDays <= 365;

            return matchesSearch && matchesDate;
        });
    }, [searchTerm, dateRange, orders]);

    const stats = useMemo(() => {
        const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const pendingValue = orders.filter(o => o.status === 'Pending').reduce((sum, o) => sum + o.totalAmount, 0);
        const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
        return { totalAmount, pendingValue, deliveredCount, totalCount: orders.length };
    }, [orders]);

    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8 space-y-8 bg-gray-50/30 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic decoration-indigo-500/20 underline decoration-4 underline-offset-8">Purchase Order</h1>
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Inventory Management</span>
                        </div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] mt-4">Draft & Official Acquisition Procurement Registry</p>
                    </div>
                    <button 
                        className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white rounded-[22px] text-[11px] font-black shadow-2xl shadow-gray-200 hover:bg-indigo-600 hover:-translate-y-1 transition-all uppercase tracking-[2px] flex items-center justify-center gap-3 active:scale-95"
                        onClick={() => navigate('/add-purchase-order')}
                    >
                        <Plus size={18} /> Create New Order
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Today</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Acquisition Value</span>
                            <span className="text-2xl font-black text-gray-900 italic mt-1">₹ {orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform"><Filter size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Overall</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Registry Total</span>
                            <span className="text-2xl font-black text-indigo-600 italic mt-1">₹ {stats.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 text-green-500 rounded-2xl group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Count</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Entries</span>
                            <span className="text-2xl font-black text-green-600 italic mt-1">{orders.length} Records</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Status</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Pending Procurements</span>
                            <span className="text-2xl font-black text-amber-600 italic mt-1">₹ {stats.pendingValue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col min-h-[600px]">
                    {/* Toolbar */}
                    <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 bg-white z-20">
                        <div className="relative w-full sm:w-96">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search size={18} strokeWidth={2} />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search by PO# or Party..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full sm:w-auto h-10 flex items-center justify-between gap-3 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm min-w-[180px]"
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-gray-500" />
                                    <span>{dateRange}</span>
                                </div>
                                <ChevronDown size={14} className={cn("text-gray-400 transition-transform duration-200", showDateMenu && "rotate-180")} />
                            </button>

                            {showDateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filter Date</span>
                                        </div>
                                        {dateOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setDateRange(opt);
                                                    setShowDateMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between",
                                                    dateRange === opt ? "text-indigo-600 bg-indigo-50" : "text-gray-700 hover:bg-gray-50"
                                                )}
                                            >
                                                {opt}
                                                {dateRange === opt && <CheckCircle2 size={14} className="text-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center py-32 gap-4">
                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Orders...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-32 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart size={24} className="text-gray-300" />
                                </div>
                                <h3 className="text-gray-900 font-bold">No Orders Found</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                    No purchase orders match your search or filter criteria.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Order #</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Party</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Amount</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedOrders.map((order, idx) => (
                                        <tr 
                                            key={idx} 
                                            className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/purchases/order/view/${order._id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                    #{order.orderNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                                                        {(order.partyName || (order.party?.name || 'NA'))[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                            {order.partyName || (order.party?.name || 'Unknown')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-medium text-gray-900 tabular-nums">
                                                    ₹ {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                        order.status === 'Delivered' 
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                                            : order.status === 'Approved'
                                                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                                            : order.status === 'Cancelled'
                                                            ? "bg-rose-50 text-rose-700 border-rose-100"
                                                            : "bg-amber-50 text-amber-700 border-amber-100"
                                                    )}>
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            order.status === 'Delivered' ? "bg-emerald-500" :
                                                            order.status === 'Approved' ? "bg-indigo-500" :
                                                            order.status === 'Cancelled' ? "bg-rose-500" : "bg-amber-500"
                                                        )} />
                                                        {order.status}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/purchases/order/edit/${order._id}`); }}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(order._id, e)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/purchases/order/view/${order._id}`); }}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    {/* Pagination Footer */}
                    {filteredOrders.length > 0 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
                            </span>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronDown className="rotate-90" size={16} />
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.ceil(filteredOrders.length / itemsPerPage) }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                                currentPage === i + 1
                                                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                                                    : "text-gray-500 hover:bg-gray-50"
                                            )}
                                        >
                                            {i + 1}
                                        </button>
                                    )).slice(Math.max(0, currentPage - 3), Math.min(Math.ceil(filteredOrders.length / itemsPerPage), currentPage + 2))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredOrders.length / itemsPerPage)))}
                                    disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                                    className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronDown className="-rotate-90" size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PurchaseOrders;
