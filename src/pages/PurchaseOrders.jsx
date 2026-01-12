import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Calendar, MoreVertical, 
    Plus, ShoppingCart, Filter,
    Trash2, Edit, Eye, Download, Printer
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
                    <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-6 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-4 w-full">
                            <div className="group relative flex-1">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors">
                                    <Search size={18} />
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Search by PO# or Party Name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[22px] text-[11px] font-black outline-none transition-all focus:bg-white focus:ring-4 focus:ring-indigo-50 placeholder:text-gray-300 uppercase tracking-[1px]"
                                />
                            </div>

                            <div className="relative">
                                <button 
                                    onClick={() => setShowDateMenu(!showDateMenu)}
                                    className="w-full sm:w-[220px] flex items-center gap-3 px-8 py-4 bg-gray-50 border-none rounded-[22px] text-[10px] text-gray-600 font-black uppercase tracking-[2px] hover:bg-gray-100 transition-all shadow-sm active:scale-95"
                                >
                                    <Calendar size={18} className="text-indigo-400" />
                                    <span>{dateRange}</span>
                                    <ChevronDown size={14} className={cn("ml-auto text-gray-300 transition-transform", showDateMenu && "rotate-180")} />
                                </button>

                                {showDateMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                        <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-[28px] shadow-2xl z-50 py-4 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="px-6 py-2 border-b border-gray-50 mb-2">
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Filtering Registry</p>
                                            </div>
                                            {dateOptions.map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => {
                                                        setDateRange(opt);
                                                        setShowDateMenu(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center justify-between",
                                                        dateRange === opt ? "text-indigo-600 bg-indigo-50/50" : "text-gray-400 hover:bg-gray-50 hover:text-indigo-400"
                                                    )}
                                                >
                                                    {opt}
                                                    {dateRange === opt && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center py-32 gap-4">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-300">Syncing Procurements...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-32 gap-6 opacity-[0.05]">
                                <ShoppingCart size={120} />
                                <div className="text-center">
                                    <p className="text-2xl font-black uppercase tracking-[10px]">Registry Empty</p>
                                    <p className="text-xs font-black uppercase tracking-[3px] mt-2">No procurement orders matching audit filters</p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 z-10">
                                    <tr className="border-b border-gray-50">
                                        <th className="px-10 py-6">Date Registry</th>
                                        <th className="px-6 py-6">PO Reference</th>
                                        <th className="px-6 py-6">Inbound Supplier</th>
                                        <th className="px-6 py-6 text-right">Commitment Value</th>
                                        <th className="px-6 py-6 text-center w-40">Status Registry</th>
                                        <th className="px-10 py-6 text-right">Actions Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/50 select-none">
                                    {filteredOrders.map((order, idx) => (
                                        <tr 
                                            key={idx} 
                                            className="hover:bg-[#F9FAFF] transition-all group cursor-pointer border-b last:border-0"
                                            onClick={() => navigate(`/purchases/order/view/${order._id}`)}
                                        >
                                            <td className="px-10 py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-gray-400 group-hover:text-indigo-600 transition-colors uppercase italic tracking-wider">
                                                        {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-7">
                                                <span className="font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-[10px] text-[10px] tracking-[2px] uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    #{order.orderNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-7">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-[14px] flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all font-black uppercase italic">
                                                        {(order.partyName || (order.party?.name || 'NA'))[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-black text-gray-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{order.partyName || (order.party?.name || 'Unknown')}</span>
                                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-[2px]">{order.party?.mobile || 'No Contact'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-7 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="text-[15px] font-black text-gray-900 tracking-tighter italic group-hover:scale-105 transition-transform origin-right">
                                                        <span className="text-[10px] font-bold opacity-20 mr-1.5 not-italic">₹</span>
                                                        {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Tax Inclusive AUDIT</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-7 text-center">
                                                <span className={cn(
                                                    "px-5 py-2 rounded-[12px] text-[9px] font-black uppercase tracking-[2px] border shadow-sm transition-all",
                                                    order.status === 'Delivered' 
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600" 
                                                        : order.status === 'Approved'
                                                        ? "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                                                        : order.status === 'Cancelled'
                                                        ? "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600"
                                                        : "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600"
                                                )}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/purchases/order/view/${order._id}`); }}
                                                        className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-[14px] shadow-sm transition-all active:scale-90"
                                                        title="Audit View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/purchases/order/edit/${order._id}`); }}
                                                        className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 rounded-[14px] shadow-sm transition-all active:scale-90"
                                                        title="Modify Entry"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(order._id, e)}
                                                        className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-rose-600 hover:border-rose-100 rounded-[14px] shadow-sm transition-all active:scale-90"
                                                        title="Purge Record"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    {/* Bottom Status Bar */}
                    <div className="p-4 bg-gray-900 border-t border-gray-800 text-white flex justify-between items-center no-print">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-[3px]">ACQUISITION REGISTER SYNCED</span>
                            </div>
                            <div className="h-4 w-px bg-gray-700 hidden sm:block" />
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-[9px] font-black text-gray-500 uppercase">AUDIT ENTRIES:</span>
                                <span className="text-[11px] font-black italic">{filteredOrders.length} records</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                                <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                Export Ledger
                            </button>
                            <button className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                                <Printer size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                                Print Registry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PurchaseOrders;
