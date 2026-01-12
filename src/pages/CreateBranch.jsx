import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Save, X, Building2, Shield, Lock, User, CheckSquare, 
    MapPin, Phone, Mail, Hash, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../lib/axios';

const AVAILABLE_PERMISSIONS = [
    'Dashboard', 'Parties', 'Items', 'Sales', 'Purchases', 
    'Payments', 'Reports', 'Settings', 'Users', 'Branches',
    'Invoices', 'Quotations', 'Returns', 'Godowns', 'Staff'
];

const CreateBranch = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        username: '',
        password: '',
        permissions: [],
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        },
        contact: {
            phone: '',
            email: '',
            manager: ''
        },
        settings: {
            allowNegativeStock: false,
            autoBackup: true,
            printAfterSave: false,
            gstEnabled: true
        }
    });

    useEffect(() => {
        if (isEdit && id) {
            fetchBranch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEdit]);

    const fetchBranch = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/branches/${id}`);
            const branch = response.data;
            setFormData({
                name: branch.name || '',
                code: branch.code || '',
                username: branch.username || '',
                password: '', // Don't populate password for security
                permissions: branch.permissions || [],
                address: branch.address || {
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India'
                },
                contact: branch.contact || {
                    phone: '',
                    email: '',
                    manager: ''
                },
                settings: branch.settings || {
                    allowNegativeStock: false,
                    autoBackup: true,
                    printAfterSave: false,
                    gstEnabled: true
                }
            });
        } catch (error) {
            console.error('Error fetching branch:', error);
            Swal.fire('Error', 'Failed to load branch data', 'error');
            navigate('/branches');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (module) => {
        setFormData(prev => {
            const existingIndex = prev.permissions.findIndex(p => p.module === module);
            
            if (existingIndex >= 0) {
                // Remove module
                return {
                    ...prev,
                    permissions: prev.permissions.filter((_, idx) => idx !== existingIndex)
                };
            } else {
                // Add module with default actions
                return {
                    ...prev,
                    permissions: [
                        ...prev.permissions,
                        {
                            module,
                            actions: {
                                view: true,
                                create: false,
                                edit: false,
                                delete: false
                            }
                        }
                    ]
                };
            }
        });
    };

    const handleToggleAction = (module, action) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(p => 
                p.module === module
                    ? {
                        ...p,
                        actions: {
                            ...p.actions,
                            [action]: !p.actions[action]
                        }
                    }
                    : p
            )
        }));
    };

    const handleSelectAll = () => {
        if (formData.permissions.length === AVAILABLE_PERMISSIONS.length) {
            // Remove all
            setFormData(prev => ({ ...prev, permissions: [] }));
        } else {
            // Add all with default actions
            setFormData(prev => ({
                ...prev,
                permissions: AVAILABLE_PERMISSIONS.map(module => ({
                    module,
                    actions: {
                        view: true,
                        create: false,
                        edit: false,
                        delete: false
                    }
                }))
            }));
        }
    };

    const handleBulkActionToggle = (action, value) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(p => ({
                ...p,
                actions: action === 'all' 
                    ? {
                        view: value,
                        create: value,
                        edit: value,
                        delete: value
                    }
                    : {
                        ...p.actions,
                        [action]: value
                    }
            }))
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.permissions.length === 0) {
            Swal.fire({
                title: 'Error',
                text: 'Please select at least one permission.',
                icon: 'error'
            });
            return;
        }

        if (!isEdit && !formData.password) {
            Swal.fire({
                title: 'Error',
                text: 'Password is required for new branches.',
                icon: 'error'
            });
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ...formData,
                code: formData.code.toUpperCase()
            };

            // Don't send password if it's empty in edit mode
            if (isEdit && !formData.password) {
                delete payload.password;
            }

            if (isEdit) {
                await api.put(`/branches/${id}`, payload);
                Swal.fire({
                    title: 'Success!',
                    text: 'Branch updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                await api.post('/branches', payload);
                Swal.fire({
                    title: 'Success!',
                    text: 'Branch created successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            navigate('/branches');
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} branch`,
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-sm font-semibold text-gray-600">Loading branch data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">
                                {isEdit ? 'Edit Branch' : 'Create New Branch'}
                            </h1>
                            <p className="text-gray-500 text-sm font-semibold mt-1">
                                {isEdit ? 'Update branch details and permissions' : 'Setup a new branch and assign permissions'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Branch Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Basic Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Basic Details</h3>
                            
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Branch Name *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="e.g. South Branch"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Branch Code *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold uppercase"
                                    placeholder="e.g. SB001"
                                    maxLength={10}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Login Username *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="e.g. south_admin"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">
                                    Password {!isEdit && '*'}
                                    {isEdit && <span className="text-xs text-gray-400 ml-2">(Leave blank to keep current)</span>}
                                </label>
                                <input 
                                    type="password"
                                    required={!isEdit}
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="Min 6 characters"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Contact Details</h3>
                            
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Manager Name</label>
                                <input 
                                    type="text"
                                    value={formData.contact.manager}
                                    onChange={(e) => setFormData({...formData, contact: {...formData.contact, manager: e.target.value}})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="Manager name"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Phone</label>
                                <input 
                                    type="tel"
                                    value={formData.contact.phone}
                                    onChange={(e) => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="+91 1234567890"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Email</label>
                                <input 
                                    type="email"
                                    value={formData.contact.email}
                                    onChange={(e) => setFormData({...formData, contact: {...formData.contact, email: e.target.value}})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="branch@example.com"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">Address</h3>
                            
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Street</label>
                                <input 
                                    type="text"
                                    value={formData.address.street}
                                    onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="Street address"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">City</label>
                                    <input 
                                        type="text"
                                        value={formData.address.city}
                                        onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">State</label>
                                    <input 
                                        type="text"
                                        value={formData.address.state}
                                        onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Pincode</label>
                                <input 
                                    type="text"
                                    value={formData.address.pincode}
                                    onChange={(e) => setFormData({...formData, address: {...formData.address, pincode: e.target.value}})}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="Pincode"
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Permissions & Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Permissions */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Access Permissions</h3>
                                    <p className="text-xs text-gray-500 mt-1">Control what branch manager can view and do</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    {formData.permissions.length === AVAILABLE_PERMISSIONS.length ? 'Remove All' : 'Add All Modules'}
                                </button>
                            </div>

                            {/* Permissions Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm">Module</th>
                                            <th className="text-center py-3 px-4 font-bold text-gray-700 text-xs">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span>👁️</span>
                                                    <span>View</span>
                                                </div>
                                            </th>
                                            <th className="text-center py-3 px-4 font-bold text-gray-700 text-xs">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span>➕</span>
                                                    <span>Create</span>
                                                </div>
                                            </th>
                                            <th className="text-center py-3 px-4 font-bold text-gray-700 text-xs">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span>✏️</span>
                                                    <span>Edit</span>
                                                </div>
                                            </th>
                                            <th className="text-center py-3 px-4 font-bold text-gray-700 text-xs">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span>🗑️</span>
                                                    <span>Delete</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {AVAILABLE_PERMISSIONS.map((module) => {
                                            const permission = formData.permissions.find(p => p.module === module);
                                            const hasModule = Boolean(permission);
                                            
                                            return (
                                                <tr 
                                                    key={module} 
                                                    className={`border-b border-gray-100 transition-colors ${
                                                        hasModule ? 'bg-indigo-50/30' : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={hasModule}
                                                                onChange={() => handleTogglePermission(module)}
                                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            <span className={`font-semibold text-sm ${
                                                                hasModule ? 'text-indigo-900' : 'text-gray-600'
                                                            }`}>
                                                                {module}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            disabled={!hasModule}
                                                            checked={permission?.actions?.view || false}
                                                            onChange={() => handleToggleAction(module, 'view')}
                                                            className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            disabled={!hasModule}
                                                            checked={permission?.actions?.create || false}
                                                            onChange={() => handleToggleAction(module, 'create')}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            disabled={!hasModule}
                                                            checked={permission?.actions?.edit || false}
                                                            onChange={() => handleToggleAction(module, 'edit')}
                                                            className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            disabled={!hasModule}
                                                            checked={permission?.actions?.delete || false}
                                                            onChange={() => handleToggleAction(module, 'delete')}
                                                            className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="text-xs font-semibold text-gray-500 mb-3">QUICK ACTIONS</div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleBulkActionToggle('view', true)}
                                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-all"
                                    >
                                        Enable All View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkActionToggle('create', true)}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all"
                                    >
                                        Enable All Create
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkActionToggle('edit', true)}
                                        className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all"
                                    >
                                        Enable All Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkActionToggle('delete', true)}
                                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all"
                                    >
                                        Enable All Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkActionToggle('all', false)}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
                                    >
                                        Disable All Actions
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-4 mb-6">Branch Settings</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'allowNegativeStock', label: 'Allow Negative Stock', desc: 'Permit sales even when stock is zero' },
                                    { id: 'autoBackup', label: 'Auto Backup', desc: 'Automatically backup data daily' },
                                    { id: 'printAfterSave', label: 'Print After Save', desc: 'Auto-print invoices after saving' },
                                    { id: 'gstEnabled', label: 'GST Enabled', desc: 'Enable GST calculations' }
                                ].map((setting) => (
                                    <label 
                                        key={setting.id} 
                                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                                            formData.settings[setting.id] 
                                            ? 'border-indigo-600 bg-indigo-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="pt-0.5">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                formData.settings[setting.id] ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                                            }`}>
                                                {formData.settings[setting.id] && <CheckSquare size={12} className="text-white" />}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={formData.settings[setting.id]}
                                                onChange={() => setFormData(prev => ({
                                                    ...prev,
                                                    settings: {
                                                        ...prev.settings,
                                                        [setting.id]: !prev.settings[setting.id]
                                                    }
                                                }))}
                                            />
                                        </div>
                                        <div>
                                            <span className={`block text-sm font-bold ${formData.settings[setting.id] ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                {setting.label}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">{setting.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        {isEdit ? 'Update Branch' : 'Create Branch'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/branches')}
                                disabled={loading}
                                className="px-8 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <X size={20} />
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default CreateBranch;
