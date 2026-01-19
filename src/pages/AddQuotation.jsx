import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, FileText, Settings, Keyboard, 
  ArrowLeft, Search, ScanBarcode, X,
  ChevronDown, Box, Package
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

const AddQuotation = () => {
  const navigate = useNavigate();
  
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Item Picker Modal State
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [itemPickerSearch, setItemPickerSearch] = useState('');

  // Fetch API Data
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [partiesRes, itemsRes] = await Promise.all([
                api.get('/parties'),
                api.get('/items')
            ]);
            setParties(partiesRes.data);
            setItems(itemsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire('Error', 'Failed to load parties or items', 'error');
        }
    };
    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    quotationNo: '',
    date: new Date().toISOString().split('T')[0],
    validFor: '30',
    party: null,
    items: [
      { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', gstAmount: 0, amount: 0 }
    ],
    notes: '',
    terms: '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to [SIDDHARTH NAGAR] jurisdiction only.',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage',
    autoRoundOff: true,
  });

  const [searchParty, setSearchParty] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  // Generate Quotation No
  useEffect(() => {
      const generateNo = () => {
          const rand = Math.floor(1000 + Math.random() * 9000);
          setFormData(prev => ({ ...prev, quotationNo: `QT-${new Date().getFullYear()}-${rand}` }));
      };
      generateNo();
  }, []);

  // Calculate Validity Date
  const validityDate = useMemo(() => {
    if (!formData.date) return '';
    const days = parseInt(formData.validFor) || 0;
    const date = new Date(formData.date);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, [formData.validFor, formData.date]);

  // Handle Item Updates
  const updateItem = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
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
          const rate = itemData.sellingPrice || 0;
          
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

  const addItemRow = () => {
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
    
    return { subtotal, taxableAmount, discountVal, roundedTotal };
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
            ...formData,
            party: formData.party._id,
            partyName: formData.party.name,
            validityDate: validityDate,
            items: formData.items.map(item => ({
                itemId: item.itemId,
                name: item.name,
                hsn: item.hsn,
                qty: parseFloat(item.qty),
                unit: item.unit,
                mrp: parseFloat(item.mrp) || 0,
                gstRate: item.gstRate,
                gstAmount: parseFloat(item.gstAmount) || 0,
                rate: parseFloat(item.rate),
                discount: parseFloat(item.discount),
                tax: parseFloat(item.tax),
                amount: parseFloat(item.amount)
            })),
            subtotal: totals.subtotal,
            additionalCharges: formData.additionalCharges,
            overallDiscount: formData.overallDiscount,
            overallDiscountType: formData.overallDiscountType,
            totalAmount: totals.roundedTotal,
            status: 'Open'
        };

        await api.post('/quotations', payload);
        Swal.fire({
            title: 'Success!',
            text: 'Quotation created successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        navigate('/sales/quotations');
    } catch (error) {
        console.error('Error saving quotation:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to save quotation', 'error');
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
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create Quotation</h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Generate a new cost estimate for your customer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                    </>
                  ) : (
                    <>
                        <Save size={18} />
                        <span>Save Quotation</span>
                    </>
                  )}
              </button>
            </div>
          </div>

        <div className="p-3 sm:p-6 lg:max-w-[1400px] mx-auto space-y-4">
          <div className="grid grid-cols-12 gap-4">
            
            {/* Left Section (Bill To & Items) */}
            <div className="col-span-12 lg:col-span-9 space-y-4">
              
              {/* Bill To Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm overflow-visible min-h-[160px] relative">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4">Quotation For</div>
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
                        <button 
                            onClick={() => navigate('/add-party', { state: { returnTo: '/add-quotation' } })}
                            className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-lg shadow-black/20 hover:bg-gray-800 transition-colors"
                            title="Add New Party"
                        >
                            <Plus size={16} />
                        </button>
                      </div>
                      
                      {showPartyDropdown && searchParty.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-2 z-50 max-h-60 overflow-y-auto ring-1 ring-black/5">
                          {parties.filter(p => p.name.toLowerCase().includes(searchParty.toLowerCase())).map(party => (
                            <div 
                              key={party._id} 
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, party }));
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
                  <div className="flex flex-col sm:row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 w-full relative">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-black text-white rounded-lg shrink-0"><User size={20} /></div>
                        <h2 className="text-lg font-black text-gray-900 truncate uppercase tracking-tight">{formData.party.name}</h2>
                        <button onClick={() => setFormData(prev => ({ ...prev, party: null }))} className="p-1 hover:bg-red-50 text-red-500 rounded-lg ml-auto transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500 line-clamp-2 pl-12">{formData.party.billingAddress || formData.party.address || 'Address not available'}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-wider text-gray-400 pl-12">
                        <span>GSTIN: <span className="text-gray-800">{formData.party.gstin || 'N/A'}</span></span>
                        <span>Mobile: <span className="text-gray-800">{formData.party.mobile || 'N/A'}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                    onClick={addItemRow}
                  >
                    <Plus size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600 uppercase tracking-wider">Add Item</span>
                  </div>
                </div>
              </div>

              {/* Terms and Notes Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-black h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Notes</label>
                  </div>
                  <textarea 
                    className="w-full h-24 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black/5 p-4 text-xs font-medium text-gray-600 resize-none transition-all"
                    placeholder="Enter any additional details or instructions..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-gray-400 h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Terms & Conditions</label>
                    </div>
                    <textarea 
                        className="w-full h-24 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200 p-4 text-[10px] leading-relaxed font-bold text-gray-500 resize-none transition-all"
                        value={formData.terms}
                        onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Right Section (Metadata & Totals) */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              
              {/* Quotation Metadata Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5 shadow-sm">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                        <span>Quotation No:</span>
                      </label>
                      <input 
                        type="text" 
                        value={formData.quotationNo} 
                        onChange={(e) => setFormData({...formData, quotationNo: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-black text-gray-700 text-center focus:bg-white focus:border-black outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date:</label>
                      <input 
                          type="date" 
                          value={formData.date} 
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-black text-gray-700 outline-none"
                      />
                   </div>
                </div>
                
                <div className="pt-5 border-t border-dashed border-gray-100 space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[1px]">Valid For:</label>
                            <div className="flex">
                                <input 
                                    type="number" 
                                    value={formData.validFor} 
                                    onChange={(e) => setFormData({...formData, validFor: e.target.value})}
                                    className="w-full border border-gray-100 border-r-0 rounded-l-xl px-2 py-2 text-xs text-center font-black focus:border-gray-300 outline-none"
                                />
                                <span className="px-3 py-2 bg-gray-50 border border-gray-100 border-l-0 rounded-r-xl text-[9px] font-black text-gray-400 flex items-center uppercase">Days</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[1px]">Expiry:</label>
                            <div className="w-full bg-red-50 border border-red-100 rounded-xl px-2 py-2 text-[10px] font-black text-red-500 text-center outline-none">
                                {validityDate}
                            </div>
                        </div>
                   </div>
                </div>
              </div>

              {/* Totals & Summary Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-6 shadow-sm relative overflow-hidden">
                <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-center group">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
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

                <div className="pt-2 relative z-10">
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
                       <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Total Estimate</label>
                       <div className="bg-black p-4 rounded-2xl text-white shadow-xl shadow-gray-200 transform hover:scale-[1.02] transition-transform duration-300">
                           <div className="text-3xl font-black tracking-tight">₹ {totals.roundedTotal.toLocaleString()}</div>
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

                  {/* Items Grid */}
                  <div className="flex-1 overflow-y-auto p-6">
                      {filteredPickerItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                              <Package size={48} className="mb-4 opacity-50" />
                              <p className="text-sm font-bold uppercase tracking-wider">No items found</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredPickerItems.map(item => (
                                  <div 
                                      key={item._id}
                                      onClick={() => selectItemFromPicker(item)}
                                      className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group"
                                  >
                                      <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1 min-w-0 mr-3">
                                              <h4 className="font-black text-sm text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Code: {item.code || 'N/A'}</p>
                                          </div>
                                          <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                              <Package size={20} className="text-indigo-500" />
                                          </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 mb-3">
                                          <div className="bg-gray-50 rounded-lg p-2">
                                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Stock</p>
                                              <p className="text-xs font-black text-gray-700">{item.stock} {item.unit}</p>
                                          </div>
                                          <div className="bg-gray-50 rounded-lg p-2">
                                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">MRP</p>
                                              <p className="text-xs font-black text-gray-700">₹{item.mrp || 0}</p>
                                          </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                          <span className="text-[9px] font-bold text-gray-400 uppercase">Selling Price</span>
                                          <span className="text-base font-black text-indigo-600">₹{item.sellingPrice || 0}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </DashboardLayout>
  );
};

export default AddQuotation;
