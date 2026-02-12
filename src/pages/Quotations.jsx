import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Plus, Search, ChevronDown, 
    Settings, Keyboard, FileSearch,
    Calendar, Filter, Eye, Edit, Trash2
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import useUserPermissions from '../hooks/useUserPermissions';

const Quotations = () => {
    const navigate = useNavigate();
    const { canCreate, canEdit, canDelete, canView } = useUserPermissions('Quotations');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('365'); // '7', '30', '365', 'all'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Open', 'Expired', 'Converted'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/quotations');
            const data = response.data.map(q => ({
                ...q,
                id: q._id,
                dateObj: new Date(q.date),
                date: new Date(q.date).toLocaleDateString('en-IN'),
                quotationNo: q.quotationNo,
                partyName: q.partyName || (q.party ? q.party.name : 'Unknown'),
                amount: q.totalAmount,
                validityDate: q.validityDate,
                status: q.status
            }));
            setItems(data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchQuotations();
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent row click if any
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#000000',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/quotations/${id}`);
                setItems(prev => prev.filter(item => item.id !== id));
                Swal.fire('Deleted!', 'Quotation has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting quotation:', error);
                Swal.fire('Error', 'Failed to delete quotation', 'error');
            }
        }
    };

    const filteredItems = items.filter(item => {
        // Search Filter
        const matchesSearch = 
            item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.quotationNo.toLowerCase().includes(searchTerm.toLowerCase());

        // Status Filter
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        // Date Filter
        let matchesDate = true;
        if (dateRange !== 'all') {
            const days = parseInt(dateRange);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            matchesDate = item.dateObj >= cutoffDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getDaysLeft = (validityDate) => {
        if (!validityDate) return 'N/A';
        const today = new Date();
        const validDate = new Date(validityDate);
        const diffTime = validDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} Days` : 'Expired';
    };

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quotation / Estimate</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Manage and track your sales estimates and proposals</p>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center px-1">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 w-full">
                        <div className="relative group flex-1">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Search size={18} />
                             </div>
                            <input 
                                type="text"
                                placeholder="Search quotations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none transition-all duration-300 shadow-sm focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                        
                        {/* Date Filter Dropdown */}
                        <div className="relative flex-none sm:min-w-[180px]">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 shadow-sm hover:bg-gray-50 h-full">
                                <Calendar size={18} className="text-gray-400 shrink-0" />
                                <select 
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none appearance-none font-bold text-gray-700 cursor-pointer"
                                >
                                    <option value="7">Last 7 Days</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="365">Last 365 Days</option>
                                    <option value="all">All Time</option>
                                </select>
                                <ChevronDown size={14} className="text-gray-400 shrink-0 pointer-events-none absolute right-3" />
                            </div>
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="relative flex-none sm:min-w-[200px]">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 shadow-sm hover:bg-gray-50 h-full">
                                <Filter size={18} className="text-gray-400 shrink-0" />
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none appearance-none font-bold text-gray-700 cursor-pointer"
                                >
                                    <option value="all">Check Status: All</option>
                                    <option value="Open">Open</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Converted">Converted</option>
                                </select>
                                <ChevronDown size={14} className="text-gray-400 shrink-0 pointer-events-none absolute right-3" />
                            </div>
                        </div>
                    </div>
                    {canCreate && (
                    <button 
                        className="w-full lg:w-auto px-6 py-2.5 bg-[#000000] text-white rounded-lg text-sm font-black shadow-lg shadow-black/20 hover:bg-gray-800 transition-all whitespace-nowrap uppercase tracking-wider"
                        onClick={() => navigate('/add-quotation')}
                    >
                        Create Quotation
                    </button>
                    )}
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100 uppercase">
                                <tr className="text-[11px] font-bold text-gray-400 tracking-wider">
                                    <th className="px-6 py-4">Date <ChevronDown size={12} className="inline ml-1" /></th>
                                    <th className="px-6 py-4">Quotation Number</th>
                                    <th className="px-6 py-4">Party Name</th>
                                    <th className="px-6 py-4">Due In</th>
                                    <th className="px-6 py-4">Amount <ChevronDown size={12} className="inline ml-1 rotate-180" /></th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Quotation Rows */}
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-all group">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{item.date}</td>
                                        <td className="px-6 py-4 text-sm font-black text-indigo-600 uppercase tracking-tight">{item.quotationNo}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-gray-800 uppercase">{item.partyName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${getDaysLeft(item.validityDate) === 'Expired' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                {getDaysLeft(item.validityDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900 tabular-nums italic">₹ {item.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                item.status === 'Converted' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                item.status === 'Expired' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                                                {canView && (
                                                <button 
                                                    onClick={() => navigate(`/view-quotation/${item.id}`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                )}
                                                {canEdit && (
                                                <button 
                                                    onClick={() => navigate(`/edit-quotation/${item.id}`)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                )}
                                                {canDelete && (
                                                <button 
                                                    onClick={(e) => handleDelete(item.id, e)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* Empty State when no items */}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-32">
                                            <div className="flex flex-col items-center justify-center text-gray-400 space-y-4">
                                                <div className="relative">
                                                    <FileSearch size={64} className="text-gray-200" />
                                                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-gray-100">
                                                        <span className="text-sm font-bold text-gray-300">₹</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-medium tracking-tight">No Transactions Matching the current filter</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Quotations;
