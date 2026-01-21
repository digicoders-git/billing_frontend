import React, { useState,  useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, ArrowLeft, Search, X, Receipt
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
// import { cn } from '../lib/utils';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

const AddInvoice = () => {
  const navigate = useNavigate();
  
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState([]);

  // Fetch Parties & Items
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [partiesRes, itemsRes] = await Promise.all([
                api.get('/parties'),
                api.get('/items')
            ]);
            setParties(partiesRes.data);
            setAllItems(itemsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'Failed to fetch required data', 'error');
        }
    };
    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    paymentTerms: '0',
    party: null,
    items: [
      { id: Date.now(), name: '', itemId: null, hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', gstAmount: 0, amount: 0 }
    ],
    notes: '',
    terms: '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to [SIDDHARTH NAGAR] jurisdiction only.',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage',
    autoRoundOff: true,
    amountReceived: 0,
    paymentMethod: 'Cash'
  });

  // Generate Invoice Number on Mount
  useEffect(() => {
      const generateInvoiceNo = async () => {
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          setFormData(prev => ({ ...prev, invoiceNo: `INV-${new Date().getFullYear()}-${randomNum}` }));
      };
      generateInvoiceNo();
  }, []);

  // Check for newly created party from localStorage
  useEffect(() => {
      const newPartyData = localStorage.getItem('newlyCreatedParty');
      if (newPartyData) {
          try {
              const newParty = JSON.parse(newPartyData);
              setFormData(prev => ({ 
                  ...prev, 
                  party: newParty,
                  stateOfSupply: newParty.placeOfSupply || ''
              }));
              // Clear from localStorage after using
              localStorage.removeItem('newlyCreatedParty');
              
              // Show success toast
              Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'success',
                  title: `${newParty.name} selected`,
                  showConfirmButton: false,
                  timer: 2000
              });
          } catch (error) {
              console.error('Error parsing newly created party:', error);
          }
      }
  }, []);

  const [searchParty, setSearchParty] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  
  // Item Picker State
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickerSearchTerm, setPickerSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  // Calculate Due Date
  const dueDate = useMemo(() => {
    if (!formData.date) return '';
    const days = parseInt(formData.paymentTerms) || 0;
    const date = new Date(formData.date);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, [formData.paymentTerms, formData.date]);

  // Handle Item Row Calculations
  const updateItem = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto Update Amount
          const qty = parseFloat(updatedItem.qty) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          const discPercent = parseFloat(updatedItem.discount) || 0;
          const gstStr = updatedItem.gstRate || 'None';
          
          let gstPercent = 0;
          if (gstStr.includes('@')) {
              gstPercent = parseFloat(gstStr.split('@')[1]) || 0;
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
          const gstAmount = (taxableAmount * gstPercent) / 100;

          newItems[activeItemIndex] = {
              ...newItems[activeItemIndex],
              itemId: itemData._id,
              name: itemData.name,
              code: itemData.code,
              hsn: itemData.hsn || '',
              mrp: itemData.mrp || 0,
              rate: rate,
              unit: itemData.unit || 'PCS',
              gstRate: gstStr,
              gstAmount: gstAmount,
              amount: taxableAmount + gstAmount
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
      items: [...prev.items, { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', gstAmount: 0, amount: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    }
  };

  // Grand Totals Calculation
  const totals = useMemo(() => {
    // Calculate item-wise totals
    const itemTotals = formData.items.reduce((acc, item) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const discPercent = parseFloat(item.discount) || 0;
      
      // Base amount before discount
      const baseAmount = qty * rate;
      
      // Discount amount
      const discAmount = (baseAmount * discPercent) / 100;
      
      // Taxable amount (after item discount)
      const taxableAmount = baseAmount - discAmount;
      
      // GST calculation
      const gstStr = item.gstRate || 'None';
      let gstPercent = 0;
      if (gstStr.includes('@')) {
        gstPercent = parseFloat(gstStr.split('@')[1]) || 0;
      }
      const gstAmount = (taxableAmount * gstPercent) / 100;
      
      return {
        baseAmount: acc.baseAmount + baseAmount,
        itemDiscount: acc.itemDiscount + discAmount,
        taxableAmount: acc.taxableAmount + taxableAmount,
        gstAmount: acc.gstAmount + gstAmount,
        total: acc.total + (taxableAmount + gstAmount)
      };
    }, { baseAmount: 0, itemDiscount: 0, taxableAmount: 0, gstAmount: 0, total: 0 });

    // Subtotal (taxable amount after item discounts)
    const subtotal = itemTotals.taxableAmount;
    
    // Overall discount on taxable amount
    let overallDiscountVal = 0;
    if (formData.overallDiscountType === 'percentage') {
      overallDiscountVal = (subtotal * (parseFloat(formData.overallDiscount) || 0)) / 100;
    } else {
      overallDiscountVal = parseFloat(formData.overallDiscount) || 0;
    }

    // Taxable amount after overall discount
    const taxableAfterDiscount = subtotal - overallDiscountVal;
    
    // Recalculate GST on discounted taxable amount if overall discount is applied
    let finalGstAmount = itemTotals.gstAmount;
    if (overallDiscountVal > 0) {
      // Proportionally reduce GST
      const discountRatio = taxableAfterDiscount / subtotal;
      finalGstAmount = itemTotals.gstAmount * discountRatio;
    }
    
    // Add additional charges
    const withCharges = taxableAfterDiscount + finalGstAmount + (parseFloat(formData.additionalCharges) || 0);

    // CGST/SGST vs IGST split
    const companyState = 'Uttar Pradesh';
    const partyState = formData.party?.placeOfSupply || formData.stateOfSupply || '';
    
    let cgst = 0, sgst = 0, igst = 0;
    if (partyState && partyState.toLowerCase() === companyState.toLowerCase()) {
      cgst = finalGstAmount / 2;
      sgst = finalGstAmount / 2;
    } else {
      igst = finalGstAmount;
    }

    // Round off
    const totalBeforeRound = withCharges;
    const roundedTotal = formData.autoRoundOff ? Math.round(totalBeforeRound) : totalBeforeRound;
    const roundOffDiff = (roundedTotal - totalBeforeRound).toFixed(2);
    const balance = roundedTotal - (parseFloat(formData.amountReceived) || 0);

    return { 
      subtotal: itemTotals.baseAmount, // Base amount before any discounts
      itemDiscount: itemTotals.itemDiscount,
      taxableAmount: taxableAfterDiscount, // After all discounts
      discountVal: overallDiscountVal,
      gstAmount: finalGstAmount,
      cgst,
      sgst,
      igst,
      roundedTotal, 
      roundOffDiff, 
      balance 
    };
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party) {
        Swal.fire('Error', 'Please select a party first!', 'error');
        return;
    }

    setLoading(true);
    try {
        const payload = {
            invoiceNo: formData.invoiceNo,
            date: formData.date,
            party: formData.party, // ObjectId reference to Party
            partyName: formData.partyName, // String for display
            billingAddress: formData.billingAddress || '',
            // Removed global GST fields
            
            items: formData.items.map(item => ({
                itemId: item.itemId,
                name: item.name,
                hsn: item.hsn,
                qty: parseFloat(item.qty),
                unit: item.unit,
                mrp: parseFloat(item.mrp) || 0,
                rate: parseFloat(item.rate),
                discount: parseFloat(item.discount),
                gstRate: (() => {
                    const rateStr = item.gstRate || 'None';
                    if (rateStr.includes('@')) {
                        return parseFloat(rateStr.split('@')[1]) || 0;
                    }
                    return 0;
                })(),
                gstAmount: parseFloat(item.gstAmount) || 0,
                amount: parseFloat(item.amount)
            })),
            
            // Calculated Totals
            subtotal: totals.subtotal,
            taxableAmount: totals.taxableAmount,
            gstAmount: totals.gstAmount,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            totalAmount: totals.roundedTotal,
            roundOffDiff: parseFloat(totals.roundOffDiff),
            
            gstEnabled: totals.gstAmount > 0,
            gstRate: (() => {
                // If there's GST, we can use the max rate among items or default
                const maxRate = Math.max(...formData.items.map(it => {
                    const rateStr = it.gstRate || 'None';
                    return rateStr.includes('@') ? (parseFloat(rateStr.split('@')[1]) || 0) : 0;
                }));
                return maxRate;
            })(),
            
            // Payment Info
            additionalCharges: parseFloat(formData.additionalCharges) || 0,
            overallDiscount: parseFloat(formData.overallDiscount) || 0,
            overallDiscountType: formData.overallDiscountType,
            autoRoundOff: formData.autoRoundOff,
            amountReceived: parseFloat(formData.amountReceived) || 0,
            balanceAmount: totals.balance,
            paymentMethod: formData.paymentMethod,
            status: totals.balance <= 0 ? 'Paid' : (totals.balance < totals.roundedTotal ? 'Partial' : 'Unpaid'),
            dueDate: dueDate,
            
            // Notes
            notes: formData.notes,
            terms: formData.terms
        };

        console.log('Invoice Payload:', payload); // Debug log
        await api.post('/invoices', payload);
        Swal.fire({
            title: 'Success!',
            text: 'Invoice created successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        navigate('/invoices');
    } catch (error) {
        console.error('Error creating invoice:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to create invoice', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Top Header */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm mb-6 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 shrink-0">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-sm sm:text-xl font-bold text-gray-800 truncate uppercase tracking-tight">New Sale Invoice</h1>
          </div>
          <div className="flex items-center  gap-1.5 sm:gap-3">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 sm:px-8 py-2 bg-black text-white rounded-xl text-[10px] sm:text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/20 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            
            {/* Left Section */}
            <div className="col-span-12 lg:col-span-9 space-y-4 min-w-0">
              
              {/* Party Selection Block */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm relative">
                {!formData.party ? (
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50/50 hover:border-blue-400 transition-colors cursor-pointer group">
                        <Search size={20} className="text-gray-400 group-hover:text-blue-500 shrink-0" />
                        <input 
                          type="text" 
                          placeholder="Search Party (Name or Mobile)" 
                          className="bg-transparent border-none outline-none w-full text-sm font-bold placeholder:text-gray-400"
                          value={searchParty}
                          onChange={(e) => {
                            setSearchParty(e.target.value);
                            setShowPartyDropdown(true);
                          }}
                          onFocus={() => setShowPartyDropdown(true)}
                        />
                      </div>
                      
                      {showPartyDropdown && searchParty.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-2 z-50 max-h-60 overflow-y-auto ring-1 ring-black/5">
                          {parties.filter(p => p.name.toLowerCase().includes(searchParty.toLowerCase())).map(party => (
                            <div 
                              key={party._id} 
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, party, stateOfSupply: party.placeOfSupply || '' }));
                                setShowPartyDropdown(false);
                                setSearchParty('');
                              }}
                            >
                              <div>
                                  <div className="font-bold text-sm text-gray-900 group-hover:text-blue-600">{party.name}</div>
                                  <div className="text-[10px] text-gray-500 font-medium">{party.billingAddress || 'No Address'}</div>
                              </div>
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">{party.partyType}</span>
                            </div>
                          ))}
                          {parties.filter(p => p.name.toLowerCase().includes(searchParty.toLowerCase())).length === 0 && (
                             <div className="p-4 text-center text-sm text-gray-500 font-medium">No parties found</div>
                          )}
                          <div className="p-3 border-t border-gray-100 bg-gray-50">
                            <button 
                              onClick={() => navigate(`/add-party?returnTo=${encodeURIComponent(location.pathname)}`)}
                              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus size={16} />
                              Create New Customer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/20"><User size={20} /></div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-gray-900 truncate uppercase tracking-tight">{formData.party.name}</h2>
                            <p className="text-[10px] sm:text-xs text-gray-500 font-bold">GSTIN: {formData.party.gstin || 'N/A'}</p>
                        </div>
                        <button onClick={() => setFormData(prev => ({ ...prev, party: null }))} className="text-red-500 text-[10px] sm:text-xs font-bold hover:underline ml-auto sm:ml-4 bg-red-50 px-3 py-1 rounded-lg">CHANGE</button>
                      </div>
                      <div className="pl-[52px]">
                         <p className="text-[11px] text-gray-500 font-medium line-clamp-2 w-3/4">{formData.party.billingAddress || 'No billing address provided'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] sm:text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-blue-100">{formData.party.placeOfSupply || 'State N/A'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-xl text-slate-800">Items & Services</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{formData.items.length} Entries</span>
                    </div>
                </div>

                <div className="flex-1 bg-gray-50/50">
                {/* Mobile Item Cards */}
                <div className="md:hidden space-y-3 p-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">ITEM {index + 1}</span>
                            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                        </div>
                        
                        <div 
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900"
                           onClick={() => {
                               setActiveItemIndex(index);
                               setShowItemPicker(true);
                           }}
                        >
                           {item.name || <span className="text-gray-400 italic font-medium">Tap to select item...</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">HSN</label>
                              <input 
                                type="text" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all uppercase"
                                placeholder="HSN" 
                                value={item.hsn} 
                                onChange={(e) => updateItem(item.id, 'hsn', e.target.value)} 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">MRP</label>
                              <input 
                                type="number" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                placeholder="0" 
                                value={item.mrp || ''} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'mrp', e.target.value)} 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Qty</label>
                              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2">
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-indigo-600"
                                    placeholder="1" 
                                    value={item.qty} 
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)} 
                                />
                                <span className="text-[8px] font-bold text-gray-400 uppercase">{item.unit || 'PCS'}</span>
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Rate</label>
                              <input 
                                type="number" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                placeholder="0" 
                                value={item.rate} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'rate', e.target.value)} 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">GST</label>
                              <select 
                                value={item.gstRate} 
                                onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all uppercase"
                              >
                                {gstOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Disc %</label>
                              <input 
                                type="number" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                placeholder="0" 
                                value={item.discount} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, 'discount', e.target.value)} 
                              />
                           </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                            <span className="text-base font-bold text-indigo-600">₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                  ))}
                   {formData.items.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-xs font-medium">No items added</p>
                            <button onClick={addItem} className="mt-2 text-indigo-600 text-xs font-bold uppercase tracking-wide">Tap to Add Item</button>
                        </div>
                   )}
               
            
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
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
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
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
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className="font-bold text-gray-900 truncate uppercase tracking-tight">{item.name}</span>
                                        {item.code && <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Code: {item.code}</span>}
                                    </div>
                                ) : (
                                    <span className="flex-1 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Search Item...</span>
                                )}
                                <Search size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                             </div>
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
                             <input 
                               type="number" 
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-black text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                               placeholder="0"
                               value={item.mrp || ''}
                               onFocus={(e) => e.target.select()}
                               onChange={(e) => updateItem(item.id, 'mrp', e.target.value)}
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
                               type="number" 
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-black text-gray-800 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                               value={item.rate}
                               onFocus={(e) => e.target.select()}
                               onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                             />
                           </td>
                           <td className="px-4 py-5">
                             <select
                               value={item.gstRate}
                               onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)}
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
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-xs text-right font-black text-gray-500 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                               value={item.discount}
                               onFocus={(e) => e.target.select()}
                               onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
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
                   {formData.items.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-slate-500 font-medium">No items added to this invoice</p>
                            <button onClick={addItem} className="mt-3 text-blue-600 font-bold hover:underline">Add First Item</button>
                        </div>
                   )}

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

              {/* Bottom Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Internal Notes</label>
                    <textarea 
                      className="w-full h-20 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 p-3 text-xs font-medium resize-none placeholder:text-gray-400"
                      placeholder="Add any internal notes here..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Terms & Conditions</label>
                  <textarea 
                    className="w-full h-20 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 p-3 text-xs font-medium resize-none text-gray-600"
                    value={formData.terms}
                    onChange={(e) => setFormData({...formData, terms: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              
              {/* Metadata */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Invoice No</label>
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-gray-300" />
                        <input 
                            type="text" 
                            value={formData.invoiceNo} 
                            onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                            className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-black outline-none py-1 text-sm font-bold text-gray-900"
                        />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider lg:text-left text-right w-full block">Date</label>
                      <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-300" />
                          <input 
                            type="date" 
                            value={formData.date} 
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-black outline-none py-1 text-sm font-bold text-gray-900"
                        />
                      </div>
                   </div>
                </div>
                
                <div className="border-t border-dashed border-gray-100 pt-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Payment Terms</label>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <input 
                          type="number" 
                          value={formData.paymentTerms} 
                          onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                          className="w-full bg-transparent border-none outline-none px-2 py-0.5 text-xs text-center font-bold"
                        />
                        <span className="px-2 py-1 bg-white rounded shadow-sm text-[9px] font-bold text-gray-500 uppercase">Days</span>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Due Date</label>
                      <div className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold text-red-500 bg-red-50 text-center">
                        {dueDate}
                      </div>
                   </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm relative overflow-hidden">
                <div className="space-y-4 relative z-10">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                    <span className="text-sm font-black text-gray-800">₹ {totals.subtotal.toLocaleString()}</span>
                  </div>
                  
                  {/* Additional Charges */}
                  <div className="flex justify-between items-center group gap-4 py-2 border-t border-gray-50">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1">
                            Additional Charges
                        </span>
                     </div>
                     <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 focus-within:border-blue-200 transition-all">
                        <span className="text-[10px] font-bold text-gray-400">₹</span>
                        <input 
                            type="number" 
                            value={formData.additionalCharges || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setFormData({...formData, additionalCharges: e.target.value})}
                            placeholder="0"
                            className="w-20 text-right bg-transparent border-none outline-none text-xs font-black text-gray-700"
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
                            className="text-[9px] bg-blue-50 text-blue-600 border-none rounded px-1 py-0.5 font-bold outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                            <option value="percentage">%</option>
                            <option value="fixed">Flat</option>
                        </select>
                     </div>
                     <div className="flex items-center gap-1 bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/50 focus-within:border-blue-200 transition-all">
                        <span className="text-[10px] font-bold text-blue-400">{formData.overallDiscountType === 'percentage' ? '%' : '₹'}</span>
                        <input 
                            type="number" 
                            value={formData.overallDiscount || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setFormData({...formData, overallDiscount: e.target.value})}
                            placeholder="0"
                            className="w-20 text-right bg-transparent border-none outline-none text-xs font-black text-blue-600"
                        />
                     </div>
                   </div>

                   {/* GST Breakdown */}
                   {totals.gstAmount > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-100">
                      {totals.igst > 0 ? (
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">IGST (Total)</span>
                          <span className="text-xs font-black text-blue-600">₹{totals.igst.toFixed(2)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">CGST (Total)</span>
                            <span className="text-xs font-black text-green-600">₹{totals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">SGST (Total)</span>
                            <span className="text-xs font-black text-green-600">₹{totals.sgst.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 relative z-10 border-t border-dashed border-gray-200">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <input 
                                type="checkbox" 
                                id="autoRoundOff"
                                checked={formData.autoRoundOff}
                                onChange={(e) => setFormData({...formData, autoRoundOff: e.target.checked})}
                                className="w-4 h-4 rounded text-black border-gray-300 focus:ring-0 cursor-pointer" 
                        />
                        <label htmlFor="autoRoundOff" className="text-[10px] font-black text-gray-400 uppercase tracking-tighter cursor-pointer">Auto Round Off</label>
                      </div>
                      {formData.autoRoundOff && (
                        <div className="text-[10px] font-bold text-gray-400">
                            {totals.roundOffDiff}
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      {/* Amount Received Input */}
                      <div className="space-y-1.5 group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">Amount Received</label>
                        <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50 focus-within:bg-white focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 transition-all">
                           <span className="text-gray-400 font-black text-xs">₹</span>
                           <input 
                             type="number" 
                             onFocus={(e) => e.target.select()}
                             value={formData.amountReceived || ''}
                             onChange={(e) => setFormData({...formData, amountReceived: e.target.value})}
                             placeholder="0"
                             className="bg-transparent border-none outline-none flex-1 font-black text-gray-800 text-sm"
                           />
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 py-3 border-y border-dashed border-gray-100">
                         <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Balance Due</span>
                         <span className={`text-xl font-black italic ${totals.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>₹ {totals.balance.toLocaleString()}</span>
                      </div>

                      <div className="space-y-2 pt-2">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block text-center">Final Amount</label>
                          <div className="bg-black p-5 rounded-3xl text-white shadow-2xl shadow-black/20 transform hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center">
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[4px] mb-1">Grand Total</div>
                              <div className="text-4xl font-black tracking-tight">₹ {totals.roundedTotal.toLocaleString()}</div>
                          </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Select Product</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pick an item from your inventory</p>
                </div>
                <button onClick={() => setShowItemPicker(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={20} /></button>
             </div>
             
             <div className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name or code..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-black focus:bg-white font-bold transition-all"
                    value={pickerSearchTerm}
                    onChange={(e) => setPickerSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Item List */}
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                  {allItems
                    .filter(item => 
                      item.name.toLowerCase().includes(pickerSearchTerm.toLowerCase()) || 
                      (item.code && item.code.toLowerCase().includes(pickerSearchTerm.toLowerCase()))
                    )
                    .map(item => (
                      <div 
                        key={item._id}
                        className="px-4 py-4 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-between group transition-all rounded-xl"
                        onClick={() => selectItem(item)}
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm group-hover:border-indigo-200 group-hover:scale-110 transition-all">
                              <Receipt size={20} className="text-indigo-600" />
                           </div>
                           <div>
                              <div className="font-black text-gray-900 text-sm uppercase group-hover:text-indigo-600 transition-colors">{item.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Code: {item.code || '-'}</span>
                                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                 <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{item.category}</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-black text-gray-900 italic">₹{item.sellingPrice?.toLocaleString()}</div>
                           <div className="text-[10px] text-gray-400 font-bold uppercase">Stock: {item.stock} {item.unit}</div>
                        </div>
                      </div>
                    ))
                  }
                  {allItems.filter(item => 
                    item.name.toLowerCase().includes(pickerSearchTerm.toLowerCase()) || 
                    (item.code && item.code.toLowerCase().includes(pickerSearchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="py-12 text-center">
                       <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <X size={32} className="text-gray-300" />
                       </div>
                       <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No products found</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AddInvoice;