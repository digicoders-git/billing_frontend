import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, FileText, Settings, Keyboard, 
  ArrowLeft, Search, ScanBarcode, X,
  ChevronDown
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const AddSalesReturn = () => {
  const navigate = useNavigate();
  
  const [parties, setParties] = useState([]);
  const [itemsPool, setItemsPool] = useState([]); // Available items from DB
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    returnNo: '',
    date: new Date().toISOString().split('T')[0],
    originalInvoiceNo: '',
    party: null,
    items: [
      { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, tax: 0, amount: 0 }
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
  const updateItem = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-fill details if name matches an existing item (simple autocomplete logic)
          if (field === 'name') {
             const foundItem = itemsPool.find(i => i.name.toLowerCase() === value.toLowerCase());
             if (foundItem) {
                 updatedItem.itemId = foundItem._id;
                 updatedItem.hsn = foundItem.hsn || '';
                 updatedItem.rate = foundItem.sellingPrice || 0;
                 updatedItem.unit = foundItem.unit || 'PCS';
             }
          }

          // Calculate amount: (qty * rate) - discount
          const baseAmount = (updatedItem.qty || 0) * (updatedItem.rate || 0);
          const discAmount = (baseAmount * (updatedItem.discount || 0)) / 100;
          updatedItem.amount = baseAmount - discAmount;
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, tax: 0, amount: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    }
  };

  // Totals Calculation
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
        Swal.fire('Error', 'Please select a Customer', 'error');
        return;
    }
    if (formData.items.some(i => !i.name || i.amount <= 0)) {
        Swal.fire('Error', 'Please add valid items with amount > 0', 'error');
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
                        <span>Mobile: <span className="text-gray-800">{formData.party.phone || '-'}</span></span>
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
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-4 text-left w-12">NO</th>
                        <th className="px-4 py-4 text-left min-w-[200px]">ITEMS/ SERVICES</th>
                        <th className="px-4 py-4 text-left w-24">HSN/ SAC</th>
                        <th className="px-4 py-4 text-center w-20">QTY</th>
                        <th className="px-4 py-4 text-right w-32">RATE (₹)</th>
                        <th className="px-4 py-4 text-right w-24">TAX (%)</th>
                        <th className="px-4 py-4 text-right w-32">AMOUNT (₹)</th>
                        <th className="px-4 py-4 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-4 text-center text-xs text-gray-300 font-bold">{index + 1}</td>
                          <td className="px-2 py-4 relative">
                            <input 
                              type="text" 
                              className="w-full bg-transparent border-none outline-none text-sm font-black text-gray-800 uppercase"
                              placeholder="Type item name..."
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              list={`items-list-${item.id}`}
                            />
                            <datalist id={`items-list-${item.id}`}>
                                {itemsPool.map(i => (
                                    <option key={i._id} value={i.name} />
                                ))}
                            </datalist>
                          </td>
                          <td className="px-2 py-4">
                            <input 
                              type="text" 
                              className="w-full bg-transparent border-none outline-none text-xs text-center font-bold text-gray-400"
                              placeholder="HSN"
                              value={item.hsn}
                              onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex items-center justify-center gap-1 bg-white border border-gray-100 rounded-lg p-1 shadow-sm">
                              <input 
                                type="number" 
                                className="w-10 bg-transparent border-none outline-none text-center text-xs font-black text-indigo-600"
                                value={item.qty}
                                onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                              />
                              <span className="text-[9px] text-gray-400 font-bold">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-2 py-4 text-right">
                             <input 
                              type="number" 
                              className="w-full bg-transparent border-none outline-none text-right text-sm font-black text-gray-800"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-2 py-4 text-right">
                             <input 
                              type="number" 
                              className="w-full bg-transparent border-none outline-none text-right text-xs font-bold text-gray-400"
                              value={item.tax}
                              onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-4 text-right font-black text-indigo-600 text-sm">
                            ₹ {item.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-center">
                             <Trash2 
                               size={16} 
                               className="text-gray-200 hover:text-red-500 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                               onClick={() => removeItem(item.id)}
                             />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Items */}
                <div className="md:hidden divide-y divide-gray-100">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="p-4 space-y-4 bg-white">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded tracking-widest">
                        Item #{index + 1}
                        <button onClick={() => removeItem(item.id)} className="text-red-400"><Trash2 size={16}/></button>
                      </div>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-2.5 text-sm font-black uppercase focus:bg-white focus:border-indigo-100 outline-none transition-all"
                        placeholder="Item Name"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        list={`items-list-mobile-${item.id}`}
                      />
                      <datalist id={`items-list-mobile-${item.id}`}>
                            {itemsPool.map(i => (
                                <option key={i._id} value={i.name} />
                            ))}
                      </datalist>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Qty</label>
                          <div className="flex items-center gap-2 bg-gray-50 border border-transparent rounded-xl px-3 py-2">
                             <input type="number" className="w-full bg-transparent border-none outline-none text-xs font-black text-indigo-600" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} />
                             <span className="text-[9px] font-black text-gray-400 uppercase">{item.unit}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rate</label>
                          <div className="flex items-center gap-1 bg-gray-50 border border-transparent rounded-xl px-3 py-2 font-black text-xs">
                             <span className="text-gray-300">₹</span>
                             <input type="number" className="w-full bg-transparent border-none outline-none" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Amount</span>
                        <span className="text-base font-black text-indigo-600">₹ {item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 border-t border-gray-100 gap-4">
                  <div 
                    className="w-full sm:w-auto h-12 flex items-center justify-center gap-3 px-8 border-2 border-dashed border-indigo-200 rounded-xl hover:bg-white transition-all cursor-pointer group flex-1 max-w-lg"
                    onClick={addItem}
                  >
                    <Plus size={20} className="text-indigo-500 group-hover:scale-125 transition-transform" />
                    <span className="text-sm font-black text-indigo-600 uppercase tracking-[2px]">Add Item</span>
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

              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-6 shadow-sm">
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                     <span className="text-sm font-black text-gray-800">₹ {totals.subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center group gap-2">
                     <button className="text-[10px] font-black text-indigo-500 uppercase hover:underline">+ Charges</button>
                     <input type="number" className="w-20 text-right bg-transparent border-none text-sm font-black outline-none" value={formData.additionalCharges} onChange={e => setFormData({...formData, additionalCharges: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div className="flex justify-between items-center group gap-2">
                     <button className="text-[10px] font-black text-indigo-500 uppercase hover:underline">+ Discount</button>
                     <span className="text-sm font-black text-red-500">- ₹ {totals.discountVal.toLocaleString()}</span>
                   </div>
                </div>
                
                <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.autoRoundOff} onChange={e => setFormData({...formData, autoRoundOff: e.target.checked})} className="w-4 h-4 rounded text-indigo-600" />
                            <span className="text-[10px] font-black text-gray-400 uppercase">Round Off</span>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-tighter cursor-pointer">₹ {totals.roundOffDiff}</span>
                    </div>
                    <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100">
                        <div className="text-[9px] font-black uppercase opacity-60 tracking-[3px] mb-1">Return Total</div>
                        <div className="text-3xl font-black tracking-tight">₹ {totals.roundedTotal.toLocaleString()}</div>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddSalesReturn;
