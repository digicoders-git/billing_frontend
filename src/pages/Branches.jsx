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
            <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Branch Management</h1>
                        <p className="text-sm text-gray-500 font-semibold mt-1">Manage your branches and their access permissions</p>
                    </div>
                    <button
                        onClick={() => navigate('/branches/create')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#000000] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={18} />
                        Add New Branch
                    </button>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-indigo-50 rounded-lg">
                                    <Building2 size={24} className="text-indigo-600" />
                                </div>
                                <BarChart3 size={20} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{statistics.totalBranches}</div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">Total Branches</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <CheckCircle2 size={24} className="text-green-600" />
                                </div>
                                <Power size={20} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{statistics.activeBranches}</div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">Active Branches</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <TrendingUp size={24} className="text-blue-600" />
                                </div>
                                <FileText size={20} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">
                                ₹ {(statistics.aggregateStats.totalSales || 0).toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">Total Sales</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <Users size={24} className="text-purple-600" />
                                </div>
                                <User size={20} className="text-gray-300" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">
                                {statistics.aggregateStats.totalCustomers || 0}
                            </div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">Total Customers</div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            filter === 'all' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        All ({branches.length})
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            filter === 'active' 
                                ? 'bg-green-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Active ({branches.filter(b => b.isActive).length})
                    </button>
                    <button
                        onClick={() => setFilter('inactive')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            filter === 'inactive' 
                                ? 'bg-gray-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Inactive ({branches.filter(b => !b.isActive).length})
                    </button>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-lg font-bold text-gray-400">No branches found</p>
                            <p className="text-sm text-gray-400 mt-2">Create your first branch to get started</p>
                        </div>
                    ) : (
                        filteredBranches.map((branch) => (
                            <div 
                                key={branch._id} 
                                className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all group relative overflow-hidden ${
                                    branch.isActive 
                                        ? 'border-gray-200 hover:border-indigo-200 hover:shadow-xl' 
                                        : 'border-gray-100 bg-gray-50/50 opacity-75'
                                }`}
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 z-10">
                                    {branch.isActive ? (
                                        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                                            <CheckCircle2 size={12} />
                                            Active
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">
                                            <XCircle size={12} />
                                            Inactive
                                        </div>
                                    )}
                                </div>

                                {/* Branch Icon & Name */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                        <Building2 size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                                            {branch.name}
                                        </h3>
                                        <div className="text-xs font-bold text-gray-400 mt-1">
                                            CODE: {branch.code}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <User size={16} />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-xs font-semibold text-gray-400">Manager</span>
                                            <span className="text-gray-700 font-semibold truncate">{branch.contact?.manager || 'Not assigned'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <Key size={16} />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-xs font-semibold text-gray-400">Username</span>
                                            <span className="text-gray-700 font-semibold truncate">{branch.username}</span>
                                        </div>
                                    </div>

                                    {branch.contact?.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Phone size={16} />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-xs font-semibold text-gray-400">Phone</span>
                                                <span className="text-gray-700 font-semibold">{branch.contact.phone}</span>
                                            </div>
                                        </div>
                                    )}

                                    {branch.address?.city && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-xs font-semibold text-gray-400">Location</span>
                                                <span className="text-gray-700 font-semibold truncate">
                                                    {branch.address.city}, {branch.address.state}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Permissions */}
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield size={14} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-500">PERMISSIONS ({branch.permissions.length} modules)</span>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {branch.permissions.slice(0, 3).map(perm => (
                                            <div key={perm.module} className="bg-gray-50 p-2 rounded-lg">
                                                <div className="text-xs font-bold text-gray-900 mb-1">{perm.module}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {perm.actions.view && (
                                                        <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                            👁️ View
                                                        </span>
                                                    )}
                                                    {perm.actions.create && (
                                                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                                            ➕ Create
                                                        </span>
                                                    )}
                                                    {perm.actions.edit && (
                                                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                            ✏️ Edit
                                                        </span>
                                                    )}
                                                    {perm.actions.delete && (
                                                        <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                                            🗑️ Delete
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {branch.permissions.length > 3 && (
                                            <div className="text-xs text-gray-500 font-semibold text-center py-1">
                                                +{branch.permissions.length - 3} more modules
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                {branch.stats && (
                                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <div className="text-center">
                                            <div className="text-lg font-black text-gray-900">
                                                ₹ {(branch.stats.totalSales || 0).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500 font-semibold">Sales</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-black text-gray-900">
                                                {branch.stats.totalInvoices || 0}
                                            </div>
                                            <div className="text-xs text-gray-500 font-semibold">Invoices</div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => navigate(`/branches/view/${branch._id}`)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-all text-sm shadow-sm min-w-[100px]"
                                    >
                                        <Eye size={18} />
                                        <span>View</span>
                                    </button>
                                    <button
                                        onClick={() => navigate(`/branches/edit/${branch._id}`)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:border-gray-300 hover:bg-gray-50 transition-all text-sm shadow-sm min-w-[100px]"
                                    >
                                        <Edit2 size={18} />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(branch._id, branch.isActive, branch.name)}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm min-w-[120px] ${
                                            branch.isActive
                                                ? 'bg-amber-50 border-2 border-amber-200 text-amber-700 hover:bg-amber-100'
                                                : 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100'
                                        }`}
                                    >
                                        {branch.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                        <span>{branch.isActive ? 'Deactivate' : 'Activate'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch._id, branch.name)}
                                        className="flex items-center justify-center p-2.5 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all shadow-sm"
                                        title="Delete Branch"
                                        aria-label="Delete Branch"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Branches;
