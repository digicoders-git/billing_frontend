import React, { useState,  useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, ArrowLeft, Search, X, Receipt
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
              className="px-6 sm:px-8 py-2 bg-black text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/20 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            
            {/* Left Section */}
            <div className="col-span-12 lg:col-span-9 space-y-4">
              
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
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-xl text-slate-800">Items & Services</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{formData.items.length} Entries</span>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No.</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[300px]">Product / Service</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">HSN</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">MRP</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32 text-center">Qty / Unit</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-36 text-right">Rate (₹)</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">GST Selection</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Disc %</th>
                        <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 text-right">Amount</th>
                        <th className="py-5 px-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors duration-200">
                          <td className="py-4 px-4 text-center">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mx-auto">
                                {index + 1}
                             </div>
                          </td>
                          <td className="py-4 px-4">
                            <div 
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:ring-4 hover:ring-blue-500/5 transition-all shadow-sm"
                              onClick={() => {
                                setActiveItemIndex(index);
                                setShowItemPicker(true);
                              }}
                            >
                              <div className="flex flex-col">
                                  <span className={cn("text-sm font-bold truncate", item.name ? "text-slate-800" : "text-slate-400 italic")}>
                                    {item.name || "Select Product / Service"}
                                  </span>
                                  {item.code && <span className="text-[10px] font-semibold text-slate-400">Code: {item.code}</span>}
                              </div>
                              <Search size={16} className="text-blue-400" />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input 
                              type="text" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-sm"
                              placeholder="HSN"
                              value={item.hsn}
                              onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input 
                              type="number" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-sm"
                              value={item.mrp}
                              onChange={(e) => updateItem(item.id, 'mrp', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                <input 
                                    type="number" 
                                    className="w-full min-w-0 bg-transparent border-none text-center font-bold text-slate-800 p-2.5 outline-none"
                                    value={item.qty}
                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                />
                                <div className="bg-slate-50 border-l border-slate-100 px-3 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">{item.unit || 'PCS'}</span>
                                </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                <input 
                                  type="number" 
                                  className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-right text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                  value={item.rate}
                                  onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                />
                             </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="relative">
                                    <select 
                                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer"
                                      value={item.gstRate}
                                      onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)}
                                    >
                                      {gstOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                                {item.gstAmount > 0 && (
                                     <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Tax</span>
                                        <span className="text-[9px] font-bold text-blue-600">₹{item.gstAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="relative">
                                <input 
                                  type="number" 
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-sm"
                                  placeholder="0"
                                  value={item.discount}
                                  onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-800">
                                  ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                             </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                             <button
                               onClick={() => removeItem(item.id)}
                               className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                               title="Remove Item"
                             >
                                <Trash2 size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                   {formData.items.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-slate-500 font-medium">No items added to this invoice</p>
                            <button onClick={addItem} className="mt-3 text-blue-600 font-bold hover:underline">Add First Item</button>
                        </div>
                   )}

                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button 
                    onClick={addItem} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-dashed border-blue-200 shadow-sm rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all uppercase tracking-wide active:scale-95"
                  >
                    <Plus size={18} /> Add New Entry Row
                  </button>
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
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-gray-400 uppercase">Subtotal</span>
                    <span className="text-sm font-black text-gray-700">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center group gap-2">
                    <div className="flex flex-col shrink-0">
                       <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap">
                         <Plus size={10} /> Add Charges
                       </span>
                    </div>
                    <input 
                      type="number" 
                      className="w-24 text-right bg-transparent border-none outline-none text-xs font-bold text-gray-400 focus:text-gray-900 border-b border-dashed border-transparent focus:border-gray-200 transition-colors"
                      placeholder="0"
                      value={formData.additionalCharges === 0 ? '' : formData.additionalCharges}
                      onChange={(e) => setFormData({...formData, additionalCharges: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex justify-between items-center group gap-2">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap">
                           <Plus size={10} /> Discount
                        </span>
                        <select 
                          className="text-[10px] font-bold border-none bg-blue-50 text-blue-600 outline-none rounded p-0.5 cursor-pointer uppercase"
                          value={formData.overallDiscountType}
                          onChange={(e) => setFormData({...formData, overallDiscountType: e.target.value})}
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">INR</option>
                        </select>
                     </div>
                     <input 
                      type="number" 
                      className="w-24 text-right bg-transparent border-none outline-none text-xs font-bold text-gray-400 focus:text-gray-900 border-b border-dashed border-transparent focus:border-gray-200 transition-colors"
                      placeholder="0"
                      value={formData.overallDiscount === 0 ? '' : formData.overallDiscount}
                      onChange={(e) => setFormData({...formData, overallDiscount: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                   {/* GST Breakdown */}
                   {totals.gstAmount > 0 && (
                    <>
                      {totals.igst > 0 ? (
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-gray-100">
                          <span className="font-bold text-blue-600 uppercase">IGST (Total)</span>
                          <span className="font-black text-blue-600">₹{totals.igst.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="space-y-1 pt-2 border-t border-dashed border-gray-100">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-green-600 uppercase">CGST (Total)</span>
                            <span className="font-black text-green-600">₹{totals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-green-600 uppercase">SGST (Total)</span>
                            <span className="font-black text-green-600">₹{totals.sgst.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                   <div className="flex justify-between items-center gap-2 bg-black p-4 rounded-xl text-white shadow-xl shadow-black/10 overflow-hidden relative group cursor-default">
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="text-[9px] font-black uppercase opacity-60 tracking-[2px] mb-1">Total Payable</div>
                        <div className="text-xl sm:text-2xl font-black truncate">₹ {totals.roundedTotal.toLocaleString()}</div>
                      </div>
                      <div className="absolute right-[-20px] bottom-[-40px] opacity-10 rotate-12 bg-white rounded-full w-32 h-32 group-hover:scale-110 transition-transform duration-500" />
                   </div>

                   <div className="pt-6 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                         <div className="flex items-center gap-2">
                           <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={formData.autoRoundOff}
                                    onChange={(e) => setFormData({...formData, autoRoundOff: e.target.checked})}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:bg-black checked:border-black transition-all"
                                />
                                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                           </div>
                           <span className="text-[10px] font-black text-gray-500 uppercase whitespace-nowrap">Round Off</span>
                         </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Amount Received</label>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-2 bg-gray-50/30 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                           <span className="text-gray-400 font-bold shrink-0">₹</span>
                           <input 
                             type="number" 
                             className="bg-transparent border-none outline-none flex-1 font-black text-gray-800 text-sm min-w-0"
                             placeholder="0"
                             value={formData.amountReceived === 0 ? '' : formData.amountReceived}
                             onChange={(e) => setFormData({...formData, amountReceived: parseFloat(e.target.value) || 0})}
                           />
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-4 border-t border-dashed border-gray-100">
                         <span className="text-[10px] font-black uppercase text-gray-400 shrink-0 tracking-wider">Balance Due</span>
                         <span className={`text-base sm:text-lg font-black italic truncate ${totals.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>₹ {totals.balance.toLocaleString()}</span>
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