import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Plus, Trash2, Calendar, 
  Hash, FileText, Settings, 
  ArrowLeft, Search, X,
  Truck, Save, ScanBarcode,
  ChevronDown, Calculator, User
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const AddPurchaseReturn = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    returnNo: '',
    date: new Date().toISOString().split('T')[0],
    originalInvoiceNo: '',
    party: null,
    items: [
      { id: Date.now(), name: '', hsn: '', qty: 1, unit: 'PCS', rate: 0, amount: 0 }
    ],
    notes: '',
    terms: '1. Goods returned must be in original packaging.\n2. Replacement or Credit Note will be issued post inspection.',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage',
    autoRoundOff: true,
    type: 'Purchase Return'
  });

  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [searchVendor, setSearchVendor] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Item Autocomplete State
  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [vendorsRes, nextNoRes, itemsRes] = await Promise.all([
                api.get('/parties'),
                api.get('/returns/next-receipt?type=Purchase Return'),
                api.get('/items')
            ]);
            // Keep all parties but we'll show them as searchable vendors
            setVendors(vendorsRes.data || []);
            setItems(itemsRes.data || []);
            if (!isEdit) {
                setFormData(prev => ({ ...prev, returnNo: `PR-${nextNoRes.data.nextNo.padStart(3, '0')}` }));
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchEditData = async () => {
        if (!isEdit) return;
        setLoading(true);
        try {
            const response = await api.get(`/returns/${id}`);
            const data = response.data;
            setFormData({
                ...data,
                party: data.party,
                additionalCharges: data.additionalCharges || 0,
                overallDiscount: data.overallDiscount || 0,
                items: data.items.map(it => ({ ...it, id: it._id })), // Ensure local id exists
                date: new Date(data.date).toISOString().split('T')[0]
            });
        } catch (error) {
            console.error("Error fetching return for edit:", error);
            Swal.fire('Error', 'Failed to load return data', 'error');
            navigate('/purchases/returns');
        } finally {
            setLoading(false);
        }
    };

    fetchData();
    if (isEdit) fetchEditData();
  }, [id, isEdit, navigate]);

  const updateItem = (itemId, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === itemId || item._id === itemId) {
          const updatedItem = { ...item, [field]: value };
          const baseAmount = (parseFloat(updatedItem.qty) || 0) * (parseFloat(updatedItem.rate) || 0);
          updatedItem.amount = baseAmount;
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const selectItem = (index, itemData) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        itemId: itemData._id,
        name: itemData.name,
        hsn: itemData.hsn || '',
        rate: itemData.purchasePrice || itemData.sellingPrice || 0,
        unit: itemData.unit || 'PCS',
        amount: (itemData.purchasePrice || itemData.sellingPrice || 0) * (newItems[index].qty || 1)
      };
      return { ...prev, items: newItems };
    });
    setActiveItemSearchIndex(null);
    setItemSearchTerm('');
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), name: '', hsn: '', qty: 1, unit: 'PCS', rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (itemId) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ 
        ...prev, 
        items: prev.items.filter(item => (item.id !== itemId && item._id !== itemId)) 
      }));
    }
  };

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

    return { subtotal, taxableAmount, discountVal, roundedTotal, roundOffDiff };
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party) {
        Swal.fire({
            icon: 'error',
            title: 'Incomplete Audit',
            text: 'Please select a vendor to proceed with the return.',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }
    
    if (formData.items.some(item => !item.name || item.qty <= 0)) {
        Swal.fire({
            icon: 'warning',
            title: 'Line Item Error',
            text: 'One or more items have invalid descriptions or quantities.',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    setLoading(true);
    try {
        const payload = {
            ...formData,
            party: formData.party._id || formData.party.id,
            partyName: formData.party.name,
            items: formData.items.map(item => ({
                itemId: item.itemId || (typeof item._id === 'string' && item._id.length === 24 ? item._id : null),
                name: item.name,
                hsn: item.hsn || '',
                qty: parseFloat(item.qty) || 0,
                unit: item.unit || 'PCS',
                rate: parseFloat(item.rate) || 0,
                tax: parseFloat(item.tax) || 0,
                amount: parseFloat(item.amount) || 0
            })),
            totalAmount: totals.roundedTotal,
            subtotal: totals.subtotal,
            roundOffDiff: totals.roundOffDiff,
            discountAmount: totals.discountVal,
            overallDiscount: parseFloat(formData.overallDiscount) || 0,
            type: 'Purchase Return'
        };

        if (isEdit) {
            await api.put(`/returns/${id}`, payload);
            Swal.fire({
                icon: 'success',
                title: 'Record Updated',
                text: 'Purchase Return has been successfully synchronized.',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            await api.post('/returns', payload);
            Swal.fire({
                icon: 'success',
                title: 'Audit Recorded',
                text: 'New Purchase Return has been added to ledger.',
                timer: 2000,
                showConfirmButton: false
            });
        }
        navigate('/purchases/returns');
    } catch (error) {
        console.error("Error saving return:", error);
        Swal.fire('Sync Error', error.response?.data?.message || 'Failed to connect to audit server', 'error');
    } finally {
        setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
        <DashboardLayout>
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Loading Audit Data...</p>
                </div>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/30 pb-24">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 mb-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEdit ? 'Edit' : 'Create'} Purchase Return
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">Record goods return to supplier</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        <span>{isEdit ? 'Update Return' : 'Save Return'}</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-12 gap-8">
            
            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              
              {/* Vendor Selection */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold">
                    <Truck size={18} className="text-gray-400" />
                    <span>Vendor Selection</span>
                </div>

                {!formData.party ? (
                  <button 
                    onClick={() => setShowVendorDropdown(true)}
                    className="w-full flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-black hover:bg-gray-50 transition-all group"
                  >
                     <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-black mb-4">
                        <User size={24} />
                     </div>
                     <span className="text-sm font-bold text-gray-900">Choose Vendor</span>
                     <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Click to select supplier from directory</p>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{formData.party.name}</h2>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GST: {formData.party.gstin || 'N/A'}</span>
                                <span className="bg-white px-2 py-0.5 rounded text-[9px] font-bold text-gray-500 border border-gray-100 uppercase tracking-widest">{formData.party.mobile || 'No Contact'}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setFormData(prev => ({ ...prev, party: null }))}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                    >
                        Change
                    </button>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                        <ScanBarcode size={18} className="text-gray-400" />
                        <span>Return Items</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
                        {formData.items.length} {formData.items.length === 1 ? 'Item' : 'Items'}
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#FDFDFF] text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left w-12">#</th>
                        <th className="px-4 py-4 text-left min-w-[250px]">Product / Item</th>
                        <th className="px-2 py-4 text-center w-28">HSN</th>
                        <th className="px-2 py-4 text-center w-28">Qty</th>
                        <th className="px-2 py-4 text-right w-32">Rate (₹)</th>
                        <th className="px-2 py-4 text-right w-36">Total (₹)</th>
                        <th className="px-6 py-4 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {formData.items.map((item, index) => (
                        <tr key={item.id || item._id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-6 text-gray-400 font-bold text-xs">{index + 1}</td>
                          <td className="px-4 py-6 relative">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300"
                                    placeholder="Search or Enter Item Name"
                                    value={activeItemSearchIndex === index ? itemSearchTerm : (item.name || '')}
                                    onChange={(e) => {
                                        setActiveItemSearchIndex(index);
                                        setItemSearchTerm(e.target.value);
                                        updateItem(item.id || item._id, 'name', e.target.value);
                                    }}
                                    onFocus={() => {
                                        setActiveItemSearchIndex(index);
                                        setItemSearchTerm(item.name);
                                    }}
                                />
                                {/* Item Dropdown */}
                                {activeItemSearchIndex === index && itemSearchTerm && (
                                    <div className="absolute top-full left-0 w-full min-w-[300px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 mt-2 overflow-hidden">
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            {items.filter(i => i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).map(i => (
                                                <div 
                                                    key={i._id}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                                    onMouseDown={() => selectItem(index, i)}
                                                >
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-900">{i.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium">Stock: {i.stock} {i.unit}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-xs text-black">₹ {i.purchasePrice || i.sellingPrice}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                          </td>
                          <td className="px-2 py-6">
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg px-2 py-2 text-xs text-center font-bold text-gray-500 outline-none focus:bg-white focus:border-black transition-all"
                              placeholder="HSN"
                              value={item.hsn || ''}
                              onChange={(e) => updateItem(item.id || item._id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-6">
                            <div className="flex items-center justify-center gap-1.5 bg-gray-50 border border-transparent rounded-lg p-2 focus-within:bg-white focus-within:border-black transition-all">
                              <input 
                                type="number" 
                                className="w-10 bg-transparent border-none outline-none text-center text-xs font-bold text-black"
                                value={item.qty}
                                onChange={(e) => updateItem(item.id || item._id, 'qty', parseFloat(e.target.value) || 0)}
                              />
                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-2 py-6 text-right">
                             <div className="flex items-center justify-end gap-1 px-2 py-2 rounded-lg bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-black transition-all text-xs">
                                <span className="text-gray-400 font-bold">₹</span>
                                <input 
                                    type="number" 
                                    className="w-20 bg-transparent border-none outline-none text-right font-bold text-gray-800"
                                    value={item.rate || 0}
                                    onChange={(e) => updateItem(item.id || item._id, 'rate', parseFloat(e.target.value) || 0)}
                                />
                             </div>
                          </td>
                          <td className="px-2 py-6 text-right font-bold text-gray-900 text-sm">
                            ₹ {(item.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-6 text-center">
                             <button className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" onClick={() => removeItem(item.id || item._id)}>
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                  <button 
                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-xl hover:bg-white hover:border-black hover:shadow-sm transition-all group font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-black"
                    onClick={addItem}
                  >
                    <Plus size={16} />
                    <span>Add Another Item</span>
                  </button>
                </div>
              </div>

              {/* Remarks/Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-widest">
                    <FileText size={16} className="text-gray-400" />
                    <label>Remarks / Notes</label>
                  </div>
                  <textarea 
                    className="w-full h-24 bg-gray-50 rounded-xl border-none p-4 text-sm font-medium text-gray-600 resize-none outline-none focus:bg-white focus:ring-1 focus:ring-black border border-transparent focus:border-black"
                    placeholder="Enter notes..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-widest">
                        <Settings size={16} className="text-gray-400" />
                        <label>Terms & Conditions</label>
                    </div>
                    <textarea 
                        className="w-full h-24 bg-gray-50 rounded-xl border-none p-4 text-[11px] font-medium text-gray-400 leading-relaxed resize-none outline-none focus:bg-white border border-transparent focus:border-black"
                        value={formData.terms || ''}
                        onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Side Meta Pane Component */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
                
              {/* Transaction Details */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4 mb-2 flex items-center gap-2">
                    <Hash size={14} />
                    <span>Transaction Details</span>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">Return No</label>
                      <input 
                          type="text" 
                          value={formData.returnNo} 
                          onChange={(e) => setFormData({...formData, returnNo: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-black transition-all"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">Return Date</label>
                      <input 
                          type="date" 
                          value={formData.date} 
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-black transition-all"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">Ref Invoice No</label>
                      <input 
                        type="text" 
                        value={formData.originalInvoiceNo || ''} 
                        onChange={(e) => setFormData({...formData, originalInvoiceNo: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-black transition-all"
                        placeholder="Invoice #"
                      />
                   </div>
                </div>
              </div>

              {/* Settlement Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
                    <Calculator size={14} />
                    <span>Summary</span>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                     <span>Subtotal</span>
                     <span className="text-gray-900">₹ {(totals.subtotal || 0).toLocaleString()}</span>
                   </div>
                   
                   <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                     <span>Add. Charges</span>
                     <input 
                        type="number" 
                        className="w-20 text-right bg-gray-50 rounded-lg px-2 py-1 text-gray-900 outline-none focus:bg-white border border-transparent focus:border-black" 
                        value={formData.additionalCharges || 0} 
                        onChange={e => setFormData({...formData, additionalCharges: parseFloat(e.target.value) || 0})} 
                     />
                   </div>

                   <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                     <span>Total Discount</span>
                     <div className="flex items-center gap-1 text-red-500">
                        <span>-</span>
                        <span>₹ {(totals.discountVal || 0).toLocaleString()}</span>
                     </div>
                   </div>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                    <div className="bg-black rounded-xl p-6 text-white text-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 block mb-1">Grand Total</span>
                        <div className="text-2xl font-black italic">
                            ₹ {(totals.roundedTotal || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Selection Modal */}
        {showVendorDropdown && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Select Vendor</h3>
                            <p className="text-xs text-gray-500">Choose a supplier from your list</p>
                        </div>
                        <button onClick={() => setShowVendorDropdown(false)} className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:border-black outline-none transition-all"
                                placeholder="Search by name, mobile or GSTIN..."
                                value={searchVendor}
                                onChange={(e) => setSearchVendor(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto px-4 pb-6 custom-scrollbar">
                        <div className="space-y-2">
                            {vendors.filter(v => {
                                if (!v || !v.name) return false;
                                const term = searchVendor.toLowerCase().trim();
                                if (!term) return true;
                                return v.name.toLowerCase().includes(term) || 
                                       (v.mobile || '').toLowerCase().includes(term) || 
                                       (v.gstin || '').toLowerCase().includes(term);
                            }).map(vendor => (
                                <div 
                                    key={vendor._id} 
                                    className="p-4 hover:bg-gray-50 cursor-pointer rounded-2xl border border-transparent hover:border-gray-100 transition-all flex items-center justify-between group"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, party: vendor }));
                                        setShowVendorDropdown(false);
                                        setSearchVendor('');
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-900">{vendor.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{vendor.mobile || 'No Contact'}</span>
                                                {vendor.gstin && (
                                                    <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-gray-100 text-gray-400 font-bold uppercase tracking-widest">{vendor.gstin}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Plus size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {vendors.filter(v => {
                            if (!v || !v.name) return false;
                            const term = searchVendor.toLowerCase().trim();
                            return v.name.toLowerCase().includes(term) || (v.mobile || '').toLowerCase().includes(term);
                        }).length === 0 && (
                            <div className="py-12 text-center text-gray-400">
                                <Search size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No Vendor Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AddPurchaseReturn;
