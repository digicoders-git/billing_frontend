import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { 
  Plus, Trash2, User, Calendar, 
  Hash, FileText, Settings, Keyboard, 
  ArrowLeft, Search, ScanBarcode, X,
  ChevronDown, ShoppingCart, Truck,
  Printer, RotateCcw
} from 'lucide-react';

const AddPurchaseInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [suppliers, setSuppliers] = useState([]);
  
  const INITIAL_FORM_STATE = {
    billNo: 'PUR/749',
    date: new Date().toISOString().split('T')[0],
    paymentTerms: '15',
    supplier: null,
    items: [
      { id: 1, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, tax: 0, amount: 0 }
    ],
    notes: '',
    terms: '1. Material received in good condition.\n2. Payment will be released as per terms mentioned.',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage', // 'fixed' or 'percentage'
    autoRoundOff: true,
    amountPaid: 0,
    paymentMethod: 'Bank Transfer'
  };

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/parties');
            setSuppliers(res.data);
        } catch (error) {
            console.error("Failed to fetch suppliers", error);
        }
    };
    fetchSuppliers();
  }, []);

  // Fetch Purchase Data if in Edit Mode
  useEffect(() => {
    if (isEditMode) {
        const fetchPurchase = async () => {
            try {
                const res = await api.get(`/purchases/${id}`);
                const data = res.data;
                setFormData({
                    billNo: data.billNo || data.invoiceNo,
                    date: new Date(data.date).toISOString().split('T')[0],
                    paymentTerms: '15', // You might want to save this in backend too if needed
                    supplier: data.party, // Assuming populated
                    items: data.items.map((item, index) => ({
                        ...item,
                        id: item._id || Date.now() + index,
                        qty: item.qty,
                        rate: item.rate,
                        discount: item.discount,
                        tax: item.tax,
                        amount: item.amount
                    })),
                    notes: data.notes || '',
                    terms: '1. Material received in good condition.\n2. Payment will be released as per terms mentioned.',
                    additionalCharges: data.additionalCharges || 0,
                    overallDiscount: data.overallDiscount || 0,
                    overallDiscountType: 'fixed', // Since backend stores value, we default to fixed for simplicity or infer
                    autoRoundOff: true,
                    amountPaid: data.amountPaid || 0,
                    paymentMethod: data.paymentMethod || 'Bank Transfer'
                });
            } catch (error) {
                console.error("Failed to fetch purchase for edit", error);
                Swal.fire('Error', 'Failed to load invoice details', 'error');
                navigate('/purchases/invoices');
            }
        };
        fetchPurchase();
    }
  }, [id, isEditMode, navigate]);


  // Due Date Calculation
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
          // Calculate amount: (qty * rate) - discount
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
      items: [...prev.items, { id: Date.now(), name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, tax: 0, amount: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will clear all entered data!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reset it!'
    });

    if (result.isConfirmed) {
      setFormData(INITIAL_FORM_STATE);
      setSearchSupplier('');
      Swal.fire({
        title: 'Reset!',
        text: 'The form has been cleared.',
        icon: 'success',
        timer: 1500
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Grand Totals Calculation
  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const charges = parseFloat(formData.additionalCharges) || 0;
    const taxableAmount = subtotal + charges;
    
    let discountVal = 0;
    const overallDiscount = parseFloat(formData.overallDiscount) || 0;
    
    if (formData.overallDiscountType === 'percentage') {
      discountVal = (taxableAmount * overallDiscount) / 100;
    } else {
      discountVal = overallDiscount;
    }

    const totalBeforeRound = taxableAmount - discountVal;
    const roundedTotal = formData.autoRoundOff ? Math.round(totalBeforeRound) : totalBeforeRound;
    const roundOffDiff = (roundedTotal - totalBeforeRound).toFixed(2);
    const balance = roundedTotal - (parseFloat(formData.amountPaid) || 0);

    return { subtotal, taxableAmount, discountVal, roundedTotal, roundOffDiff, balance };
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier) {
        Swal.fire({
            icon: 'warning',
            title: 'Supplier Missing',
            text: 'Please select a supplier first!',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    try {
        const payload = {
            invoiceNo: formData.billNo, // Using billNo as invoiceNo
            billNo: formData.billNo,
            date: formData.date,
            party: formData.supplier._id,
            partyName: formData.supplier.name,
            items: formData.items.map(item => ({
                name: item.name,
                hsn: item.hsn,
                qty: parseFloat(item.qty) || 0,
                unit: item.unit,
                rate: parseFloat(item.rate) || 0,
                discount: parseFloat(item.discount) || 0,
                tax: parseFloat(item.tax) || 0,
                amount: parseFloat(item.amount) || 0
            })),
            subtotal: totals.subtotal,
            additionalCharges: parseFloat(formData.additionalCharges) || 0,
            overallDiscount: totals.discountVal,
            totalAmount: totals.roundedTotal,
            amountPaid: parseFloat(formData.amountPaid) || 0,
            balanceAmount: totals.balance,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes
        };

        if (isEditMode) {
            await api.put(`/purchases/${id}`, payload);
            await Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Purchase Invoice Updated Successfully!',
                confirmButtonColor: '#10b981',
                timer: 2000
            });
        } else {
            await api.post('/purchases', payload);
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Purchase Invoice Recorded Successfully!',
                confirmButtonColor: '#10b981',
                timer: 2000
            });
        }
        
        navigate('/purchases/invoices');
    } catch (error) {
        console.error("Failed to save purchase", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to save purchase. Please check your connection.',
            confirmButtonColor: '#ef4444'
        });
    }
  };

  return (
    <DashboardLayout>
      <div className="pb-20 font-sans">
        {/* Simple Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate(-1)} 
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEditMode ? 'Edit Purchase' : 'Record Purchase'}</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{isEditMode ? 'Updating Invoice' : 'New Stock Entry'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                <Calendar size={14} className="text-gray-400" />
                {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            
            <button 
              onClick={handleReset}
              className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-red-500 transition-all shadow-sm hover:border-red-100 active:scale-95 tooltip"
              title="Reset Form"
            >
              <RotateCcw size={20} />
            </button>
            
            <button 
              onClick={handlePrint}
              className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-indigo-500 transition-all shadow-sm hover:border-indigo-100 active:scale-95 tooltip"
              title="Print Invoice"
            >
              <Printer size={20} />
            </button>

            <button 
              onClick={handleSubmit}
              className="group relative px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-0.5 transition-all active:scale-95 overflow-hidden flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative">{isEditMode ? 'Update Invoice' : 'Save Invoice'}</span>
              <ArrowLeft size={16} className="rotate-180 relative" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Section: Main Form */}
            <div className="col-span-12 xl:col-span-9 space-y-6">
              
              {/* Supplier Selection Card */}
              <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-[20px] p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50/50 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                    
                    {!formData.supplier ? (
                    <div className="relative max-w-2xl mx-auto py-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <Truck size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Select Supplier</h2>
                        <p className="text-slate-500 -mt-2">Search for a vendor to start recording your purchase items.</p>
                        
                        <div className="relative group max-w-md mx-auto">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Search size={20} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Type supplier name..." 
                                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-base font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm group-hover:border-indigo-300"
                                value={searchSupplier}
                                onChange={(e) => {
                                    setSearchSupplier(e.target.value);
                                    setShowSupplierDropdown(true);
                                }}
                                onFocus={() => setShowSupplierDropdown(true)}
                            />
                            {showSupplierDropdown && searchSupplier && (
                            <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl mt-2 z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                {suppliers.filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase())).map(supplier => (
                                <div 
                                    key={supplier._id} 
                                    className="px-5 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group/item"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, supplier }));
                                      setShowSupplierDropdown(false);
                                      setSearchSupplier('');
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{supplier.name[0]}</div>
                                        <div>
                                            <div className="font-bold text-slate-700">{supplier.name}</div>
                                            <div className="text-xs text-slate-400">{supplier.address || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <Plus size={16} className="text-indigo-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </div>
                                ))}
                            </div>
                            )}
                        </div>
                    </div>
                    ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                                <span className="text-2xl font-black text-slate-800">{formData.supplier.name[0]}</span>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 block">Selected Vendor</label>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{formData.supplier.name}</h2>
                                <p className="text-sm font-medium text-slate-500 max-w-lg">{formData.supplier.address}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="px-3 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600 border border-slate-200 uppercase tracking-wider">
                                        GST: {formData.supplier.gstin || 'N/A'}
                                    </div>
                                    <div className="px-3 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600 border border-slate-200 uppercase tracking-wider">
                                        {formData.supplier.placeOfSupply}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setFormData(prev => ({ ...prev, supplier: null }))} 
                            className="bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-100 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                        >
                            Change Vendor
                        </button>
                    </div>
                    )}
                </div>
              </div>

              {/* Items Table Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <h3 className="font-bold text-lg text-slate-800">Items & Breakdown</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>{formData.items.length} Entries</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-16 text-center">No.</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[300px]">Item Details</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-32 text-center">HSN</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-32 text-center">Qty</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-40 text-right">Rate</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-40 text-right">Amount</th>
                        <th className="py-4 px-6 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-indigo-50/30 transition-colors">
                          <td className="py-4 px-6 text-center text-sm font-bold text-slate-400">{index + 1}</td>
                          <td className="py-4 px-6">
                            <input 
                              type="text" 
                              className="w-full bg-transparent border-none p-0 text-slate-800 font-bold placeholder:text-slate-300 focus:ring-0"
                              placeholder="Enter item name..."
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-6">
                            <input 
                              type="text" 
                              className="w-full bg-slate-50 rounded-lg border-transparent text-center text-sm font-semibold text-slate-600 focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                              placeholder="HSN"
                              value={item.hsn}
                              onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-transparent group-hover:border-slate-200 transition-all">
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent border-none text-center font-bold text-slate-700 p-0 focus:ring-0"
                                    value={item.qty}
                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase pr-2">{item.unit}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <input 
                              type="number" 
                              className="w-full text-right bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-slate-800">
                             ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 text-center">
                             <button 
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                             >
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={addItem}
                        className="flex items-center gap-2 text-indigo-600 text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                    >
                        <Plus size={18} /> Add Breakdown Row
                    </button>
                </div>
              </div>

              {/* Remarks & Terms */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Internal Notes</label>
                    <textarea 
                        className="w-full h-32 bg-slate-50 rounded-2xl border-none p-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/10 resize-none"
                        placeholder="Add private notes for this purchase..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Terms & Conditions</label>
                    <textarea 
                        className="w-full h-32 bg-slate-50 rounded-2xl border-none p-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/10 resize-none leading-relaxed"
                        value={formData.terms}
                        onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Right Section: Totals & Meta */}
            <div className="col-span-12 xl:col-span-3 space-y-6">
                
                {/* Invoice Meta */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800">Invoice Details</h3>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Bill Number</label>
                            <div className="flex items-center gap-2 text-slate-800">
                                <Hash size={16} className="text-slate-400" />
                                <input 
                                    type="text" 
                                    value={formData.billNo}
                                    onChange={(e) => setFormData({...formData, billNo: e.target.value})}
                                    className="bg-transparent border-none p-0 w-full font-bold focus:ring-0 uppercase placeholder:normal-case"
                                    placeholder="INV-001"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group focus-within:border-indigo-300 transition-all">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Date</label>
                            <input 
                                type="date" 
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full bg-transparent border-none p-0 font-bold text-slate-800 focus:ring-0 cursor-pointer"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-50 p-3 rounded-2xl text-center">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Terms (Days)</label>
                                <input 
                                    type="number" 
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                                    className="w-full bg-transparent text-center font-bold border-none p-0 focus:ring-0"
                                />
                            </div>
                            <div className="flex-1 bg-blue-50 p-3 rounded-2xl text-center">
                                <label className="text-[10px] font-bold text-blue-400 uppercase">Due Date</label>
                                <div className="font-bold text-blue-700 text-sm mt-1">{dueDate}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calculation Card */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl shadow-slate-200/50 space-y-6">
                    <h3 className="font-bold text-slate-800">Payment Summary</h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Subtotal</span>
                            <span className="font-bold text-slate-800">₹{totals.subtotal.toLocaleString()}</span>
                        </div>
                         
                         <div className="flex justify-between items-center text-sm group">
                            <span className="text-slate-500 font-medium group-hover:text-indigo-600 transition-colors cursor-pointer border-b border-dashed border-slate-300">Add. Charges</span>
                            <div className="w-24 bg-slate-50 rounded-lg px-2 flex items-center">
                                <span className="text-slate-400 text-xs mr-1">+</span>
                                <input 
                                    type="number"
                                    className="w-full bg-transparent text-right font-bold text-slate-700 border-none p-1 text-sm focus:ring-0"
                                    value={formData.additionalCharges}
                                    onChange={e => setFormData({...formData, additionalCharges: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm group">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-medium group-hover:text-indigo-600 transition-colors cursor-pointer border-b border-dashed border-slate-300">Discount</span>
                                <select 
                                    className="bg-indigo-50 text-indigo-700 text-xs font-bold rounded px-1 py-0.5 border-none outline-none cursor-pointer"
                                    value={formData.overallDiscountType}
                                    onChange={e => setFormData({...formData, overallDiscountType: e.target.value})}
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">₹</option>
                                </select>
                            </div>
                            <div className="w-24 bg-slate-50 rounded-lg px-2 flex items-center">
                                <span className="text-slate-400 text-xs mr-1">-</span>
                                <input 
                                    type="number"
                                    className="w-full bg-transparent text-right font-bold text-red-500 border-none p-1 text-sm focus:ring-0"
                                    value={formData.overallDiscount}
                                    onChange={e => setFormData({...formData, overallDiscount: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-slate-500">Grand Total</span>
                            <span className="text-3xl font-black text-slate-800 tracking-tight">
                                <span className="text-lg text-slate-400 font-medium align-top mr-1">₹</span>
                                {totals.roundedTotal.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-end gap-2 mb-6">
                            <input 
                                type="checkbox" 
                                id="roundOff"
                                checked={formData.autoRoundOff} 
                                onChange={e => setFormData({...formData, autoRoundOff: e.target.checked})} 
                                className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <label htmlFor="roundOff" className="text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none">Auto Round Off ({totals.roundOffDiff})</label>
                        </div>
                        
                        <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4 shadow-lg shadow-slate-900/10">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span>Amount Paid</span>
                                    <span>{formData.paymentMethod}</span>
                                </div>
                                <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                                    <span className="text-slate-500 font-medium">₹</span>
                                    <input 
                                        type="number" 
                                        className="w-full bg-transparent border-none p-0 text-xl font-bold text-white placeholder:text-slate-700 focus:ring-0"
                                        placeholder="0.00"
                                        value={formData.amountPaid}
                                        onChange={e => setFormData({...formData, amountPaid: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-300">Balance Due</span>
                                <span className="text-lg font-bold text-indigo-400">₹ {totals.balance.toLocaleString()}</span>
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

export default AddPurchaseInvoice;
