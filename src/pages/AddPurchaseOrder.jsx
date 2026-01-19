import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Plus, Trash2, Calendar, 
  Hash, FileText, Settings, 
  ArrowLeft, Search, X,
  Truck, Save, ScanBarcode,
  ChevronDown, Calculator, User,
  FileSearch, CheckCircle2, ShoppingCart, Info,
  Package, DollarSign, ArrowRight
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

const AddPurchaseOrder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        orderNo: '',
        date: new Date().toISOString().split('T')[0],
        expiryDate: '',
        party: null,
        items: [
            { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', gstAmount: 0, amount: 0 }
        ],
        notes: '',
        terms: '1. Please supply the goods as per the specifications.\n2. Delivery should be within the stipulated time.\n3. Payment will be processed after inspection of goods.',
        additionalCharges: 0,
        overallDiscount: 0,
        overallDiscountType: 'percentage',
        autoRoundOff: true,
        status: 'Pending'
    });

    const [parties, setParties] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [searchParty, setSearchParty] = useState('');
    const [showPartyDropdown, setShowPartyDropdown] = useState(false);
    
    // Item Picker Modal State
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState(null);
    const [itemPickerSearch, setItemPickerSearch] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [partiesRes, itemsRes, nextNoRes] = await Promise.all([
                    api.get('/parties'),
                    api.get('/items'),
                    api.get('/purchase-orders/next-po')
                ]);
                
                setParties(partiesRes.data || []);
                setInventoryItems(itemsRes.data || []);

                if (!isEdit) {
                    setFormData(prev => ({ 
                        ...prev, 
                        orderNo: `PO-${nextNoRes.data.nextNo.padStart(3, '0')}` 
                    }));
                }
            } catch (error) {
                console.error("❌ Error fetching dependencies:", error);
                Swal.fire('Error', 'Failed to load registry dependencies', 'error');
            } finally {
                setLoading(false);
            }
        };

        const fetchEditData = async () => {
            if (!isEdit) return;
            try {
                const res = await api.get(`/purchase-orders/${id}`);
                const data = res.data;
                setFormData({
                    ...data,
                    party: data.party,
                    date: new Date(data.date).toISOString().split('T')[0],
                    expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : '',
                    items: data.items.map(it => ({ ...it, id: it._id || Date.now() + Math.random() }))
                });
            } catch (error) {
                console.error("Error fetching order:", error);
                Swal.fire('Error', 'Failed to load purchase order details', 'error');
                navigate('/purchases/orders');
            }
        };

        fetchInitialData();
        if (isEdit) fetchEditData();
    }, [id, isEdit, navigate]);

    // Handle Item Updates with GST
    const updateItem = (tempId, field, value) => {
        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === tempId) {
                    const updatedItem = { ...item, [field]: value };
                    
                    // Calculate amount with GST
                    const qty = parseFloat(updatedItem.qty) || 0;
                    const rate = parseFloat(updatedItem.rate) || 0;
                    const discPercent = parseFloat(updatedItem.discount) || 0;
                    const gstStr = updatedItem.gstRate || 'None';
                    
                    // Extract GST percentage
                    let gstPercent = 0;
                    if (gstStr.includes('@')) {
                        const matches = gstStr.match(/(\d+(\.\d+)?)%|@\s*(\d+(\.\d+)?)/g);
                        if (matches) {
                            gstPercent = matches.reduce((acc, val) => {
                                const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                                return acc + (isNaN(num) ? 0 : num);
                            }, 0);
                        }
                    }
                    
                    const baseAmount = qty * rate;
                    const discAmount = (baseAmount * discPercent) / 100;
                    const taxableAmount = baseAmount - discAmount;
                    const gstAmount = (taxableAmount * gstPercent) / 100;
                    
                    updatedItem.gstAmount = gstAmount;
                    updatedItem.amount = taxableAmount + gstAmount;
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const selectItemFromPicker = (itemData) => {
        if (activeItemIndex === null) return;
        
        setFormData(prev => {
            const newItems = [...prev.items];
            const qty = newItems[activeItemIndex].qty || 1;
            const rate = itemData.purchasePrice || 0;
            
            newItems[activeItemIndex] = {
                ...newItems[activeItemIndex],
                itemId: itemData._id,
                name: itemData.name,
                code: itemData.code,
                hsn: itemData.hsn || '',
                mrp: itemData.mrp || 0,
                rate: rate,
                gstRate: itemData.gstRate || 'None',
                unit: itemData.unit || 'PCS',
                amount: rate * qty
            };
            return { ...prev, items: newItems };
        });
        
        setShowItemPicker(false);
        setActiveItemIndex(null);
        setItemPickerSearch('');
    };

    const removeItem = (tempId) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({ 
                ...prev, 
                items: prev.items.filter(item => item.id !== tempId) 
            }));
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', gstAmount: 0, amount: 0 }]
        }));
    };

    // Calculations
    const totals = useMemo(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const taxableAmount = subtotal + (parseFloat(formData.additionalCharges) || 0);
        
        let discountVal = 0;
        if (formData.overallDiscountType === 'percentage') {
            discountVal = (taxableAmount * (parseFloat(formData.overallDiscount) || 0)) / 100;
        } else {
            discountVal = parseFloat(formData.overallDiscount) || 0;
        }

        const totalBeforeRound = taxableAmount - discountVal;
        const roundedTotal = formData.autoRoundOff ? Math.round(totalBeforeRound) : totalBeforeRound;
        const roundOffDiff = (roundedTotal - totalBeforeRound).toFixed(2);

        return { subtotal, taxableAmount, roundedTotal, roundOffDiff, discountVal };
    }, [formData]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.party) {
            Swal.fire({
                icon: 'error',
                title: 'Party Required',
                text: 'Please select a supplier for this order.',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }

        const validItems = formData.items.filter(it => it.name.trim() !== '' && it.itemId);
        if (validItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Items',
                text: 'Please select at least one valid inventory item.',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                party: formData.party._id,
                partyName: formData.party.name,
                items: validItems.map(item => ({
                    itemId: item.itemId,
                    name: item.name,
                    hsn: item.hsn || '',
                    qty: parseFloat(item.qty) || 0,
                    unit: item.unit || 'PCS',
                    mrp: parseFloat(item.mrp) || 0,
                    rate: parseFloat(item.rate) || 0,
                    discount: parseFloat(item.discount) || 0,
                    gstRate: item.gstRate,
                    gstAmount: parseFloat(item.gstAmount) || 0,
                    amount: parseFloat(item.amount) || 0
                })),
                totalAmount: totals.roundedTotal,
                subtotal: totals.subtotal,
                overallDiscount: totals.discountVal,
                roundOffDiff: totals.roundOffDiff
            };

            if (isEdit) {
                await api.put(`/purchase-orders/${id}`, payload);
            } else {
                await api.post('/purchase-orders', payload);
            }

            Swal.fire({
                icon: 'success',
                title: isEdit ? 'Registry Updated' : 'Order Created',
                text: `Purchase Order ${formData.orderNo} saved successfully.`,
                timer: 2000,
                showConfirmButton: false
            });
            navigate('/purchases/orders');
        } catch (error) {
            console.error("Submission error:", error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to sync with registry engine', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Filtered items for picker
    const filteredPickerItems = useMemo(() => {
        return inventoryItems.filter(item => 
            item.name.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
            (item.code && item.code.toLowerCase().includes(itemPickerSearch.toLowerCase()))
        );
    }, [inventoryItems, itemPickerSearch]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Initializing Acquisition Engine...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/30 pb-24">
                {/* Header Section */}
                <div className="max-w-[1600px] mx-auto px-6 py-8 no-print">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="group flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-gray-400 hover:text-indigo-600"
                            >
                                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic underline decoration-indigo-500/20 underline-offset-8 decoration-4">
                                        {isEdit ? 'Edit' : 'Draft'} Purchase Order
                                    </h1>
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${isEdit ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                        {isEdit ? 'Registry Update' : 'New Procurement'}
                                    </span>
                                </div>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] mt-3">
                                    Inventory Acquisition Registry System
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-[24px] text-[11px] font-black shadow-2xl shadow-gray-900/10 hover:bg-indigo-600 hover:-translate-y-1 transition-all uppercase tracking-[2px] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Sync Entry</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto px-6 py-8">
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* Main Content (Left 9) */}
                        <div className="col-span-12 lg:col-span-9 space-y-6">
                            
                            {/* Supplier Selection Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm overflow-visible">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                        <Truck size={18} className="text-gray-400" />
                                        <span>Supplier Account Selection</span>
                                    </div>
                                    {formData.party && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
                                            <CheckCircle2 size={14} className="text-green-500" />
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active Supplier</span>
                                        </div>
                                    )}
                                </div>

                                {!formData.party ? (
                                    <div className="relative">
                                        <div className="flex items-center gap-4 px-6 py-6 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all cursor-pointer">
                                            <Search size={20} className="text-gray-300" />
                                            <input 
                                                type="text" 
                                                placeholder="Search supplier registry..." 
                                                className="bg-transparent border-none outline-none w-full text-sm font-semibold placeholder:text-gray-300"
                                                value={searchParty}
                                                onChange={(e) => { setSearchParty(e.target.value); setShowPartyDropdown(true); }}
                                                onFocus={() => setShowPartyDropdown(true)}
                                            />
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); navigate('/add-party'); }}
                                                className="bg-gray-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-90"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>

                                        {showPartyDropdown && parties.length > 0 && (
                                            <>
                                                <div className="fixed inset-0 z-[9998]" onClick={() => setShowPartyDropdown(false)} />
                                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-2 z-[9999] max-h-80 overflow-y-auto">
                                                    {(() => {
                                                        const filtered = parties.filter(p => !searchParty || p.name.toLowerCase().includes(searchParty.toLowerCase()));
                                                        return filtered.length > 0 ? (
                                                            filtered.map(party => (
                                                                <div 
                                                                    key={party._id} 
                                                                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-between border-b border-gray-50 last:border-0"
                                                                    onClick={() => {
                                                                        setFormData(prev => ({ ...prev, party }));
                                                                        setShowPartyDropdown(false);
                                                                        setSearchParty('');
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center font-bold uppercase">
                                                                            {party.name[0]}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <div className="font-bold text-sm text-gray-900">{party.name}</div>
                                                                            <div className="text-xs text-gray-400">GSTIN: {party.gstin || 'N/A'}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-8 text-center text-gray-400">
                                                                <div className="text-sm font-bold">Supplier Not Found</div>
                                                                <p className="text-xs mt-2 mb-4">No matching records in registry</p>
                                                                <button 
                                                                    onClick={() => navigate('/add-party')}
                                                                    className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                                                                >
                                                                    Create New Supplier
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                                                {formData.party.name[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-black text-gray-900">{formData.party.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-500">GSTIN: {formData.party.gstin || 'N/A'}</span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">{formData.party.mobile || 'No contact'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setFormData(prev => ({ ...prev, party: null }))} 
                                            className="text-xs font-bold text-rose-500"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Items Section */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Line Items</h3>
                                </div>
                                
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                <th className="px-4 py-3 text-left w-12">NO</th>
                                                <th className="px-4 py-3 text-left min-w-[200px]">ITEMS/ SERVICES</th>
                                                <th className="px-4 py-3 text-left w-24">HSN</th>
                                                <th className="px-4 py-3 text-right w-28">MRP (₹)</th>
                                                <th className="px-4 py-3 text-center w-24">QTY</th>
                                                <th className="px-4 py-3 text-right w-28">PRICE (₹)</th>
                                                <th className="px-4 py-3 text-left w-32">GST</th>
                                                <th className="px-4 py-3 text-right w-24">DISC %</th>
                                                <th className="px-4 py-3 text-right w-32">AMOUNT (₹)</th>
                                                <th className="px-4 py-3 text-center w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.items.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-4 py-3 text-center text-sm text-gray-400 font-medium">{index + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <div 
                                                            className="w-full bg-transparent border-b border-gray-200 px-2 py-1 text-sm font-medium text-gray-800 hover:border-indigo-400 focus-within:border-indigo-500 transition-all cursor-pointer flex items-center gap-2"
                                                            onClick={() => {
                                                                setActiveItemIndex(index);
                                                                setShowItemPicker(true);
                                                            }}
                                                        >
                                                            {item.name ? (
                                                                <span className="flex-1 truncate">{item.name}</span>
                                                            ) : (
                                                                <span className="flex-1 text-gray-400">Search Item...</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-transparent border-b border-gray-200 px-2 py-1 text-xs text-center font-medium text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                                                            placeholder="HSN"
                                                            value={item.hsn}
                                                            onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-transparent border-b border-gray-200 px-2 py-1 text-sm text-right font-medium text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                                                            placeholder="0"
                                                            value={item.mrp || ''}
                                                            onChange={(e) => updateItem(item.id, 'mrp', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <input 
                                                                type="number" 
                                                                className="w-12 bg-transparent border-b border-gray-200 px-1 py-1 text-center text-sm font-bold text-indigo-600 focus:border-indigo-500 outline-none"
                                                                value={item.qty}
                                                                onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                            />
                                                            <span className="text-[9px] text-gray-400 font-medium uppercase">{item.unit}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-transparent border-b border-gray-200 px-2 py-1 text-sm text-right font-medium text-gray-800 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <select
                                                            value={item.gstRate}
                                                            onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)}
                                                            className="w-full bg-transparent border-b border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                                        >
                                                            {gstOptions.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-transparent border-b border-gray-200 px-2 py-1 text-xs text-right font-medium text-gray-500 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                                                            value={item.discount}
                                                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-indigo-600 text-sm">
                                                        ₹ {item.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-2 py-3 text-center">
                                                        <Trash2 
                                                            size={16} 
                                                            className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 mx-auto"
                                                            onClick={() => removeItem(item.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View */}
                                <div className="md:hidden divide-y divide-gray-100">
                                    {formData.items.map((item, index) => (
                                        <div key={item.id} className="p-4 bg-white space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">ITEM {index + 1}</span>
                                                <button onClick={() => removeItem(item.id)}><X size={16} className="text-gray-400 hover:text-red-500" /></button>
                                            </div>
                                            <div 
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:border-indigo-300 transition-all"
                                                onClick={() => {
                                                    setActiveItemIndex(index);
                                                    setShowItemPicker(true);
                                                }}
                                            >
                                                {item.name || 'Tap to select item...'}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">HSN</label>
                                                    <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="HSN" value={item.hsn} onChange={(e) => updateItem(item.id, 'hsn', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">MRP</label>
                                                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="0" value={item.mrp || ''} onChange={(e) => updateItem(item.id, 'mrp', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Qty</label>
                                                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-indigo-600" placeholder="1" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Price</label>
                                                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="0" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">GST</label>
                                                    <select value={item.gstRate} onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium">
                                                        {gstOptions.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Disc %</label>
                                                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="0" value={item.discount} onChange={(e) => updateItem(item.id, 'discount', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                                                <span className="text-base font-bold text-indigo-600">₹ {item.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Item Button */}
                                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                                    <div 
                                        className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group"
                                        onClick={addItem}
                                    >
                                        <Plus size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                        <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600 uppercase tracking-wider">Add Item</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Sidebar (Right 3) */}
                        <div className="col-span-12 lg:col-span-3 space-y-6 text-left">
                            
                            {/* Meta Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                                <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                    <FileSearch size={16} className="text-indigo-500" />
                                    Order Details
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 block">PO Number</label>
                                        <input 
                                            type="text" 
                                            value={formData.orderNo} 
                                            onChange={e => setFormData({...formData, orderNo: e.target.value})} 
                                            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-300 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-900 outline-none transition-all" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 block">Order Date</label>
                                        <input 
                                            type="date" 
                                            value={formData.date} 
                                            onChange={e => setFormData({...formData, date: e.target.value})} 
                                            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-300 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-900 outline-none transition-all" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-rose-500 block">Expiry Date (Optional)</label>
                                        <input 
                                            type="date" 
                                            value={formData.expiryDate} 
                                            onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                                            className="w-full bg-rose-50 border border-rose-200 focus:bg-white focus:border-rose-300 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-600 outline-none transition-all" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Finance Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Subtotal</span>
                                        <span className="text-sm font-black text-gray-800">₹ {totals.subtotal.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center group gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 cursor-pointer">
                                                <Plus size={10} /> Add Charges
                                            </span>
                                        </div>
                                        <input 
                                            type="number" 
                                            value={formData.additionalCharges} 
                                            onChange={(e) => setFormData({...formData, additionalCharges: parseFloat(e.target.value) || 0})}
                                            className="w-20 text-right bg-transparent border-b border-dashed border-gray-200 outline-none text-xs font-bold"
                                        />
                                    </div>

                                    <div className="flex justify-between items-center group gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 cursor-pointer">
                                                <Plus size={10} /> Discount
                                            </span>
                                            <select 
                                                value={formData.overallDiscountType}
                                                onChange={(e) => setFormData({...formData, overallDiscountType: e.target.value})}
                                                className="text-[9px] bg-blue-50 text-blue-600 border-none rounded p-0.5 outline-none"
                                            >
                                                <option value="percentage">%</option>
                                                <option value="fixed">Flat</option>
                                            </select>
                                        </div>
                                        <input 
                                            type="number" 
                                            value={formData.overallDiscount} 
                                            onChange={(e) => setFormData({...formData, overallDiscount: parseFloat(e.target.value) || 0})}
                                            className="w-20 text-right bg-transparent border-b border-dashed border-gray-200 outline-none text-xs font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-6 bg-gray-50 p-2 rounded-xl">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.autoRoundOff}
                                            onChange={(e) => setFormData({...formData, autoRoundOff: e.target.checked})}
                                            className="w-4 h-4 rounded text-black border-gray-300 focus:ring-0 cursor-pointer" 
                                        />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Auto Round Off</span>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Total Amount</label>
                                        <div className="bg-black p-4 rounded-2xl text-white shadow-xl shadow-gray-200 transform hover:scale-[1.02] transition-transform duration-300">
                                            <div className="text-3xl font-black tracking-tight">₹ {totals.roundedTotal.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                                <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                    <Settings size={16} className="text-indigo-500" />
                                    Order Status
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Pending', 'Approved', 'Cancelled', 'Delivered'].map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setFormData({...formData, status: st})}
                                            className={cn(
                                                "px-4 py-2.5 rounded-lg text-xs font-bold border transition-all active:scale-95",
                                                formData.status === st 
                                                    ? "bg-gray-900 text-white border-gray-900" 
                                                    : "bg-white text-gray-400 border-gray-200 hover:border-indigo-300"
                                            )}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Item Picker Modal */}
            {showItemPicker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Select Item</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Choose from your inventory</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowItemPicker(false);
                                    setActiveItemIndex(null);
                                    setItemPickerSearch('');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="text"
                                    placeholder="Search by item name or code..."
                                    value={itemPickerSearch}
                                    onChange={(e) => setItemPickerSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-sm font-medium"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredPickerItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <Package size={48} className="mb-4 opacity-50" />
                                    <p className="text-sm font-bold uppercase tracking-wider">No items found</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            <th className="px-6 py-3 text-left">Item Name</th>
                                            <th className="px-6 py-3 text-left">Code</th>
                                            <th className="px-6 py-3 text-center">Stock</th>
                                            <th className="px-6 py-3 text-right">MRP (₹)</th>
                                            <th className="px-6 py-3 text-right">Purchase Price (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredPickerItems.map(item => (
                                            <tr 
                                                key={item._id}
                                                onClick={() => selectItemFromPicker(item)}
                                                className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-sm text-gray-900 group-hover:text-indigo-600">{item.name}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">HSN: {item.hsn || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600">{item.code || '-'}</td>
                                                <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">{item.stock} {item.unit}</td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-700">₹{item.mrp || 0}</td>
                                                <td className="px-6 py-4 text-right text-base font-black text-indigo-600">₹{item.purchasePrice || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AddPurchaseOrder;
