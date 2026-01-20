import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, FileText, Settings, Keyboard, 
  ArrowLeft, Search, ScanBarcode, X,
  ChevronDown, ReceiptCent
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const EditCreditNote = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [parties, setParties] = useState([]);
  const [itemsPool, setItemsPool] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    returnNo: '',
    date: new Date().toISOString().split('T')[0],
    originalInvoiceNo: '',
    reason: 'Price Difference', 
    party: null,
    items: [],
    notes: '',
    terms: '',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage',
    autoRoundOff: true,
  });

  const reasons = ['Price Difference', 'Damaged Goods', 'Stock Return', 'Discount Adjustment', 'Error in Invoice'];
  const [searchParty, setSearchParty] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesRes, itemsRes, noteRes] = await Promise.all([
          api.get('/parties'),
          api.get('/items'),
          api.get(`/returns/${id}`)
        ]);
        
        setParties(partiesRes.data);
        setItemsPool(itemsRes.data);
        
        const noteData = noteRes.data;
        setFormData({
            returnNo: noteData.returnNo,
            date: new Date(noteData.date).toISOString().split('T')[0],
            originalInvoiceNo: noteData.originalInvoiceNo || '',
            reason: noteData.reason || 'Price Difference',
            party: noteData.party,
            items: noteData.items.map(item => ({
                id: Date.now() + Math.random(),
                itemId: item.itemId,
                name: item.name,
                hsn: item.hsn,
                qty: item.qty,
                unit: item.unit,
                rate: item.rate,
                tax: item.tax,
                amount: item.amount
            })),
            notes: noteData.notes || '',
            terms: noteData.terms || '',
            additionalCharges: noteData.additionalCharges || 0,
            overallDiscount: noteData.overallDiscount || 0,
            overallDiscountType: 'percentage',
            autoRoundOff: true
        });

        // Resolve party if ID
        if (noteData.party && typeof noteData.party !== 'object') {
             const foundParty = partiesRes.data.find(p => p._id === noteData.party);
             if (foundParty) setFormData(prev => ({ ...prev, party: foundParty }));
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load data", error);
        Swal.fire('Error', 'Failed to load credit note data', 'error');
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handle Item Row Calculations
  const updateItem = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'name') {
             const foundItem = itemsPool.find(i => i.name && i.name.toLowerCase() === value.toLowerCase());
             if (foundItem) {
                 updatedItem.itemId = foundItem._id;
                 updatedItem.hsn = foundItem.hsn || '';
                 updatedItem.rate = foundItem.sellingPrice || 0;
                 updatedItem.unit = foundItem.unit || 'PCS';
             }
          }

          const qty = parseFloat(updatedItem.qty) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          const discount = parseFloat(updatedItem.discount) || 0;

          const baseAmount = qty * rate;
          const discAmount = (baseAmount * discount) / 100;
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
        Swal.fire('Error', 'Please select a Party', 'error');
        return;
    }

    setSaving(true);
    try {
        const payload = {
            type: 'Credit Note', // Ensure it stays Credit Note
            returnNo: formData.returnNo,
            date: formData.date,
            party: formData.party._id,
            partyName: formData.party.name,
            originalInvoiceNo: formData.originalInvoiceNo,
            reason: formData.reason,
            items: formData.items.map(i => ({
                itemId: i.itemId, 
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

        await api.put(`/returns/${id}`, payload);
        await Swal.fire({
            title: 'Success!',
            text: 'Credit Note Updated Successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        navigate('/sales/credit-notes');
    } catch (error) {
        console.error('Update failed', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to update credit note', 'error');
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
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Edit Credit Note</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                 Return No: <span className="text-gray-700 font-bold">#{formData.returnNo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto">
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="w-full sm:w-auto justify-center px-6 py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <Save size={18} />
              )}
              <span>{saving ? 'Updating...' : 'Update Credit Note'}</span>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:max-w-[1400px] mx-auto space-y-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Section (9 Cols) */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              
              {/* Party Section Card */}
              <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Party Details</div>
                        {formData.party && (
                            <button onClick={() => setFormData(prev => ({ ...prev, party: null }))} className="text-[10px] font-black text-red-500 uppercase hover:underline">Change Party</button>
                        )}
                    </div>

                    {!formData.party ? (
                        <div 
                            className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-100 rounded-[20px] hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
                            onClick={() => setShowPartyDropdown(true)}
                        >
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                                <User size={24} />
                            </div>
                            <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Select Customer</span>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tight">Search by name, GSTIN or mobile</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-[16px] flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">
                                        {formData.party.name[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{formData.party.name}</h2>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formData.party.phone}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing Address</div>
                                    <p className="text-xs font-bold text-gray-600 leading-relaxed">{formData.party.billingAddress || 'No Address'}</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end gap-2 md:items-end">
                                <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">GSTIN:</span>
                                    <span className="text-[10px] font-black text-gray-700">{formData.party.gstin || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Party Selection Modal */}
                {showPartyDropdown && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-black text-gray-900 uppercase tracking-tight">Select Customer</h3>
                                <button onClick={() => setShowPartyDropdown(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 bg-gray-50/50">
                                <div className="relative group">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-[14px] text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm transition-all"
                                        placeholder="Type customer name..."
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
                                        className="px-6 py-4 hover:bg-indigo-50/50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex items-center gap-4"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, party }));
                                            setShowPartyDropdown(false);
                                            setSearchParty('');
                                        }}
                                    >
                                        <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-black">
                                            {party.name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="font-black text-sm text-gray-800 uppercase tracking-tight">{party.name}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{party.phone}</div>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4">
                                    <button 
                                        onClick={() => navigate('/add-party')}
                                        className="w-full py-3 bg-gray-50 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                                    >
                                        + Create New Customer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
              </div>

              {/* Items Section Table */}
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Line Items</div>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse min-w-[1400px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-5 text-left w-16">NO</th>
                        <th className="px-6 py-5 text-left min-w-[300px]">ITEMS/ SERVICES</th>
                        <th className="px-6 py-5 text-left w-32">HSN</th>
                        <th className="px-6 py-5 text-center w-36">QTY</th>
                        <th className="px-6 py-5 text-right w-40">PRICE (₹)</th>
                        <th className="px-6 py-5 text-right w-44">AMOUNT (₹)</th>
                        <th className="px-6 py-5 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                           <td className="px-6 py-5 text-center text-sm text-gray-400 font-medium">{index + 1}</td>
                           <td className="px-6 py-5">
                             <input 
                               type="text" 
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-800 hover:border-indigo-400 focus:border-indigo-500 outline-none transition-all uppercase"
                               placeholder="Enter item name..."
                               value={item.name}
                               onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                             />
                           </td>
                           <td className="px-4 py-5">
                             <input 
                               type="text" 
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-[10px] text-center font-black text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all uppercase"
                               placeholder="HSN"
                               value={item.hsn}
                               onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                             />
                           </td>
                           <td className="px-4 py-5">
                             <div className="flex items-center justify-center gap-1.5">
                               <input 
                                 type="number" 
                                 className="w-14 bg-transparent border-b border-gray-200 px-1 py-1.5 text-center text-sm font-black text-indigo-600 focus:border-indigo-500 outline-none"
                                 value={item.qty}
                                 onFocus={(e) => e.target.select()}
                                 onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                               />
                               <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{item.unit || 'PCS'}</span>
                             </div>
                           </td>
                           <td className="px-4 py-5">
                              <input 
                               type="text" 
                               inputMode="decimal"
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-black text-gray-800 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all outline-none shadow-none"
                               placeholder="0.00"
                               value={item.rate}
                               onFocus={(e) => e.target.select()}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                   updateItem(item.id, 'rate', val);
                                 }
                               }}
                             />
                           </td>
                           <td className="px-6 py-5 text-right font-black text-indigo-600 text-sm italic">
                             ₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </td>
                           <td className="px-4 py-5 text-center">
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

                {/* Mobile Item Cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="p-5 space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item #{index + 1}</span>
                            <button onClick={() => removeItem(item.id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                        </div>
                        <input 
                            type="text" 
                            className="w-full text-base font-black text-gray-900 uppercase placeholder:text-gray-300 border border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            placeholder="Item Description"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            list={`items-list-mobile-${item.id}`}
                        />
                        <datalist id={`items-list-mobile-${item.id}`}>
                              {itemsPool.map(i => <option key={i._id} value={i.name} />)}
                        </datalist>
                        <div className="grid grid-cols-2 gap-6 pt-2">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</label>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                                    <input type="number" className="w-full bg-transparent border-none outline-none text-sm font-black text-indigo-600" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} />
                                    <span className="text-[10px] font-black text-gray-400 uppercase">PCS</span>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate (₹)</label>
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                                    <input 
                                      type="text" 
                                      inputMode="decimal"
                                      className="w-full bg-transparent border-none outline-none text-sm font-black text-gray-900" 
                                      placeholder="0.00"
                                      value={item.rate || ''} 
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                          updateItem(item.id, 'rate', val);
                                        }
                                      }}
                                    />
                                </div>
                             </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                             <span className="text-[10px] font-black text-gray-400 uppercase">Line Total</span>
                             <span className="text-lg font-black text-indigo-600">₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                  <div 
                    className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group"
                    onClick={addItem}
                  >
                    <Plus size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-sm font-black text-gray-500 group-hover:text-indigo-600 uppercase tracking-widest">Add Item</span>
                  </div>
                </div>
              </div>

              {/* Extras Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-sm">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Internal Notes</div>
                  <textarea 
                    className="w-full h-32 bg-gray-50/50 rounded-[20px] border border-gray-50 focus:bg-white focus:border-indigo-100 transition-all p-5 text-xs font-bold text-gray-600 resize-none outline-none"
                    placeholder="Provide details about why this credit note is being issued..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Terms & Conditions</div>
                    <textarea 
                        className="w-full h-32 bg-gray-50/50 rounded-[20px] border border-gray-50 focus:bg-white focus:border-indigo-100 transition-all p-5 text-[10px] leading-relaxed font-bold text-gray-500 resize-none outline-none"
                        value={formData.terms}
                        onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Right Section (3 Cols) */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              
              {/* Credit Note Meta Info */}
              <div className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm">
                <div className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">CN Number:</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus-within:bg-white focus-within:border-indigo-100 transition-all">
                        <Hash size={14} className="text-gray-300" />
                        <input type="text" value={formData.returnNo} onChange={e => setFormData({...formData, returnNo: e.target.value})} className="bg-transparent border-none outline-none text-xs font-black text-gray-800 w-full" />
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Issue Date:</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-transparent rounded-xl pl-12 pr-4 py-3 text-xs font-black text-gray-800 focus:bg-white focus:border-indigo-100 outline-none transition-all" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Original Invoice Ref:</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus-within:bg-white focus-within:border-indigo-100 transition-all">
                        <FileText size={14} className="text-gray-300" />
                        <input type="text" placeholder="Optional" value={formData.originalInvoiceNo} onChange={e => setFormData({...formData, originalInvoiceNo: e.target.value})} className="bg-transparent border-none outline-none text-xs font-black text-gray-800 w-full" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Adjustment Reason:</label>
                      <div className="relative">
                        <select 
                            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-xs font-black text-gray-800 outline-none focus:bg-white focus:border-indigo-100 transition-all appearance-none cursor-pointer"
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                        >
                            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                   </div>
                </div>
              </div>

              {/* Totals Calculation Card */}
              <div className="bg-white rounded-[24px] border border-gray-100 p-8 space-y-6 shadow-sm">
                <div className="space-y-4">
                   {/* Subtotal */}
                   <div className="flex justify-between items-center group">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                     <span className="text-sm font-black text-gray-800">₹ {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                   
                   {/* Additional Charges */}
                   <div className="flex justify-between items-center group gap-4 py-2 border-t border-gray-50">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1">
                            Additional Charges
                        </span>
                     </div>
                     <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 focus-within:border-indigo-200 transition-all">
                        <span className="text-[10px] font-bold text-gray-400">₹</span>
                        <input 
                            type="number" 
                            className="w-20 text-right bg-transparent border-none outline-none text-xs font-black text-gray-700" 
                            value={formData.additionalCharges || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setFormData({...formData, additionalCharges: e.target.value})}
                            placeholder="0"
                        />
                     </div>
                   </div>

                   {/* Overall Discount */}
                   <div className="flex justify-between items-center group gap-4 py-2 border-t border-gray-50">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1">
                            Discount
                        </span>
                        <select 
                            value={formData.overallDiscountType}
                            onChange={(e) => setFormData({...formData, overallDiscountType: e.target.value})}
                            className="text-[9px] bg-indigo-50 text-indigo-600 border-none rounded px-1 py-0.5 font-bold outline-none cursor-pointer"
                        >
                            <option value="percentage">%</option>
                            <option value="fixed">Flat</option>
                        </select>
                     </div>
                     <div className="flex items-center gap-1 bg-indigo-50/50 px-2 py-1 rounded-lg border border-indigo-100/50 focus-within:border-indigo-200 transition-all">
                        <span className="text-[10px] font-bold text-indigo-400">{formData.overallDiscountType === 'percentage' ? '%' : '₹'}</span>
                        <input 
                            type="number" 
                            className="w-20 text-right bg-transparent border-none outline-none text-xs font-black text-indigo-600" 
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
                       <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[4px] mb-1">Total Credit</div>
                       <div className="text-3xl font-black tracking-tight">₹ {totals.roundedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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

              {/* Authorised Bottom Section */}
              <div className="bg-indigo-50/40 rounded-2xl p-6 border border-indigo-50 space-y-3">
                 <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest text-center">Issued By</div>
                 <div className="text-center font-black text-indigo-900 uppercase text-xs tracking-tight">FAIZAN MACHINERY & AQUACULTURE</div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditCreditNote;
