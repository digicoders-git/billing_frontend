import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Plus, Building2, User, Shield, Trash2, Edit2, 
    Power, PowerOff, TrendingUp, Users, FileText,
    MapPin, Phone, Mail, Key, Loader2, CheckCircle2,
    XCircle, BarChart3, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../lib/axios';
import { cn } from '../lib/utils';

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, inactive
    const navigate = useNavigate();

    useEffect(() => {
        fetchBranches();
        fetchStatistics();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await api.get('/branches');
            setBranches(response.data || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            Swal.fire('Error', 'Failed to load branches', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/branches/statistics');
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete branch "${name}"? This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/branches/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Branch has been deleted successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchBranches();
                fetchStatistics();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to delete branch', 'error');
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus, name) => {
        const newStatus = !currentStatus;
        const result = await Swal.fire({
            title: `${newStatus ? 'Activate' : 'Deactivate'} Branch?`,
            text: `${newStatus ? 'Activate' : 'Deactivate'} "${name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#10B981' : '#F59E0B',
            cancelButtonColor: '#6B7280',
            confirmButtonText: `Yes, ${newStatus ? 'activate' : 'deactivate'}!`
        });

        if (result.isConfirmed) {
            try {
                await api.put(`/branches/${id}/toggle-status`);
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Branch ${newStatus ? 'activated' : 'deactivated'} successfully.`,
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchBranches();
                fetchStatistics();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to update status', 'error');
            }
        }
    };

    const filteredBranches = branches.filter(branch => {
        if (filter === 'active') return branch.isActive;
        if (filter === 'inactive') return !branch.isActive;
        return true;
    });

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Loading Branches...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8 space-y-8 bg-gray-50/30 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic decoration-indigo-500/20 underline decoration-4 underline-offset-8">Branches</h1>
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Network</span>
                        </div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] mt-4">Manage Enterprise Locations & Access</p>
                    </div>
                    <button 
                        onClick={() => navigate('/branches/create')}
                        className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white rounded-[22px] text-[11px] font-black shadow-2xl shadow-gray-200 hover:bg-indigo-600 hover:-translate-y-1 transition-all uppercase tracking-[2px] flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Plus size={18} /> Add New Branch
                    </button>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform"><Building2 size={20} /></div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Total</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">All Branches</span>
                                <span className="text-2xl font-black text-indigo-600 italic mt-1">{statistics.totalBranches}</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform"><CheckCircle2 size={20} /></div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Active</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Operational</span>
                                <span className="text-2xl font-black text-emerald-600 italic mt-1">{statistics.activeBranches}</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Revenue</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Sales</span>
                                <span className="text-2xl font-black text-blue-600 italic mt-1">₹ {(statistics.aggregateStats.totalSales || 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform"><Users size={20} /></div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Reach</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Customers</span>
                                <span className="text-2xl font-black text-purple-600 italic mt-1">{statistics.aggregateStats.totalCustomers || 0}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                            filter === 'all' 
                                ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                            filter === 'active' 
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200" 
                                : "bg-white text-gray-400 border-gray-200 hover:border-emerald-200 hover:text-emerald-600"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('inactive')}
                        className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                            filter === 'inactive' 
                                ? "bg-gray-400 text-white border-gray-400 shadow-lg" 
                                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500"
                        )}
                    >
                        Inactive
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 z-10">
                                <tr className="border-b border-gray-50">
                                    <th className="px-8 py-6 text-left">Branch Details</th>
                                    <th className="px-6 py-6 text-left">Manager Info</th>
                                    <th className="px-6 py-6 text-left">Location</th>
                                    <th className="px-6 py-6 text-center">Status</th>
                                    <th className="px-6 py-6 text-right">Performance</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50 select-none">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Network...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredBranches.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                                                <Building2 size={64} className="text-gray-300 mb-4" />
                                                <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">No Branches Found</h3>
                                                <p className="text-xs font-bold text-gray-300 mt-2 uppercase tracking-wide">Expand your network by adding a new branch</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBranches.map((branch) => (
                                        <tr key={branch._id} className="hover:bg-[#F9FAFF] transition-all group cursor-pointer border-b last:border-0">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-[14px] flex items-center justify-center text-indigo-600 font-black uppercase text-sm shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        {branch.name[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{branch.name}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Code: {branch.code}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{branch.contact?.manager || 'Unassigned'}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 mt-1 flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                                                        <Phone size={10} />
                                                        {branch.contact?.phone || 'No Contact'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        <MapPin size={12} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                                        {branch.address?.city || 'Unknown'}, {branch.address?.state || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[2px] border shadow-sm inline-block min-w-[90px]",
                                                    branch.isActive
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : "bg-gray-50 text-gray-500 border-gray-100"
                                                )}>
                                                    {branch.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-gray-900 tracking-tight">₹ {(branch.stats?.totalSales || 0).toLocaleString()}</span>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Sales Revenue</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/branches/view/${branch._id}`); }}
                                                        className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-[12px] shadow-sm transition-all active:scale-90"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/branches/edit/${branch._id}`); }}
                                                        className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 rounded-[12px] shadow-sm transition-all active:scale-90"
                                                        title="Edit Configuration"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(branch._id, branch.isActive, branch.name); }}
                                                        className={cn(
                                                            "p-2.5 bg-white border border-gray-100 rounded-[12px] shadow-sm transition-all active:scale-90",
                                                            branch.isActive ? "text-amber-500 hover:text-amber-600 hover:border-amber-100" : "text-emerald-500 hover:text-emerald-600 hover:border-emerald-100"
                                                        )}
                                                        title={branch.isActive ? "Deactivate Branch" : "Activate Branch"}
                                                    >
                                                        <Power size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(branch._id, branch.name); }}
                                                        className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-rose-600 hover:border-rose-100 rounded-[12px] shadow-sm transition-all active:scale-90"
                                                        title="Delete Branch"
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
                    {/* Footer Status Bar for Branches */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Online</span>
                         </div>
                         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Network Configuration</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Branches;
