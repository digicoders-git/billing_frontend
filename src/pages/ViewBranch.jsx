import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Building2, User, Shield, MapPin, Phone, 
    Mail, Key, Edit2, Trash2, Power, PowerOff, 
    CheckCircle2, XCircle, TrendingUp, FileText, Loader2,
    Calendar, Clock
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../lib/axios';

const ViewBranch = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBranch();
    }, [id]);

    const fetchBranch = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/branches/${id}`);
            setBranch(response.data);
        } catch (error) {
            console.error('Error fetching branch:', error);
            Swal.fire('Error', 'Failed to load branch details', 'error');
            navigate('/branches');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete branch "${branch.name}"? This action cannot be undone!`,
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
                navigate('/branches');
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to delete branch', 'error');
            }
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = !branch.isActive;
        const result = await Swal.fire({
            title: `${newStatus ? 'Activate' : 'Deactivate'} Branch?`,
            text: `${newStatus ? 'Activate' : 'Deactivate'} "${branch.name}"?`,
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
                fetchBranch();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to update status', 'error');
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-sm font-semibold text-gray-600">Loading branch details...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!branch) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-bold text-gray-400">Branch not found</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/branches')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Branches
                    </button>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Building2 size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900">{branch.name}</h1>
                                    <p className="text-sm text-gray-500 font-semibold mt-1">Branch Code: {branch.code}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {branch.isActive ? (
                                    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-bold">
                                        <CheckCircle2 size={16} />
                                        Active
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-sm font-bold">
                                        <XCircle size={16} />
                                        Inactive
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User size={20} className="text-indigo-600" />
                                Basic Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Branch Name</label>
                                    <p className="text-base font-bold text-gray-900 mt-1">{branch.name}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Branch Code</label>
                                    <p className="text-base font-bold text-gray-900 mt-1">{branch.code}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
                                    <p className="text-base font-bold text-gray-900 mt-1 flex items-center gap-2">
                                        <Key size={16} className="text-gray-400" />
                                        {branch.username}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Manager</label>
                                    <p className="text-base font-bold text-gray-900 mt-1">
                                        {branch.contact?.manager || 'Not assigned'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Phone size={20} className="text-indigo-600" />
                                Contact Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                    <p className="text-base font-bold text-gray-900 mt-1">
                                        {branch.contact?.phone || 'Not provided'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                    <p className="text-base font-bold text-gray-900 mt-1">
                                        {branch.contact?.email || 'Not provided'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <MapPin size={20} className="text-indigo-600" />
                                Address
                            </h2>

                            <div className="space-y-4">
                                {branch.address?.street && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Street</label>
                                        <p className="text-base font-bold text-gray-900 mt-1">{branch.address.street}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {branch.address?.city && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">City</label>
                                            <p className="text-base font-bold text-gray-900 mt-1">{branch.address.city}</p>
                                        </div>
                                    )}

                                    {branch.address?.state && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">State</label>
                                            <p className="text-base font-bold text-gray-900 mt-1">{branch.address.state}</p>
                                        </div>
                                    )}

                                    {branch.address?.pincode && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Pincode</label>
                                            <p className="text-base font-bold text-gray-900 mt-1">{branch.address.pincode}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Shield size={20} className="text-indigo-600" />
                                Access Permissions ({branch.permissions.length} modules)
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {branch.permissions.map(perm => (
                                    <div key={perm.module} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="text-sm font-bold text-gray-900 mb-2">{perm.module}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {perm.actions.view && (
                                                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                                                    👁️ View
                                                </span>
                                            )}
                                            {perm.actions.create && (
                                                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    ➕ Create
                                                </span>
                                            )}
                                            {perm.actions.edit && (
                                                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                                    ✏️ Edit
                                                </span>
                                            )}
                                            {perm.actions.delete && (
                                                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">
                                                    🗑️ Delete
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stats & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Statistics */}
                        {branch.stats && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-indigo-600" />
                                    Statistics
                                </h2>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <div className="text-2xl font-black text-blue-900">
                                            ₹ {(branch.stats.totalSales || 0).toLocaleString()}
                                        </div>
                                        <div className="text-xs font-semibold text-blue-600 mt-1">Total Sales</div>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-xl">
                                        <div className="text-2xl font-black text-green-900">
                                            {branch.stats.totalInvoices || 0}
                                        </div>
                                        <div className="text-xs font-semibold text-green-600 mt-1">Total Invoices</div>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-xl">
                                        <div className="text-2xl font-black text-purple-900">
                                            {branch.stats.totalCustomers || 0}
                                        </div>
                                        <div className="text-xs font-semibold text-purple-600 mt-1">Total Customers</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Settings</h2>

                            <div className="space-y-3">
                                {branch.settings?.allowNegativeStock && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 size={16} className="text-green-600" />
                                        <span className="text-gray-700 font-semibold">Allow Negative Stock</span>
                                    </div>
                                )}
                                {branch.settings?.autoBackup && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 size={16} className="text-green-600" />
                                        <span className="text-gray-700 font-semibold">Auto Backup</span>
                                    </div>
                                )}
                                {branch.settings?.printAfterSave && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 size={16} className="text-green-600" />
                                        <span className="text-gray-700 font-semibold">Print After Save</span>
                                    </div>
                                )}
                                {branch.settings?.gstEnabled && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 size={16} className="text-green-600" />
                                        <span className="text-gray-700 font-semibold">GST Enabled</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Calendar size={16} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500">Created</div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {new Date(branch.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock size={16} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500">Last Updated</div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {new Date(branch.updatedAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Actions</h2>

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/branches/edit/${branch._id}`)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
                                >
                                    <Edit2 size={18} />
                                    Edit Branch
                                </button>

                                <button
                                    onClick={handleToggleStatus}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                                        branch.isActive
                                            ? 'bg-amber-50 border-2 border-amber-200 text-amber-700 hover:bg-amber-100'
                                            : 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100'
                                    }`}
                                >
                                    {branch.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                    {branch.isActive ? 'Deactivate Branch' : 'Activate Branch'}
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all"
                                >
                                    <Trash2 size={18} />
                                    Delete Branch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ViewBranch;
