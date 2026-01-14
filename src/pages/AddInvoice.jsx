import React, { useState,  useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, ArrowLeft, Search, X, Receipt
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

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
      { id: Date.now(), name: '', itemId: null, hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, tax: 0, amount: 0 }
    ],
    // GST Fields
    gstEnabled: false,
    gstRate: 18,
    taxType: 'Exclusive', // 'Inclusive' or 'Exclusive'
    stateOfSupply: '',
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

  const [searchParty, setSearchParty] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  
  // Item Search State
  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');

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
          const baseAmount = (parseFloat(updatedItem.qty) || 0) * (parseFloat(updatedItem.rate) || 0);
          const discAmount = (baseAmount * (parseFloat(updatedItem.discount) || 0)) / 100;
          updatedItem.amount = baseAmount - discAmount;
          
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
              code: itemData.code,
              hsn: itemData.hsn || '',
              rate: itemData.sellingPrice || 0,
              unit: itemData.unit || 'PCS',
              amount: (itemData.sellingPrice || 0) * (newItems[index].qty || 1)
          };
          return { ...prev, items: newItems };
      });
      setActiveItemSearchIndex(null);
      setItemSearchTerm('');
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

  // Grand Totals Calculation with GST
  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    let discountVal = 0;
    if (formData.overallDiscountType === 'percentage') {
      discountVal = (subtotal * (parseFloat(formData.overallDiscount) || 0)) / 100;
    } else {
      discountVal = parseFloat(formData.overallDiscount) || 0;
    }

    const afterDiscount = subtotal - discountVal;
    const withCharges = afterDiscount + (parseFloat(formData.additionalCharges) || 0);

    let taxableAmount = withCharges;
    let gstAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (formData.gstEnabled) {
      const gstRate = parseFloat(formData.gstRate) || 0;
      
      if (formData.taxType === 'Inclusive') {
        // GST is included in the price
        taxableAmount = withCharges / (1 + gstRate / 100);
        gstAmount = withCharges - taxableAmount;
      } else {
        // GST is added on top
        gstAmount = (withCharges * gstRate) / 100;
      }

      // Determine CGST/SGST vs IGST based on state
      // Assuming company state is Uttar Pradesh
      const companyState = 'Uttar Pradesh';
      const partyState = formData.party?.placeOfSupply || formData.stateOfSupply || '';
      
      if (partyState && partyState.toLowerCase() === companyState.toLowerCase()) {
        // Intra-state: CGST + SGST
        cgst = gstAmount / 2;
        sgst = gstAmount / 2;
        igst = 0;
      } else {
        // Inter-state: IGST
        igst = gstAmount;
        cgst = 0;
        sgst = 0;
      }
    }

    const totalBeforeRound = formData.taxType === 'Inclusive' ? withCharges : (withCharges + gstAmount);
    const roundedTotal = formData.autoRoundOff ? Math.round(totalBeforeRound) : totalBeforeRound;
    const roundOffDiff = (roundedTotal - totalBeforeRound).toFixed(2);
    const balance = roundedTotal - (parseFloat(formData.amountReceived) || 0);

    return { 
      subtotal, 
      discountVal, 
      taxableAmount, 
      gstAmount,
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
            paymentTerms: formData.paymentTerms,
            party: formData.party._id, 
            partyName: formData.party.name,
            billingAddress: formData.party.billingAddress,
            stateOfSupply: formData.party.placeOfSupply || formData.stateOfSupply,
            
            // GST Fields - Explicitly included
            gstEnabled: formData.gstEnabled,
            gstRate: parseFloat(formData.gstRate) || 0,
            taxType: formData.taxType,
            
            items: formData.items.map(item => ({
                itemId: item.itemId,
                name: item.name,
                hsn: item.hsn,
                qty: parseFloat(item.qty),
                unit: item.unit,
                rate: parseFloat(item.rate),
                discount: parseFloat(item.discount),
                tax: parseFloat(item.tax),
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
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                            <Plus size={16} />
                        </div>
                      </div>
                      
                      {showPartyDropdown && (
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

              {/* GST Toggle Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase">GST Billing</h3>
                      <p className="text-[10px] text-gray-600 font-medium">Enable GST calculation for this invoice</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.gstEnabled}
                        onChange={(e) => setFormData({...formData, gstEnabled: e.target.checked})}
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-bold text-gray-700">{formData.gstEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                  </div>
                </div>

                {/* GST Options - Show when enabled */}
                {formData.gstEnabled && (
                  <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider">GST Rate (%)</label>
                      <select 
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.gstRate}
                        onChange={(e) => setFormData({...formData, gstRate: parseFloat(e.target.value)})}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider">Tax Type</label>
                      <select 
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.taxType}
                        onChange={(e) => setFormData({...formData, taxType: e.target.value})}
                      >
                        <option value="Exclusive">Exclusive</option>
                        <option value="Inclusive">Inclusive</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider">State of Supply</label>
                      <input 
                        type="text" 
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.stateOfSupply}
                        onChange={(e) => setFormData({...formData, stateOfSupply: e.target.value})}
                        placeholder="e.g., Uttar Pradesh"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3 text-left w-10">#</th>
                        <th className="px-4 py-3 text-left">Product / Service</th>
                        <th className="px-4 py-3 text-center w-24">Batch/HSN</th>
                        <th className="px-4 py-3 text-center w-24">QTY</th>
                        <th className="px-4 py-3 text-right w-32">Rate</th>
                        <th className="px-4 py-3 text-right w-24">Disc %</th>
                        <th className="px-4 py-3 text-right w-32">Amount</th>
                        <th className="px-4 py-3 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50/10 transition-colors group">
                          <td className="px-4 py-3 text-center text-xs font-bold text-gray-400">{index + 1}</td>
                          <td className="px-4 py-3 relative">
                            <input 
                              type="text" 
                              className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300"
                              placeholder="Search Item..."
                              value={activeItemSearchIndex === index ? itemSearchTerm : item.name}
                              onChange={(e) => {
                                  setActiveItemSearchIndex(index);
                                  setItemSearchTerm(e.target.value);
                                  updateItem(item.id, 'name', e.target.value);
                              }}
                              onFocus={() => {
                                  setActiveItemSearchIndex(index);
                                  setItemSearchTerm(item.name);
                              }}
                              onBlur={() => {
                                  setTimeout(() => setActiveItemSearchIndex(null), 200);
                              }}
                            />
                            {activeItemSearchIndex === index && itemSearchTerm && (
                                <div className="absolute top-10 left-0 w-full min-w-[300px] bg-white border border-gray-200 rounded-lg shadow-xl z-[60] max-h-48 overflow-y-auto">
                                    {allItems.filter(i => i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).map(i => (
                                        <div 
                                            key={i._id} 
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                                            onMouseDown={() => selectItem(index, i)}
                                        >
                                            <div>
                                                <div className="font-bold text-sm text-gray-900">{i.name}</div>
                                                <div className="text-[10px] text-gray-500">Stock: {i.stock} {i.unit}</div>
                                            </div>
                                            <div className="font-bold text-xs text-blue-600">₹{i.sellingPrice}</div>
                                        </div>
                                    ))}
                                    {allItems.filter(i => i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())).length === 0 && (
                                        <div className="px-4 py-2 text-xs text-gray-500 italic">No items found</div>
                                    )}
                                </div>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            <input 
                              type="text" 
                              className="w-full bg-transparent border-none outline-none text-xs text-center font-bold text-gray-500"
                              placeholder="HSN"
                              value={item.hsn}
                              onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center justify-center gap-1 border border-gray-200 rounded-lg bg-white p-1 shadow-sm">
                              <input 
                                type="number" 
                                className="w-12 bg-transparent border-none outline-none text-center text-xs font-black"
                                value={item.qty}
                                onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                              />
                              <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                             <input 
                              type="number" 
                              className="w-full bg-transparent border-none outline-none text-right text-sm font-bold text-gray-600"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-3">
                             <input 
                              type="number" 
                              className="w-full bg-transparent border-none outline-none text-right text-xs font-bold text-gray-400 focus:text-blue-600"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-black text-gray-900">
                            ₹{item.amount.toLocaleString()}
                          </td>
                          <td className="px-2 py-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={() => removeItem(item.id)}
                               className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                             >
                                <Trash2 size={14} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Item List */}
                <div className="md:hidden divide-y divide-gray-100">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="p-4 space-y-3 relative">
                       <div className="flex justify-between items-start">
                          <input 
                            type="text" 
                            className="bg-transparent text-sm font-bold w-full outline-none"
                            placeholder="Item Name" 
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          />
                          <button onClick={() => removeItem(item.id)} className="text-gray-300 p-1"><X size={16}/></button>
                       </div>
                       
                       <div className="flex gap-2">
                           <div className="flex-1 bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Qty</label>
                              <input type="number" className="w-full bg-transparent font-bold text-sm outline-none" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} />
                           </div>
                           <div className="flex-1 bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Rate</label>
                              <input type="number" className="w-full bg-transparent font-bold text-sm outline-none" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} />
                           </div>
                           <div className="flex-1 bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Amount</label>
                              <div className="font-black text-sm">₹{item.amount}</div>
                           </div>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex justify-center">
                  <button 
                    onClick={addItem} 
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all uppercase tracking-wide"
                  >
                    <Plus size={14} /> Add Line Item
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
                       <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1 cursor-pointer hover:underline whitespace-nowrap">
                         <Plus size={10} /> Add Charges
                       </span>
                    </div>
                    <input 
                      type="number" 
                      className="w-24 text-right bg-transparent border-none outline-none text-xs font-bold text-gray-400 focus:text-gray-900 border-b border-dashed border-transparent focus:border-gray-200 transition-colors"
                      value={formData.additionalCharges}
                      onChange={(e) => setFormData({...formData, additionalCharges: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex justify-between items-center group gap-2">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1 cursor-pointer hover:underline whitespace-nowrap">
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
                      value={formData.overallDiscount}
                      onChange={(e) => setFormData({...formData, overallDiscount: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  {/* GST Breakdown */}
                  {formData.gstEnabled && (
                    <>
                      <div className="pt-2 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-500">Taxable Amount</span>
                          <span className="font-black text-gray-700">₹{totals.taxableAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      {totals.igst > 0 ? (
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-blue-600">IGST ({formData.gstRate}%)</span>
                          <span className="font-black text-blue-600">₹{totals.igst.toFixed(2)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-green-600">CGST ({formData.gstRate / 2}%)</span>
                            <span className="font-black text-green-600">₹{totals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-green-600">SGST ({formData.gstRate / 2}%)</span>
                            <span className="font-black text-green-600">₹{totals.sgst.toFixed(2)}</span>
                          </div>
                        </>
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
                             value={formData.amountReceived}
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
    </DashboardLayout>
  );
};

export default AddInvoice;