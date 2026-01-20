import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Plus, Trash2, Calendar, 
  Hash, FileText, Settings, 
  ArrowLeft, Search, X,
  Truck, Save, ScanBarcode,
  ChevronDown, Calculator, User, Package
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

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
      { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', gstAmount: 0, amount: 0 }
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

  // Item Picker Modal State
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [itemPickerSearch, setItemPickerSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [vendorsRes, nextNoRes, itemsRes] = await Promise.all([
                api.get('/parties'),
                api.get('/returns/next-receipt?type=Purchase Return'),
                api.get('/items')
            ]);
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
                items: data.items.map(it => ({ ...it, id: it._id })),
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

  // Handle Item Updates with GST
  const updateItem = (itemId, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === itemId || item._id === itemId) {
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
          const rate = itemData.purchasePrice || itemData.sellingPrice || 0;
          
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

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', gstAmount: 0, amount: 0 }]
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
                mrp: parseFloat(item.mrp) || 0,
                rate: parseFloat(item.rate) || 0,
                discount: parseFloat(item.discount) || 0,
                gstRate: item.gstRate,
                gstAmount: parseFloat(item.gstAmount) || 0,
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

  // Filtered items for picker
  const filteredPickerItems = useMemo(() => {
      return items.filter(item => 
          item.name.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
          (item.code && item.code.toLowerCase().includes(itemPickerSearch.toLowerCase()))
      );
  }, [items, itemPickerSearch]);

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
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Return Items</h3>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto min-w-0">
                  <table className="w-full border-collapse min-w-[1400px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-5 text-left w-16">NO</th>
                        <th className="px-6 py-5 text-left min-w-[300px]">ITEMS/ SERVICES</th>
                        <th className="px-6 py-5 text-left w-32">HSN</th>
                        <th className="px-6 py-5 text-right w-40">MRP (₹)</th>
                        <th className="px-6 py-5 text-center w-36">QTY</th>
                        <th className="px-6 py-5 text-right w-40">PRICE (₹)</th>
                        <th className="px-6 py-5 text-left w-44">GST</th>
                        <th className="px-6 py-5 text-right w-36">DISC %</th>
                        <th className="px-6 py-5 text-right w-44">AMOUNT (₹)</th>
                        <th className="px-6 py-5 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.map((item, index) => (
                        <tr key={item.id || item._id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-5 text-center text-sm text-gray-400 font-medium">{index + 1}</td>
                          <td className="px-6 py-5">
                            <div 
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-800 hover:border-indigo-400 focus-within:border-indigo-500 transition-all cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                    setActiveItemIndex(index);
                                    setShowItemPicker(true);
                                }}
                            >
                                {item.name ? (
                                    <div className="flex flex-col flex-1 truncate text-left">
                                        <span className="font-black text-gray-900 truncate uppercase tracking-tight">{item.name}</span>
                                        {item.code && <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Code: {item.code}</span>}
                                    </div>
                                ) : (
                                    <span className="flex-1 text-gray-400 font-bold uppercase tracking-widest text-[10px] text-left">Search Item...</span>
                                )}
                                <Search size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                          </td>
                          <td className="px-4 py-5 font-black uppercase text-[10px] items-center">
                            <input 
                              type="text" 
                              className="w-full bg-transparent border-b border-gray-200 px-2 py-1 text-xs text-center font-black text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all uppercase"
                              placeholder="HSN"
                              value={item.hsn}
                              onChange={(e) => updateItem(item.id || item._id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-5">
                            <input 
                              type="number" 
                              className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-black text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                              placeholder="0"
                              value={item.mrp || ''}
                              onChange={(e) => updateItem(item.id || item._id, 'mrp', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input 
                                type="number" 
                                className="w-14 bg-transparent border-b border-gray-200 px-1 py-1.5 text-center text-sm font-black text-indigo-600 focus:border-indigo-500 outline-none"
                                value={item.qty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id || item._id, 'qty', e.target.value)}
                              />
                              <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{item.unit || 'PCS'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                             <input 
                              type="number" 
                              className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-black text-gray-800 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                              value={item.rate}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id || item._id, 'rate', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-5">
                            <select
                              value={item.gstRate}
                              onChange={(e) => updateItem(item.id || item._id, 'gstRate', e.target.value)}
                              className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-[10px] font-black text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all cursor-pointer uppercase"
                            >
                              {gstOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-5">
                             <input 
                              type="number" 
                              className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-black text-gray-400 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                              value={item.discount}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id || item._id, 'discount', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-5 text-right font-black text-indigo-600 text-sm italic">
                            ₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-5 text-center">
                             <Trash2 
                               size={16} 
                               className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 mx-auto"
                               onClick={() => removeItem(item.id || item._id)}
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
                    <div key={item.id || item._id} className="p-4 bg-white space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">ITEM {index + 1}</span>
                            <button onClick={() => removeItem(item.id || item._id)}><X size={16} className="text-gray-400 hover:text-red-500" /></button>
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
                                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="HSN" value={item.hsn} onChange={(e) => updateItem(item.id || item._id, 'hsn', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">MRP</label>
                                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="0" value={item.mrp || ''} onChange={(e) => updateItem(item.id || item._id, 'mrp', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Qty</label>
                                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-indigo-600" placeholder="1" value={item.qty} onChange={(e) => updateItem(item.id || item._id, 'qty', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Price</label>
                                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="0" value={item.rate} onChange={(e) => updateItem(item.id || item._id, 'rate', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">GST</label>
                                <select value={item.gstRate} onChange={(e) => updateItem(item.id || item._id, 'gstRate', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium">
                                    {gstOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Disc %</label>
                                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium" placeholder="0" value={item.discount} onChange={(e) => updateItem(item.id || item._id, 'discount', e.target.value)} />
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                            <span className="text-base font-bold text-indigo-600">₹ {item.amount.toLocaleString()}</span>
                        </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
                  <div 
                    className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group"
                    onClick={addItem}
                  >
                    <Plus size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-sm font-black text-gray-500 group-hover:text-indigo-600 uppercase tracking-widest">Add Return Item</span>
                  </div>
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
              <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-6 shadow-sm">
                <div className="space-y-4">
                   {/* Subtotal */}
                   <div className="flex justify-between items-center group">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                     <span className="text-sm font-black text-gray-800">₹ {totals.subtotal.toLocaleString()}</span>
                   </div>
                   
                   {/* Additional Charges */}
                   {/* Additional Charges */}
                   <div className="flex justify-between items-center gap-2 py-3 border-t border-dashed border-gray-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Charges</span>
                      <div className="flex items-center bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all w-28">
                           <span className="text-slate-400 text-xs font-bold mr-1">₹</span>
                           <input 
                               type="number" 
                               value={formData.additionalCharges || ''} 
                               onFocus={(e) => e.target.select()}
                               onChange={(e) => setFormData({...formData, additionalCharges: e.target.value})}
                               placeholder="0"
                               className="w-full bg-transparent border-none outline-none text-right font-bold text-sm text-slate-700 p-0 placeholder:text-slate-300"
                           />
                      </div>
                   </div>

                   {/* Overall Discount */}
                   <div className="flex justify-between items-center gap-2 py-3 border-t border-dashed border-gray-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Discount</span>
                      <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all overflow-hidden w-28">
                         <div className="bg-white border-r border-slate-200 px-2 h-full flex items-center">
                             <select 
                                 value={formData.overallDiscountType}
                                 onChange={(e) => setFormData({...formData, overallDiscountType: e.target.value})}
                                 className="text-[10px] font-bold uppercase bg-transparent outline-none text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors appearance-none"
                             >
                                 <option value="percentage">%</option>
                                 <option value="fixed">₹</option>
                             </select>
                         </div>
                         <input 
                             type="number" 
                             value={formData.overallDiscount || ''} 
                             onFocus={(e) => e.target.select()}
                             onChange={(e) => setFormData({...formData, overallDiscount: e.target.value})}
                             placeholder="0"
                             className="w-full bg-transparent border-none outline-none text-right font-bold text-sm text-slate-700 py-1.5 px-2 placeholder:text-slate-300"
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                   <div className="bg-black p-5 rounded-[2rem] text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center">
                       <div className="text-[9px] font-black text-gray-500 uppercase tracking-[4px] mb-1">Total Return Value</div>
                       <div className="text-3xl font-black tracking-tight">₹ {totals.roundedTotal.toLocaleString()}</div>
                   </div>

                   <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <input 
                                type="checkbox" 
                                id="autoRoundOff"
                                checked={formData.autoRoundOff}
                                onChange={(e) => setFormData({...formData, autoRoundOff: e.target.checked})}
                                className="w-4 h-4 rounded text-black border-gray-300 focus:ring-0 cursor-pointer" 
                           />
                           <label htmlFor="autoRoundOff" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Round Off</label>
                         </div>
                         {formData.autoRoundOff && (
                            <span className="text-[10px] font-bold text-gray-400">{totals.roundOffDiff}</span>
                         )}
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
                                            <td className="px-6 py-4 text-right text-base font-black text-indigo-600">₹{item.purchasePrice || item.sellingPrice || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
