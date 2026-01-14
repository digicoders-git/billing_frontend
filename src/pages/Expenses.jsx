import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Plus, Search, ChevronDown, 
    MoreVertical, FileText, IndianRupee, 
    Calendar, Filter, Edit2, Trash2, Printer 
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const Expenses = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Expenses Categories');
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState(['All Expenses Categories']);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/expense-categories');
            const fetchedCategories = response.data.map(cat => cat.name);
            setCategories(['All Expenses Categories', ...fetchedCategories]);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/expenses');
            setExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/expenses/${id}`);
                Swal.fire(
                    'Deleted!',
                    'Expense has been deleted.',
                    'success'
                );
                fetchExpenses();
            } catch (error) {
                console.error('Error deleting expense:', error);
                Swal.fire(
                    'Error!',
                    'Failed to delete expense.',
                    'error'
                );
            }
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, []);

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const filteredExpenses = useMemo(() => {
        const referenceDate = new Date();
        
        return expenses.filter(item => {
            // Search filter
            const partyName = item.partyName || '';
            const matchesSearch = 
                partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Category filter
            let matchesCategory = true;
            if (categoryFilter !== 'All Expenses Categories') {
                matchesCategory = item.category === categoryFilter;
            }

            // Date filter
            if (dateRange === 'All Time') return matchesSearch && matchesCategory;

            const itemDate = new Date(item.date);
            if (isNaN(itemDate.getTime())) return matchesSearch && matchesCategory;

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

            return matchesSearch && matchesCategory && matchesDate;
        });
    }, [searchTerm, categoryFilter, dateRange, expenses]);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        const thisMonthExpenses = expenses.filter(item => {
            const d = new Date(item.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((sum, item) => sum + (item.amount || 0), 0);
        
        return [
            { label: 'Total Expenses', value: `₹ ${totalExpenses.toLocaleString()}`, color: 'border-purple-200 bg-purple-50/30', textColor: 'text-purple-600', icon: IndianRupee },
            { label: 'This Month', value: `₹ ${thisMonthExpenses.toLocaleString()}`, color: 'border-blue-100 bg-blue-50/20', textColor: 'text-blue-600', icon: Calendar },
        ];
    }, [expenses]);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Expenses</h1>
                    <div className="flex gap-2">
                        {/* Reports Button or similar could go here */}
                    </div>
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

                {/* Filters & Actions */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Search by party or expense number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
                            />
                        </div>
                        
                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap"
                            >
                                <Calendar size={18} className="text-gray-400" />
                                <span className="uppercase tracking-tight">{dateRange}</span>
                                <ChevronDown size={14} className={cn("ml-2 text-gray-400 transition-transform", showDateMenu && "rotate-180")} />
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

                        {/* Category Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                                className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap"
                            >
                                <Filter size={18} className="text-gray-400" />
                                <span className="uppercase tracking-tight max-w-[150px] truncate">{categoryFilter}</span>
                                <ChevronDown size={14} className={cn("ml-2 text-gray-400 transition-transform", showCategoryMenu && "rotate-180")} />
                            </button>

                            {showCategoryMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCategoryMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    setCategoryFilter(cat);
                                                    setShowCategoryMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 transition-colors",
                                                    categoryFilter === cat ? "text-indigo-600 bg-indigo-50/50" : "text-gray-600"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/add-expense')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#000000] text-white rounded-lg text-sm font-black shadow-lg shadow-blue-200 hover:bg-[#4338CA] transition-all whitespace-nowrap uppercase tracking-wider"
                        >
                            <Plus size={18} /> <span className="sm:inline">Create Expense</span>
                        </button>
                    </div>
                </div>


                {/* Table Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto h-full">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Date <ChevronDown size={12} className="inline ml-1" /></th>
                                    <th className="px-6 py-4">Expense Number</th>
                                    <th className="px-6 py-4">Party Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Amount <ChevronDown size={12} className="inline ml-1" /></th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Loading Expenses...
                                        </td>
                                    </tr>
                                ) : filteredExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            No Expenses Found
                                            <div className="mt-4 flex justify-center opacity-50">
                                                <FileText size={48} className="text-gray-200" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExpenses.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.expenseNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800 font-black uppercase tracking-tight">{item.partyName || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium bg-gray-50 inline-block rounded my-2 px-2 py-1">{item.category}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">₹ {item.amount.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => navigate(`/expenses/print/${item._id}`)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Print Voucher"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/expenses/edit/${item._id}`)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Expense"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Expense"
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
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Expenses;
