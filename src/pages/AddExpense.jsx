import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Calendar, FileText, ChevronDown, 
    Settings, Trash2, Plus, Check, Receipt
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';
import CategoryManagerModal from '../components/expenses/CategoryManagerModal';

const AddExpense = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID for edit mode
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(false);
    
    // Core Form Data
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        expenseNumber: '1',
        originalInvoiceNumber: '',
        partyName: '',
        category: '',
        paymentMode: 'Cash',
        description: '',
        accountId: '', // New field
        
        // GST Advanced Fields
        gstEnabled: false,
        gstInNumber: '',
        gstRate: 18, 
        taxType: 'Exclusive' // Inclusive or Exclusive
    });

    // Items State
    const [items, setItems] = useState([
        { id: 1, name: '', amount: '' } 
    ]);

    // Data Sources
    const [parties, setParties] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentModes] = useState(['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card']);
    const [gstRates] = useState([0, 5, 12, 18, 28]);
    const [accounts, setAccounts] = useState([]); // New State

    // UI States
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const categoryRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Init Data & Fetch for Edit
    useEffect(() => {
        fetchParties();
        fetchCategories();
        fetchAccounts(); // Fetch accounts
        
        if (isEditMode) {
            fetchExpenseDetails();
        } else {
            // Default expense Number only for new
            setFormData(prev => ({
                ...prev,
                expenseNumber: Math.floor(Math.random() * 1000) + 1
            }));
        }
    }, [id]);

    const fetchExpenseDetails = async () => {
        try {
            const response = await api.get(`/expenses/${id}`);
            const data = response.data;
            
            // Format date for input
            const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : '';

            setFormData({
                date: formattedDate,
                expenseNumber: data.expenseNumber || '',
                originalInvoiceNumber: data.originalInvoiceNumber || '',
                partyName: data.partyName || '',
                category: data.category || '',
                paymentMode: data.paymentMode || 'Cash',
                description: data.description || '',
                accountId: data.accountId || '', // Set account ID
                
                // GST Fields
                gstEnabled: data.gstEnabled || false,
                gstInNumber: data.gstInNumber || '',
                gstRate: data.gstRate !== undefined ? data.gstRate : 18,
                taxType: data.taxType || 'Exclusive'
            });

            if (data.items && data.items.length > 0) {
                setItems(data.items.map(item => ({...item, id: item._id || Date.now() + Math.random()})));
            }
        } catch (error) {
            console.error('Error fetching expense details:', error);
            Swal.fire('Error', 'Failed to load expense details', 'error');
            navigate('/expenses');
        }
    };

    const fetchParties = async () => {
        try {
            const response = await api.get('/parties');
            setParties(response.data);
        } catch (error) {
            console.error('Error fetching parties:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/expense-categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data); 
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    // --- CALCULATIONS ---
    const baseTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    let taxableAmount = 0;
    let gstAmount = 0;
    let finalTotal = 0;

    if (formData.gstEnabled) {
        const rate = Number(formData.gstRate) || 0;
        
        if (formData.taxType === 'Inclusive') {
            // Formula: Base = Total / (1 + rate/100)
            // Example: 118 total, 18% rate -> 118 / 1.18 = 100
            taxableAmount = baseTotal / (1 + rate / 100);
            gstAmount = baseTotal - taxableAmount;
            finalTotal = baseTotal;
        } else {
            // Exclusive
            // Example: 100 base, 18% -> Tax = 18. Total = 118
            taxableAmount = baseTotal;
            gstAmount = baseTotal * (rate / 100);
            finalTotal = baseTotal + gstAmount;
        }
    } else {
        finalTotal = baseTotal;
        taxableAmount = baseTotal;
        gstAmount = 0;
    }


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategorySelect = (catName) => {
        setFormData(prev => ({ ...prev, category: catName }));
        setIsCategoryOpen(false);
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const addItem = () => {
        setItems(prev => [
            ...prev, 
            { id: Date.now(), name: '', amount: '' }
        ]);
    };

    const removeItem = (id) => {
        if (items.length === 1) return; 
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.category) {
            Swal.fire('Error', 'Please select a Category', 'error');
            return;
        }

        if (finalTotal <= 0) {
            Swal.fire('Error', 'Total amount must be greater than 0', 'error');
            return;
        }

        const payload = {
            ...formData,
            items: items.map(({ id, ...rest }) => rest),
            // Save calculated values to backend
            totalAmount: finalTotal,
            taxableAmount,
            gstFullAmount: gstAmount
        };

        setLoading(true);
        try {
            if (isEditMode) {
                await api.put(`/expenses/${id}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Expense updated successfully!',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/expenses', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Expense saved successfully!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            setTimeout(() => {
                navigate('/expenses');
            }, 1000);
        } catch (error) {
            console.error('Error saving expense:', error);
            Swal.fire('Error', 'Failed to save expense', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
                <CategoryManagerModal 
                    isOpen={isManagerOpen} 
                    onClose={() => setIsManagerOpen(false)} 
                    onUpdate={fetchCategories}
                />

                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/expenses')}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-gray-700" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Expense' : 'Create Expense'}</h1>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3">

                        <button 
                            onClick={() => navigate('/expenses')}
                            className="hidden sm:block px-6 py-2 border border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 bg-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-4 py-2 sm:px-6 bg-[#4F46E5] text-white rounded-lg font-semibold shadow-sm hover:bg-[#4338CA] transition-all disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Main Form Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Left Column */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                        
                        {/* GST Toggle - Enhanced */}
                        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Receipt size={18} className="text-gray-500" />
                                    <span className="text-sm font-bold text-gray-700">Expense With GST</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="gstEnabled"
                                        checked={formData.gstEnabled}
                                        onChange={handleChange}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                                </label>
                            </div>

                            {/* Advanced GST Fields (Conditionally Rendered) */}
                            {formData.gstEnabled && (
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                                     {/* GSTIN */}
                                     <div className="col-span-2">
                                        <label className="text-xs text-gray-500 font-bold ml-1">Party GSTIN (Optional)</label>
                                        <input 
                                            type="text" 
                                            name="gstInNumber"
                                            value={formData.gstInNumber}
                                            onChange={handleChange}
                                            placeholder="e.g. 29AAAAA0000A1Z5"
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
                                        />
                                    </div>
                                    
                                    {/* Tax Type */}
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold ml-1">Tax Calculation</label>
                                        <div className="relative">
                                            <select 
                                                name="taxType"
                                                value={formData.taxType}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none font-medium"
                                            >
                                                <option value="Exclusive">Tax Excluded</option>
                                                <option value="Inclusive">Tax Included</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                        </div>
                                    </div>

                                    {/* GST Rate */}
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold ml-1">GST Rate</label>
                                        <div className="relative">
                                            <select 
                                                name="gstRate"
                                                value={formData.gstRate}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none font-medium"
                                            >
                                                {gstRates.map(rate => (
                                                    <option key={rate} value={rate}>{rate}%</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Custom Category Dropdown */}
                        <div className="space-y-1.5" ref={categoryRef}>
                            <label className="text-xs text-gray-500 font-medium ml-1">Expense Category</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all active:bg-gray-50"
                                >
                                    <span className={cn(formData.category ? "text-gray-900" : "text-gray-400")}>
                                        {formData.category || "Select Category"}
                                    </span>
                                    <ChevronDown size={16} className={cn("text-gray-400 transition-transform", isCategoryOpen && "rotate-180")} />
                                </button>
                                
                                {isCategoryOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                        <div className="max-h-60 overflow-y-auto">
                                            {categories.length === 0 && (
                                                <div className="p-3 text-xs text-gray-400 text-center">No categories found</div>
                                            )}
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat._id}
                                                    type="button"
                                                    onClick={() => handleCategorySelect(cat.name)}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-between group"
                                                >
                                                    {cat.name}
                                                    {formData.category === cat.name && <Check size={14} className="text-indigo-600" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCategoryOpen(false);
                                                    setIsManagerOpen(true);
                                                }}
                                                className="w-full py-2 border border-dashed border-sky-400 text-sky-500 rounded-lg text-sm font-bold hover:bg-sky-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                Add/Manage Category
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expense Number */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 font-medium ml-1">Expense Number</label>
                            <input 
                                type="text" 
                                name="expenseNumber"
                                value={formData.expenseNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                        </div>

                        {/* Party Fetching */}
                         <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 font-medium ml-1">Party (Optional)</label>
                            <div className="relative">
                                <select 
                                    name="partyName"
                                    value={formData.partyName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none appearance-none"
                                >
                                    <option value="">Select Party</option>
                                    {parties.map(party => (
                                        <option key={party._id} value={party.name}>{party.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                    </div>

                    {/* Right Column */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                        {/* Original Invoice Number */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-gray-500 font-medium ml-1">Original Invoice Number</label>
                                <input 
                                    type="text" 
                                    name="originalInvoiceNumber"
                                    value={formData.originalInvoiceNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none"
                                />
                            </div>
                             <div className="space-y-1.5">
                                <label className="text-xs text-gray-500 font-medium ml-1">Date</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Mode */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 font-medium ml-1">Payment Mode</label>
                            <div className="relative">
                                <select 
                                    name="paymentMode"
                                    value={formData.paymentMode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none appearance-none"
                                >
                                    <option value="Select">Select</option>
                                    {paymentModes.map(mode => (
                                        <option key={mode} value={mode}>{mode}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Accounts Selection */}
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                            <label className="text-xs text-gray-500 font-medium ml-1">Paid From Account (Optional)</label>
                            <div className="relative">
                                <select 
                                    name="accountId"
                                    value={formData.accountId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none appearance-none font-medium"
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(account => (
                                        <option key={account._id} value={account._id}>
                                            {account.name} {account.bankName ? `(${account.bankName})` : ''} - {account.type}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Note */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-500 font-medium ml-1">Note</label>
                            <textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter Notes"
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                            />
                        </div>
                        
                        {/* GST Summary Box - Shows when GST Enabled */}
                        {formData.gstEnabled && (
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-2">
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-2">GST Breakdown</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Taxable Value</span>
                                    <span className="font-semibold text-gray-900">₹ {taxableAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">GST ({formData.gstRate}%)</span>
                                    <span className="font-semibold text-gray-900">₹ {gstAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    
                    {/* Items List */}
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="bg-gray-50/50 rounded-xl p-3 sm:p-4 border border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center animate-in fade-in slide-in-from-top-2 relative group">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block pl-1 sm:hidden">Description</label>
                                    <input 
                                        type="text"
                                        placeholder="What is this expense for?"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-100 outline-none placeholder:text-gray-400 placeholder:font-normal"
                                    />
                                </div>
                                <div className="flex items-end gap-3">
                                    <div className="w-full sm:w-48 relative">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block pl-1 sm:hidden">Amount</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</div>
                                            <input 
                                                type="number"
                                                placeholder="0.00"
                                                value={item.amount}
                                                onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none text-right font-mono font-bold text-gray-900"
                                            />
                                        </div>
                                    </div>
                                    {items.length > 1 && (
                                        <button 
                                            onClick={() => removeItem(item.id)}
                                            className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-lg transition-all sm:self-end self-end"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Item Button */}
                    <button 
                        onClick={addItem}
                        className="w-full py-3 border-2 border-dashed border-[#4F46E5]/30 text-[#4F46E5] rounded-xl text-sm font-bold hover:bg-[#4F46E5]/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>

                {/* Footer / Totals */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                         <span className="text-gray-700 font-medium">Total Expense Amount</span>
                         <div className="bg-gray-100 rounded-lg px-4 py-2 w-48 text-right font-mono font-bold text-gray-900 text-lg">
                            ₹ {finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                         </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default AddExpense;
