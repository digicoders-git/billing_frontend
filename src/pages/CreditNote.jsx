import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Settings, 
    Keyboard, Calendar, MoreVertical,
    Plus, ReceiptCent, Filter, Eye, Edit, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const CreditNote = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('This Month');
    const [showDateMenu, setShowDateMenu] = useState(false);
    
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/returns');
            const data = response.data
                .filter(r => r.type === 'Credit Note')
                .map(r => ({
                    ...r,
                    id: r._id,
                    date: new Date(r.date).toLocaleDateString('en-IN'),
                    rawDate: new Date(r.date), // For filtering
                    number: r.returnNo,
                    party: r.partyName || (r.party ? r.party.name : 'Unknown'),
                    invoiceNo: r.originalInvoiceNo || '-',
                    amount: r.totalAmount,
                    status: 'Issued' 
                }));
            setNotes(data);
        } catch (error) {
            console.error('Error fetching credit notes:', error);
            Swal.fire('Error', 'Failed to fetch credit notes', 'error');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchNotes();
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
                await Swal.fire('Deleted!', 'Credit Note has been deleted.', 'success');
                fetchNotes();
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('Error', 'Failed to delete credit note', 'error');
            }
        }
    };

    const dateOptions = [
        'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last 365 Days', 'All Time'
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredNotes = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);

        return notes.filter(n => {
            // Search filter
            const matchesSearch = 
                n.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                n.number.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Date filter
            if (dateRange === 'All Time') return matchesSearch;

            const noteDate = new Date(n.rawDate);
            noteDate.setHours(0,0,0,0);
            
            if (isNaN(noteDate.getTime())) return matchesSearch;

            const diffTime = today - noteDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let matchesDate = false;
            if (dateRange === 'Today') matchesDate = diffDays === 0;
            else if (dateRange === 'Yesterday') matchesDate = diffDays === 1;
            else if (dateRange === 'Last 7 Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            else if (dateRange === 'Last 30 Days') matchesDate = diffDays >= 0 && diffDays <= 30;
            else if (dateRange === 'This Month') {
                matchesDate = noteDate.getMonth() === today.getMonth() && 
                             noteDate.getFullYear() === today.getFullYear();
            }
            else if (dateRange === 'Last 365 Days') matchesDate = diffDays >= 0 && diffDays <= 365;

            return matchesSearch && matchesDate;
        });
    }, [searchTerm, dateRange, notes]);

    // Reset pagination when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateRange]);

    const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
    const paginatedNotes = filteredNotes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Credit Notes</h1>
                </div>

                {/* Filter & Action Row */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 w-full">
                        <div className="group relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200"
                            />
                        </div>

                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full sm:w-auto flex items-center justify-between gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm focus:ring-4 focus:ring-gray-100"
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-gray-400" />
                                    <span className="uppercase tracking-wide">{dateRange}</span>
                                </div>
                                <ChevronDown size={16} className={cn("text-gray-400 transition-transform duration-300", showDateMenu && "rotate-180")} />
                            </button>

                            {showDateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        {dateOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setDateRange(opt);
                                                    setShowDateMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                                                    dateRange === opt ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
                        className="w-full lg:w-auto px-8 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-900 hover:shadow-xl transition-all whitespace-nowrap uppercase tracking-widest flex items-center justify-center gap-2"
                        onClick={() => navigate('/add-credit-note')}
                    >
                        <Plus size={20} /> 
                        <span>New Credit Note</span>
                    </button>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">CN Number</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Party Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Ref Invoice</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-40">Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                <span className="text-sm font-medium text-gray-500">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredNotes.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center text-gray-500 text-sm">
                                            No credit notes found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedNotes.map((n, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                {n.date}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                {n.number}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                                {n.party}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                    {n.invoiceNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                                ₹ {n.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => navigate(`/sales/credit-note/view/${n.id}`)} 
                                                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/sales/credit-note/edit/${n.id}`)} 
                                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(n.id)} 
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
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
                    
                    {/* Pagination */}
                    {!loading && filteredNotes.length > 0 && (
                        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredNotes.length)} of {filteredNotes.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="hidden sm:flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                                currentPage === page 
                                                    ? "bg-black text-white shadow-md transform scale-105" 
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
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default CreditNote;
