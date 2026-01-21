import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, FileText, Settings, Keyboard, 
  ArrowLeft, Search, ScanBarcode, X,
  ChevronDown, ShoppingCart, RotateCcw
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

const AddSalesReturn = () => {
  const navigate = useNavigate();
  
  const [parties, setParties] = useState([]);
  const [itemsPool, setItemsPool] = useState([]); // Available items from DB
  const [loading, setLoading] = useState(true);
  
  // Item Picker State
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickerSearchTerm, setPickerSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  
  const [formData, setFormData] = useState({
    returnNo: '',
    date: new Date().toISOString().split('T')[0],
    originalInvoiceNo: '',
    party: null,
    items: [
      { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', tax: 0, amount: 0 }
    ],
    notes: '',
    terms: '1. Goods once returned will be inspected for quality.\n2. Refunds will be processed within 7 working days.',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage', // 'fixed' or 'percentage'
    autoRoundOff: true,
  });

  const [searchParty, setSearchParty] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesRes, itemsRes, nextIdRes] = await Promise.all([
          api.get('/parties'),
          api.get('/items'),
          api.get('/returns/next-receipt?type=Sales Return')
        ]);
        
        setParties(partiesRes.data);
        setItemsPool(itemsRes.data); // Assuming GET /items returns array of items with stock, rate, etc.
        setFormData(prev => ({ ...prev, returnNo: nextIdRes.data.nextNo }));
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data", error);
        Swal.fire('Error', 'Failed to load initial data', 'error');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle Item Row Calculations
  // Handle Item Row Calculations
  const updateItem = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Calculate amount: ((qty * rate) - (qty * rate * discount / 100)) + tax
          const qty = parseFloat(updatedItem.qty) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          const discount = parseFloat(updatedItem.discount) || 0;

          const baseAmount = qty * rate;
          const discAmount = (baseAmount * discount) / 100;
          const taxableAmount = baseAmount - discAmount;

          // Calculate Tax based on GST Rate string
          let taxRate = 0;
          const rateStr = updatedItem.gstRate || 'None';
          if (rateStr !== 'None' && rateStr !== 'Exempted') {
              const matches = rateStr.match(/(\d+(\.\d+)?)%|@\s*(\d+(\.\d+)?)/g);
              if (matches) {
                  taxRate = matches.reduce((acc, val) => {
                      const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                      return acc + (isNaN(num) ? 0 : num);
                  }, 0);
              }
          }

          const taxAmount = (taxableAmount * taxRate) / 100;
          updatedItem.tax = taxAmount;
          updatedItem.amount = taxableAmount + taxAmount;

          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const selectItem = (itemData) => {
      if (activeItemIndex === null) return;
      
      setFormData(prev => {
          const newItems = [...prev.items];
          
          // Determine GST Percent from string
          const gstStr = itemData.gstRate || 'None';
          let gstPercent = 0;
          if (gstStr.includes('@')) {
              gstPercent = parseFloat(gstStr.split('@')[1]) || 0;
          }

          const rate = itemData.sellingPrice || 0;
          const qty = newItems[activeItemIndex].qty || 1;
          const taxableAmount = rate * qty;
          const taxAmount = (taxableAmount * gstPercent) / 100;

          newItems[activeItemIndex] = {
              ...newItems[activeItemIndex],
              itemId: itemData._id,
              name: itemData.name,
              hsn: itemData.hsn || '',
              mrp: itemData.mrp || 0,
              rate: rate,
              unit: itemData.unit || 'PCS',
              gstRate: gstStr,
              discount: 0,
              tax: taxAmount,
              amount: taxableAmount + taxAmount
          };
          return { ...prev, items: newItems };
      });
      setShowItemPicker(false);
      setPickerSearchTerm('');
      setActiveItemIndex(null);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', tax: 0, amount: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    }
  };

  // Totals Calculation
  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
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
    const totalTax = formData.items.reduce((sum, item) => sum + (parseFloat(item.tax) || 0), 0);

    return { subtotal, taxableAmount, discountVal, roundedTotal, roundOffDiff, totalTax };
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party) {
        Swal.fire('Error', 'Please select a Customer', 'error');
        return;
    }
    if (formData.items.some(i => !i.name || i.amount <= 0)) {
        Swal.fire('Error', 'Please add valid items with amount > 0', 'error');
        return;
    }

    // Item Validation
    for (const item of formData.items) {
        const name = item.name.trim();
        if (/^\d+$/.test(name)) {
            Swal.fire('Error', `Item Name "${name}" cannot be purely numbers`, 'error');
            return;
        }
        if (name.length < 3) {
             Swal.fire('Error', `Item Name "${name}" must be at least 3 characters long`, 'error');
             return;
        }
    }

    // Party Validation
    const partyMobile = formData.party.mobile || '';
    if (!partyMobile) {
        Swal.fire('Error', 'Customer Mobile Number is required', 'error');
        return;
    }
    if (!/^\d{10}$/.test(partyMobile)) {
        Swal.fire('Error', 'Invalid Customer Mobile Number (must be 10 digits)', 'error');
        return;
    }

    const partyGstin = formData.party.gstin || '';
    if (partyGstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(partyGstin)) {
        Swal.fire('Error', 'Invalid GSTIN Format', 'error');
        return;
    }

    setSaving(true);
    try {
        const payload = {
            type: 'Sales Return',
            returnNo: formData.returnNo,
            date: formData.date,
            party: formData.party._id,
            partyName: formData.party.name,
            originalInvoiceNo: formData.originalInvoiceNo,
            items: formData.items.map(i => ({
                itemId: i.itemId, // Can be null if manual
                name: i.name,
                hsn: i.hsn,
                qty: parseFloat(i.qty),
                unit: i.unit,
                rate: parseFloat(i.rate),
                tax: parseFloat(i.tax),
                amount: parseFloat(i.amount)
            })),
            subtotal: totals.subtotal,
            additionalCharges: parseFloat(formData.additionalCharges),
            overallDiscount: parseFloat(formData.overallDiscount),
            totalAmount: totals.roundedTotal,
            roundOffDiff: parseFloat(totals.roundOffDiff),
            notes: formData.notes,
            terms: formData.terms
        };

        await api.post('/returns', payload);
        await Swal.fire({
            title: 'Success!',
            text: 'Sales Return Recorded Successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        navigate('/sales/returns');
    } catch (error) {
        console.error('Save failed', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to save return', 'error');
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
      return (
          <DashboardLayout>
              <div className="flex justify-center items-center min-h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
          </DashboardLayout>
      );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Top Sticky Header */}
        {/* Action Toolbar */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create Sales Return</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                 Return No: <span className="text-gray-700 font-bold">#{formData.returnNo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <Save size={18} />
              )}
              <span>{saving ? 'Saving...' : 'Save Return'}</span>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:max-w-[1400px] mx-auto space-y-4">
          <div className="grid grid-cols-12 gap-4">
            
            {/* Left Section */}
            <div className="col-span-12 lg:col-span-9 space-y-4">
              
              {/* Party Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm min-h-[160px] relative">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4">Customer Details</div>
                {!formData.party ? (
                  <div 
                    className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-indigo-100 rounded-xl hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                    onClick={() => setShowPartyDropdown(true)}
                  >
                     <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm group-hover:scale-105 transition-transform">
                        <Plus size={20} /> Select Customer
                     </div>
                     <p className="text-[10px] text-gray-400 mt-1">Select the customer who is returning items</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 w-full relative">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-[#4F46E5] rounded-lg shrink-0"><User size={20} /></div>
                        <h2 className="text-lg font-black text-gray-900 truncate uppercase tracking-tight">{formData.party.name}</h2>
                        <button onClick={() => setFormData(prev => ({ ...prev, party: null }))} className="p-1 hover:bg-red-50 text-red-500 rounded-lg ml-auto transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500 line-clamp-2 pl-12">{formData.party.billingAddress || 'No Address'}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-wider text-gray-400 pl-12">
                        <span>GSTIN: <span className="text-gray-800">{formData.party.gstin || '-'}</span></span>
                        <span>Mobile: <span className="text-gray-800">{formData.party.mobile || '-'}</span></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Party Selection Modal */}
                {showPartyDropdown && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-black text-gray-800 uppercase tracking-tight">Select Customer</h3>
                                <button onClick={() => setShowPartyDropdown(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 bg-gray-50">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                                        placeholder="Search customer..."
                                        value={searchParty}
                                        onChange={(e) => setSearchParty(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {parties.filter(p => !searchParty || p.name.toLowerCase().includes(searchParty.toLowerCase())).map(party => (
                                    <div 
                                        key={party._id} 
                                        className="px-5 py-4 hover:bg-indigo-50/50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, party }));
                                            setShowPartyDropdown(false);
                                            setSearchParty('');
                                        }}
                                    >
                                        <div className="font-black text-sm text-gray-800 uppercase tracking-tight">{party.name}</div>
                                        <div className="text-[10px] text-gray-500 italic mt-0.5 truncate">{party.billingAddress}</div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => navigate('/add-party')}
                                className="w-full py-4 bg-gray-50 text-indigo-600 font-bold text-xs uppercase hover:bg-indigo-50 transition-colors"
                            >
                                + Create New Party
                            </button>
                        </div>
                    </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col min-h-[400px]">
                <div className="bg-white rounded-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                   <div>
                       <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Return Items</h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Manage items being returned</p>
                   </div>
                   <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tabular-nums">{formData.items.length} Entries</span>
                   </div>
                </div>

                <div className="flex-1 overflow-x-auto min-w-0">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse min-w-[1200px]">
                      <thead className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-5 text-left w-12">NO</th>
                          <th className="px-6 py-5 text-left min-w-[250px]">ITEMS / SERVICES</th>
                          <th className="px-6 py-5 text-left w-28">HSN</th>
                          <th className="px-6 py-5 text-right w-32">MRP (₹)</th>
                          <th className="px-6 py-5 text-center w-28">QTY</th>
                          <th className="px-6 py-5 text-right w-32">RATE (₹)</th>
                          <th className="px-6 py-5 text-left w-36">GST %</th>
                          <th className="px-6 py-5 text-right w-24">DISC %</th>
                          <th className="px-6 py-5 text-right w-36">AMOUNT (₹)</th>
                          <th className="px-6 py-5 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {formData.items.map((item, index) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-5 text-center text-xs text-gray-300 font-bold">{index + 1}</td>
                            <td className="px-6 py-5">
                               <div 
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm font-bold text-gray-800 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                  setActiveItemIndex(index);
                                  setShowItemPicker(true);
                                }}
                              >
                                {item.name ? (
                                    <span className="truncate uppercase tracking-tight">{item.name}</span>
                                ) : (
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Type Item Name...</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <input 
                                type="text" 
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-[10px] text-center font-bold text-gray-500 hover:border-indigo-300 outline-none transition-all uppercase"
                                placeholder="HSN"
                                value={item.hsn}
                                onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                              />
                            </td>
                            <td className="px-6 py-5">
                               <input 
                                type="number" 
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-right text-xs font-bold text-gray-600 hover:border-indigo-300 outline-none transition-all"
                                value={item.mrp || ''}
                                onChange={(e) => updateItem(item.id, 'mrp', e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-1.5">
                                <input 
                                  type="number" 
                                  className="w-16 bg-transparent border-b border-gray-200 px-1 py-1.5 text-center text-sm font-black text-indigo-600 focus:border-indigo-500 outline-none"
                                  value={item.qty === 0 ? '' : item.qty}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                                <span className="text-[9px] text-gray-400 font-black uppercase">{item.unit}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                               <input 
                                type="number" 
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-right text-sm font-black text-gray-800 hover:border-indigo-300 outline-none"
                                value={item.rate === 0 ? '' : item.rate}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-6 py-5">
                                <select
                                    value={item.gstRate || 'None'}
                                    onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-[10px] font-black text-gray-500 hover:border-indigo-300 outline-none cursor-pointer uppercase"
                                >
                                    {gstOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-6 py-5 text-right">
                               <input 
                                type="number" 
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-right text-xs font-bold text-gray-400 hover:border-indigo-300 outline-none"
                                value={item.discount === 0 ? '' : item.discount}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-6 py-5 text-right font-black text-indigo-600 text-sm">
                              ₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-5 text-center">
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

                  {/* Mobile View with new fields */}
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
                </div>

                {/* Empty State */}
                {formData.items.length === 0 && (
                     <div className="text-center py-12">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                             <ShoppingCart size={32} className="text-slate-300" />
                         </div>
                         <h3 className="text-slate-500 font-medium">No items added</h3>
                         <p className="text-slate-400 text-sm">Add items to proceed with return</p>
                     </div>
                )}

                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                  <div 
                    className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group"
                    onClick={addItem}
                  >
                    <Plus size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-sm font-black text-gray-500 group-hover:text-indigo-600 uppercase tracking-widest">Add Return Item</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Notes</label>
                  <textarea 
                    className="w-full h-24 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 p-4 text-xs font-medium text-gray-600 resize-none transition-all"
                    placeholder="Reference reason for return..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm overflow-hidden">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Terms & Conditions</label>
                    <textarea 
                        className="w-full h-24 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 p-4 text-[10px] leading-relaxed font-bold text-gray-500 resize-none transition-all"
                        value={formData.terms}
                        onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5 shadow-sm">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return No:</label>
                      <input 
                        type="text" 
                        value={formData.returnNo} 
                        onChange={(e) => setFormData({...formData, returnNo: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-black text-gray-700 text-center outline-none focus:bg-white"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return Date:</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="date" 
                            value={formData.date} 
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-indigo-50/30 border border-indigo-100 rounded-xl pl-10 pr-4 py-2 text-xs font-black text-indigo-700 outline-none"
                        />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orig. Invoice No:</label>
                      <input 
                        type="text" 
                        value={formData.originalInvoiceNo} 
                        onChange={(e) => setFormData({...formData, originalInvoiceNo: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-black text-gray-700 text-center outline-none focus:bg-white"
                        placeholder="Optional"
                      />
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-6 shadow-sm">
                <div className="space-y-4">
                   {/* Subtotal */}
                   <div className="flex justify-between items-center group">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                     <span className="text-sm font-black text-gray-800">₹ {totals.subtotal.toLocaleString()}</span>
                   </div>
                   
                   {/* Additional Charges */}
                   <div className="flex justify-between items-center group gap-2 py-2 border-t border-gray-50">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1">
                            Additional Charges
                        </span>
                     </div>
                     <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 focus-within:border-indigo-200 transition-all">
                        <span className="text-[10px] font-bold text-gray-400">₹</span>
                        <input 
                            type="number" 
                            className="w-16 text-right bg-transparent border-none outline-none text-xs font-black text-gray-700" 
                            value={formData.additionalCharges || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setFormData({...formData, additionalCharges: e.target.value})}
                            placeholder="0"
                        />
                     </div>
                   </div>

                   {/* Overall Discount */}
                   <div className="flex justify-between items-center py-2 border-t border-gray-50">
                     <span className="text-[10px] font-black text-gray-500 uppercase">Discount</span>
                     
                     <div className="flex items-center bg-indigo-50/50 rounded-lg border border-indigo-100/50 focus-within:border-indigo-200 transition-all p-1">
                        <select 
                            value={formData.overallDiscountType}
                            onChange={(e) => setFormData({...formData, overallDiscountType: e.target.value})}
                            className="text-[9px] bg-transparent text-indigo-600 border-none font-bold outline-none cursor-pointer pr-1"
                        >
                            <option value="percentage">%</option>
                            <option value="fixed">₹</option>
                        </select>
                        <div className="w-px h-3 bg-indigo-200 mx-1"></div>
                        <input 
                            type="number" 
                            className="w-16 text-right bg-transparent border-none outline-none text-xs font-black text-indigo-600" 
                            value={formData.overallDiscount || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setFormData({...formData, overallDiscount: e.target.value})}
                            placeholder="0"
                        />
                     </div>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                   <div className="bg-black p-5 rounded-3xl text-white shadow-2xl shadow-black/20 transform hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center">
                       <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[4px] mb-1">Total Return</div>
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
      </div>
      
      {/* Item Picker Modal */}
      {showItemPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div 
                  className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
                  onClick={(e) => e.stopPropagation()}
              >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight">Select Product</h3>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Search and select item to add to return</p>
                      </div>
                      <button 
                          onClick={() => setShowItemPicker(false)}
                          className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-red-500 transition-all"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  {/* Search */}
                  <div className="p-6 pb-2">
                      <div className="relative group/search">
                          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors" />
                          <input 
                              type="text" 
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                              placeholder="Search item by name, code or HSN..."
                              autoFocus
                              value={pickerSearchTerm}
                              onChange={(e) => setPickerSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                      <div className="grid grid-cols-1 gap-2">
                          {itemsPool.filter(item => 
                              !pickerSearchTerm || 
                              item.name.toLowerCase().includes(pickerSearchTerm.toLowerCase()) ||
                              (item.code && item.code.toLowerCase().includes(pickerSearchTerm.toLowerCase()))
                          ).map((item) => (
                              <div 
                                  key={item._id}
                                  className="group p-4 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-between"
                                  onClick={() => selectItem(item)}
                              >
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm transition-all text-xs uppercase">
                                          {item.name.substring(0, 2)}
                                      </div>
                                      <div>
                                          <div className="font-black text-gray-900 group-hover:text-indigo-700">{item.name}</div>
                                          <div className="flex items-center gap-2 mt-1">
                                              {item.code && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold uppercase">{item.code}</span>}
                                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Stock: {item.stock || 0} {item.unit}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Selling Price</div>
                                      <div className="font-black text-gray-900 group-hover:text-indigo-600">₹ {item.sellingPrice?.toLocaleString() || 0}</div>
                                  </div>
                              </div>
                          ))}
                          
                          {itemsPool.length === 0 && (
                              <div className="py-12 text-center text-gray-400">
                                  <p className="text-sm font-bold">No items found</p>
                              </div>
                          )}
                      </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                           {itemsPool.filter(i => !pickerSearchTerm || i.name.toLowerCase().includes(pickerSearchTerm.toLowerCase())).length} Items Found
                       </span>
                       <button 
                          className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                          onClick={() => navigate('/inventory')}
                       >
                           + Add New Product
                       </button>
                  </div>
              </div>
          </div>
      )}
    </DashboardLayout>
  );
};

export default AddSalesReturn;
