import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Search, ChevronDown, Calendar, MoreVertical, 
    Plus, BookType, Trash2, Eye, Edit3,
    ArrowUpRight, ShoppingCart, RefreshCcw, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const DebitNote = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('Last 365 Days');
    const [showDateMenu, setShowDateMenu] = useState(false);
    
    const [debitNotes, setDebitNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayCount: 0,
        todayAmount: 0,
        totalCount: 0,
        totalAmount: 0
    });

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const [notesRes, statsRes] = await Promise.all([
                api.get('/returns'),
                api.get('/returns/stats?type=Debit Note')
            ]);

            const data = notesRes.data
                .filter(r => r.type === 'Debit Note')
                .map(r => ({
                    ...r,
                    id: r._id,
                    date: new Date(r.date).toLocaleDateString('en-IN'),
                    rawDate: r.date,
                    number: r.returnNo,
                    party: r.partyName || (r.party ? r.party.name : 'Unknown'),
                    amount: r.totalAmount,
                    status: 'Approved'
                }));
            
            setDebitNotes(data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching debit notes:', error);
            Swal.fire('Error', 'Failed to load debit note data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This debit note will be deleted permanently!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/returns/${id}`);
                setDebitNotes(debitNotes.filter(n => n.id !== id));
                Swal.fire('Deleted!', 'Debit Note has been removed.', 'success');
                // Refresh stats
                const statsRes = await api.get('/returns/stats?type=Debit Note');
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

    const filteredNotes = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return debitNotes.filter(note => {
            const matchesSearch = 
                note.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                note.number.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (dateRange === 'All Time') return matchesSearch;

            const noteDate = new Date(note.rawDate);
            noteDate.setHours(0, 0, 0, 0);
            
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
    }, [searchTerm, dateRange, debitNotes]);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8 space-y-8 bg-gray-50/30 min-h-screen">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic decoration-indigo-500/20 underline decoration-4 underline-offset-8">Debit Note Registry</h1>
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Audit Mode</span>
                        </div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] mt-4">Account Adjustment Ledgers & Vendor Liability Audit</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            className="px-8 py-4 bg-black text-white rounded-2xl text-[11px] font-black shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-[2px] flex items-center gap-3 active:scale-95"
                            onClick={() => navigate('/add-debit-note')}
                        >
                            <Plus size={18} /> Issue New Debit Note
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
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Adjusted Value</span>
                            <span className="text-2xl font-black text-gray-900 italic mt-1">₹ {(stats?.todayAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Overall</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Entries</span>
                            <span className="text-2xl font-black text-indigo-600 italic mt-1">₹ {(stats?.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 text-green-500 rounded-2xl group-hover:scale-110 transition-transform"><RefreshCcw size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Count</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Registry Count</span>
                            <span className="text-2xl font-black text-green-600 italic mt-1">{debitNotes.length} Records</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform"><Clock size={20} /></div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Status</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Liability Status</span>
                            <span className="text-2xl font-black text-amber-600 italic mt-1">Balanced</span>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
                    <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 w-full">
                        <div className="group relative flex-1">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <Search size={18} />
                             </div>
                            <input 
                                type="text"
                                placeholder="Search by vendor or note ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-bold outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 placeholder:text-gray-300 uppercase tracking-tight"
                            />
                        </div>

                        {/* Date Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowDateMenu(!showDateMenu)}
                                className="w-full flex items-center gap-4 px-8 py-5 bg-white border border-gray-100 rounded-[24px] text-[11px] text-gray-600 font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm min-w-[220px]"
                            >
                                <Calendar size={18} className="text-indigo-400" />
                                <span>{dateRange}</span>
                                <ChevronDown size={14} className={cn("ml-auto text-gray-300 transition-transform", showDateMenu && "rotate-180")} />
                            </button>

                            {showDateMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateMenu(false)} />
                                    <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-[28px] shadow-2xl z-50 py-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-5 pb-3 mb-2 border-b border-gray-50">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Audit Range</span>
                                        </div>
                                        {dateOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setDateRange(opt);
                                                    setShowDateMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider transition-all",
                                                    dateRange === opt ? "text-indigo-600 bg-indigo-50/50 border-r-4 border-indigo-500" : "text-gray-500 hover:bg-gray-50 hover:text-indigo-400"
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

                {/* Table View */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FDFDFF] border-b border-gray-100/50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
                                    <th className="px-10 py-7">Date</th>
                                    <th className="px-6 py-7">Note Number</th>
                                    <th className="px-6 py-7">Party Name</th>
                                    <th className="px-6 py-7 text-right">Amount</th>
                                    <th className="px-6 py-7 text-center">Status</th>
                                    <th className="px-10 py-7 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-10 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Syncing Registry...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredNotes.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-[0.05] grayscale">
                                                <BookType size={96} />
                                                <p className="text-xl font-black uppercase tracking-[8px]">Registry Empty</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredNotes.map((note, idx) => (
                                        <tr key={note.id} className="hover:bg-indigo-50/10 transition-all group cursor-pointer" onClick={() => navigate(`/purchases/debit-note/edit/${note.id}`)}>
                                            <td className="px-10 py-9 text-[13px] font-bold text-gray-900 transition-colors group-hover:text-indigo-600">{note.date}</td>
                                            <td className="px-6 py-9">
                                                <span className="font-black text-indigo-600 uppercase tracking-tighter text-[14px]">
                                                    {note.number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-9">
                                                <div className="text-[13px] font-black text-gray-900 uppercase tracking-tighter italic">{note.party}</div>
                                                <div className="text-[8px] font-black text-gray-300 uppercase tracking-[2px] mt-1 italic">Audit Note Registry</div>
                                            </td>
                                            <td className="px-6 py-9 text-right">
                                                <div className="text-[15px] font-black text-gray-900 italic tracking-tighter">
                                                    <span className="text-[11px] font-bold opacity-30 mr-1.5 not-italic">₹</span>
                                                    {note.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-9 text-center">
                                                <span className={cn(
                                                    "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                                                    note.status === 'Approved' 
                                                        ? "bg-green-50 text-green-600 border-green-100 group-hover:shadow-green-100" 
                                                        : "bg-amber-50 text-amber-600 border-amber-100 group-hover:shadow-amber-100"
                                                )}>
                                                    Approved
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/purchases/debit-note/view/${note.id}`);
                                                        }}
                                                        className="p-3 text-indigo-600 bg-white border border-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/purchases/debit-note/edit/${note.id}`);
                                                        }}
                                                        className="p-3 text-amber-600 bg-white border border-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(note.id);
                                                        }}
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
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DebitNote;
