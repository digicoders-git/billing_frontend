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
            { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', rate: 0, amount: 0 }
        ],
        notes: '',
        terms: '1. Please supply the goods as per the specifications.\n2. Delivery should be within the stipulated time.\n3. Payment will be processed after inspection of goods.',
        additionalCharges: 0,
        overallDiscount: 0,
        overallDiscountType: 'percentage', // 'percentage' or 'fixed'
        autoRoundOff: true,
        status: 'Pending'
    });

    const [parties, setParties] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [searchParty, setSearchParty] = useState('');
    const [showPartyDropdown, setShowPartyDropdown] = useState(false);
    
    // Item Search State
    const [activeItemSearchIndex, setActiveItemSearchIndex] = useState(null);
    const [itemSearchTerm, setItemSearchTerm] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [partiesRes, itemsRes, nextNoRes] = await Promise.all([
                    api.get('/parties'),
                    api.get('/items'),
                    api.get('/purchase-orders/next-po')
                ]);
                
                console.log('✅ Parties fetched:', partiesRes.data);
                console.log('✅ Items fetched:', itemsRes.data);
                console.log('✅ Next PO Number:', nextNoRes.data);
                
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

    // Item Management Logic
    const updateItem = (tempId, field, value) => {
        setFormData(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === tempId) {
                    const updatedItem = { ...item, [field]: value };
                    updatedItem.amount = (parseFloat(updatedItem.qty) || 0) * (parseFloat(updatedItem.rate) || 0);
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const handleSelectProduct = (index, product) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = {
                ...newItems[index],
                itemId: product._id,
                name: product.name,
                hsn: product.hsn || '',
                rate: product.purchasePrice || 0,
                unit: product.unit || 'PCS',
                amount: (product.purchasePrice || 0) * (newItems[index].qty || 1)
            };

            // Auto-add new row if selecting for the last row
            if (index === newItems.length - 1) {
                newItems.push({ id: Date.now() + 1, itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', rate: 0, amount: 0 });
            }

            return { ...prev, items: newItems };
        });
        setActiveItemSearchIndex(null);
        setItemSearchTerm('');
    };

    const removeItem = (tempId) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({ 
                ...prev, 
                items: prev.items.filter(item => item.id !== tempId) 
            }));
        }
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
                    rate: parseFloat(item.rate) || 0,
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
                                            className="text-xs font-bold text-rose-500 hover:underline"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Items Section */}
                            <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                                <div className="p-6 border-b border-gray-50 bg-[#FDFDFF] flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                        <span className="text-[11px] font-black text-gray-900 uppercase tracking-[3px]">Line Requisition Archiving</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registry Sync: Active</span>
                                        <div className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">
                                            Items: {formData.items.filter(i => i.itemId).length}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/30 text-[9px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-100/50 italic">
                                                <th className="px-10 py-6 w-24 opacity-30 text-center">#</th>
                                                <th className="px-6 py-6 min-w-[300px]">Item Description & HSN Audit</th>
                                                <th className="px-6 py-6 text-center w-32">Procure Qty</th>
                                                <th className="px-6 py-6 text-right w-44">Audit Rate (₹)</th>
                                                <th className="px-10 py-6 text-right w-48 font-black">Line Value Audit</th>
                                                <th className="px-8 py-6 w-24"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50/50">
                                            {formData.items.map((item, index) => (
                                                <tr key={item.id} className="group/row hover:bg-[#F9FAFF] transition-all">
                                                    <td className="px-10 py-8 text-[11px] font-black text-gray-200 italic group-hover/row:text-indigo-400 transition-colors uppercase text-center">{index + 1}</td>
                                                    <td className="px-6 py-8 relative text-left">
                                                        <div className="flex flex-col gap-2">
                                                            <input 
                                                                type="text" 
                                                                className="w-full bg-transparent border-none outline-none text-[14px] font-black text-gray-900 uppercase placeholder:text-gray-200 group-hover/row:placeholder:text-gray-300 transition-all font-sans italic tracking-tighter"
                                                                placeholder="INDENT NEW ITEM..."
                                                                value={activeItemSearchIndex === item.id ? itemSearchTerm : item.name}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setItemSearchTerm(val);
                                                                    setActiveItemSearchIndex(item.id);
                                                                    if (!val) updateItem(item.id, 'name', '');
                                                                }}
                                                                onFocus={() => {
                                                                    setActiveItemSearchIndex(item.id);
                                                                    setItemSearchTerm(item.name);
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[9px] font-black text-indigo-400/50 uppercase tracking-[3px] italic bg-indigo-50/50 px-2.5 py-1 rounded-lg">HSN: {item.hsn || 'PENDING'}</span>
                                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[2px]">{item.unit || 'PCS'} REGISTRY</span>
                                                            </div>
                                                        </div>

                                                        {activeItemSearchIndex === item.id && inventoryItems.length > 0 && (
                                                            <>
                                                                <div className="fixed inset-0 z-[9998]" onClick={() => setActiveItemSearchIndex(null)} />
                                                                <div className="absolute top-full left-6 w-[400px] bg-white border border-gray-200 rounded-[24px] shadow-2xl mt-4 z-[9999] max-h-80 overflow-y-auto ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                                                    {inventoryItems.filter(p => !itemSearchTerm || p.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).length > 0 ? (
                                                                        inventoryItems.filter(p => !itemSearchTerm || p.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).map(product => (
                                                                            <div 
                                                                                key={product._id} 
                                                                                className="px-8 py-5 hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-between group/suggest border-b border-gray-50 last:border-0"
                                                                                onClick={() => handleSelectProduct(index, product)}
                                                                            >
                                                                                <div className="flex flex-col">
                                                                                    <div className="font-black text-[13px] text-gray-900 uppercase tracking-tight group-hover/suggest:text-indigo-600 transition-colors">{product.name}</div>
                                                                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-[2px] mt-1">Archived Rate: <span className="text-gray-900">₹ {product.purchasePrice?.toLocaleString()}</span> | HSN: {product.hsn || 'NA'}</div>
                                                                                </div>
                                                                                <ArrowRight size={16} className="text-gray-200 group-hover/suggest:translate-x-1 transition-all group-hover/suggest:text-indigo-600" />
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="p-8 text-center text-gray-400 italic">
                                                                            <div className="text-[11px] font-black uppercase tracking-[4px]">Product Not Found</div>
                                                                            <p className="text-[9px] mt-2 mb-4">RECORD MANUALLY BELOW</p>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    updateItem(item.id, 'name', itemSearchTerm);
                                                                                    setActiveItemSearchIndex(null);
                                                                                }}
                                                                                className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                                                            >
                                                                                Use Custom Meta
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <div className="inline-flex items-center gap-3 bg-gray-50 rounded-[14px] p-2.5 border border-transparent focus-within:bg-white focus-within:border-indigo-100 transition-all w-28">
                                                            <input 
                                                                type="number" 
                                                                className="w-full bg-transparent border-none outline-none text-center text-[13px] font-black text-gray-900"
                                                                value={item.qty}
                                                                onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8 text-right">
                                                        <div className="inline-flex items-center gap-3 bg-gray-50 rounded-[14px] p-3 border border-transparent focus-within:bg-white focus-within:border-indigo-100 transition-all w-40 group/rate">
                                                            <span className="text-[11px] font-black text-gray-300 italic group-focus-within/rate:text-indigo-400 transition-colors">₹</span>
                                                            <input 
                                                                type="number" 
                                                                className="w-full bg-transparent border-none outline-none text-right text-[14px] font-black text-gray-900 italic tracking-tighter"
                                                                value={item.rate}
                                                                onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right font-black text-gray-900 text-xl italic tracking-tighter group-hover/row:scale-105 transition-transform origin-right">
                                                        <span className="text-[11px] font-bold text-gray-200 mr-2 not-italic">₹</span>
                                                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-8 py-8 text-center">
                                                        <button 
                                                            onClick={() => removeItem(item.id)} 
                                                            className="p-3 text-gray-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/row:opacity-100 active:scale-75"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <button 
                                        onClick={() => setFormData(p => ({...p, items: [...p.items, {id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', rate: 0, amount: 0}]}))}
                                        className="px-10 py-4 bg-gray-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[3px] shadow-sm hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3 group"
                                    >
                                        <Plus size={18} />
                                        Manual Acquisition Line
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic leading-none">Total Indent Count:</span>
                                        <span className="text-lg font-black text-gray-900 italic leading-none">{formData.items.length} Rows</span>
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
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                                <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                    <Calculator size={16} className="text-indigo-500" />
                                    Financial Summary
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-900">₹ {totals.subtotal.toLocaleString()}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                                            <span>Additional Charges</span>
                                            <span>+ ₹</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-300 px-4 py-2.5 rounded-lg text-right text-sm font-semibold outline-none transition-all"
                                            value={formData.additionalCharges} 
                                            onChange={e => setFormData({...formData, additionalCharges: e.target.value})} 
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                        <div className="flex justify-between items-center text-xs font-semibold text-rose-500">
                                            <select 
                                                className="bg-transparent border-none outline-none text-xs font-semibold cursor-pointer"
                                                value={formData.overallDiscountType}
                                                onChange={(e) => setFormData({...formData, overallDiscountType: e.target.value})}
                                            >
                                                <option value="percentage">Discount %</option>
                                                <option value="fixed">Discount ₹</option>
                                            </select>
                                            <span>- ₹</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            className="w-full bg-rose-50 border border-rose-200 focus:bg-white focus:border-rose-300 px-4 py-2.5 rounded-lg text-right text-sm font-semibold text-rose-600 outline-none transition-all"
                                            value={formData.overallDiscount} 
                                            onChange={e => setFormData({...formData, overallDiscount: e.target.value})} 
                                        />
                                        <div className="text-xs text-rose-400 text-right">- ₹ {totals.discountVal.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-indigo-600">Total Amount</span>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={formData.autoRoundOff} onChange={e => setFormData({...formData, autoRoundOff: e.target.checked})} className="w-3 h-3 rounded cursor-pointer" />
                                            <span className="text-xs text-gray-400">Round Off</span>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900">
                                        ₹ {totals.roundedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-indigo-400 text-right mt-2">Round Off: ₹ {totals.roundOffDiff}</div>
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
        </DashboardLayout>
    );
};

export default AddPurchaseOrder;
