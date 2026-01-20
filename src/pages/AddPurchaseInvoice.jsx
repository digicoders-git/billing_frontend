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
  Printer, RotateCcw, Receipt
} from 'lucide-react';
// import { cn } from '../lib/utils';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

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
      { id: 1, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', tax: 0, amount: 0 }
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
  
  // Item Picker State
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickerSearchTerm, setPickerSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [allItems, setAllItems] = useState([]);

  // Fetch Suppliers & Items
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [suppliersRes, itemsRes] = await Promise.all([
                api.get('/parties'),
                api.get('/items')
            ]);
            setSuppliers(suppliersRes.data);
            setAllItems(itemsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'Failed to fetch required data', 'error');
        }
    };
    fetchData();
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
                        gstRate: item.gstRate || 'None',
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
          
          // Calculate amount: ((qty * rate) - discount) + tax
          const qty = parseFloat(updatedItem.qty) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          const discount = parseFloat(updatedItem.discount) || 0;
          
          const baseAmount = qty * rate;
          const discAmount = (baseAmount * discount) / 100;
          const taxableAmount = baseAmount - discAmount;

          // Calculate Tax
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

          const taxAmount = taxableAmount * (taxRate / 100);
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

          const rate = itemData.purchasePrice || 0;
          const qty = newItems[activeItemIndex].qty || 1;
          const taxableAmount = rate * qty;
          const taxAmount = (taxableAmount * gstPercent) / 100;

          newItems[activeItemIndex] = {
              ...newItems[activeItemIndex],
              itemId: itemData._id,
              name: itemData.name,
              code: itemData.code,
              hsn: itemData.hsn || '',
              mrp: itemData.mrp || 0,
              rate: rate,
              discount: 0,
              unit: itemData.unit || 'PCS',
              gstRate: gstStr,
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
      items: [...prev.items, { id: Date.now(), name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, rate: 0, discount: 0, gstRate: 'None', tax: 0, amount: 0 }]
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
    const totalTax = formData.items.reduce((sum, item) => sum + (parseFloat(item.tax) || 0), 0);
    const balance = roundedTotal - (parseFloat(formData.amountPaid) || 0);

    return { subtotal, taxableAmount, discountVal, roundedTotal, roundOffDiff, balance, totalTax };
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
          items: formData.items.map(item => {
              // Parse GST Rate (e.g., "GST @ 18%" -> 18)
              const rateStr = item.gstRate || 'None';
              let gstNum = 0;
              if (rateStr && rateStr.includes('@')) {
                  gstNum = parseFloat(rateStr.split('@')[1]) || 0;
              }

              return {
                  name: item.name,
                  hsn: item.hsn,
                  qty: parseFloat(item.qty) || 0,
                  unit: item.unit,
                  mrp: parseFloat(item.mrp) || 0,
                  rate: parseFloat(item.rate) || 0,
                  discount: parseFloat(item.discount) || 0,
                  gstRate: gstNum,
                  tax: parseFloat(item.tax) || 0,
                  amount: parseFloat(item.amount) || 0
              };
          }),
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
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-[20px] p-6 relative">
                    <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50/50 to-transparent rounded-full -mr-20 -mt-20"></div>
                    </div>
                    
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
              {/* Items Table Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col min-h-[400px]">
                <div className="bg-white rounded-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                   <div>
                       <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Items & Services</h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Manage purchase items and taxes</p>
                   </div>
                   <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-blue-600 uppercase tabular-nums">{formData.items.length} Entries</span>
                   </div>
                </div>
                
                <div className="flex-1 overflow-x-auto min-w-0">
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
                      <tbody className="divide-y divide-gray-100 text-center">
                        {formData.items.map((item, index) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-5 text-center text-sm text-gray-400 font-medium">{index + 1}</td>
                            <td className="px-6 py-5">
                              <div 
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-800 hover:border-indigo-400 focus-within:border-indigo-500 transition-all cursor-pointer flex items-center gap-2 text-left"
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
                </div>
                  
                  {formData.items.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <ShoppingCart size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-500 font-medium">No items added yet</h3>
                        <p className="text-slate-400 text-sm">Start by adding a product row above</p>
                    </div>
                  )}
                
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
                <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-xl shadow-slate-200/50 space-y-8">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[2px]">Payment Summary</h3>
                    
                    <div className="space-y-5">
                        <div className="flex justify-between items-center group">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxable Value</span>
                            <span className="text-sm font-black text-gray-800">₹ {(totals.subtotal - totals.totalTax).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        
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

                        {totals.totalTax > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-100 text-xs">
                             <div className="flex justify-between items-center text-[9px] font-black text-green-600 uppercase tracking-widest">
                                <span>GST (Total)</span>
                                <span>₹{totals.totalTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                             </div>
                          </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <input 
                                  type="checkbox" 
                                  id="autoRoundOff"
                                  checked={formData.autoRoundOff}
                                  onChange={(e) => setFormData({...formData, autoRoundOff: e.target.checked})}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-black focus:ring-black"
                              />
                              <label htmlFor="autoRoundOff" className="text-[9px] font-black text-gray-400 uppercase tracking-widest cursor-pointer select-none">Auto Round Off</label>
                           </div>
                           {formData.autoRoundOff && <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 italic">₹{(totals.roundedTotal - totals.totalWithTaxes - (parseFloat(formData.additionalCharges) || 0) + (formData.overallDiscountType === 'fixed' ? (parseFloat(formData.overallDiscount) || 0) : ((totals.subtotal * (parseFloat(formData.overallDiscount) || 0)) / 100))).toFixed(2)}</span>}
                        </div>

                        <div className="bg-black p-5 rounded-3xl text-white shadow-2xl shadow-black/20 text-center transform hover:scale-[1.02] transition-all duration-300">
                           <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[4px] mb-1">Net Payable</div>
                           <div className="text-3xl font-black tracking-tight italic">₹ {totals.roundedTotal.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between items-center py-2 border-t border-gray-50">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paid Amount</span>
                           <div className="flex items-center gap-1 bg-green-50/50 px-2 py-1 rounded-lg border border-green-100/50 focus-within:border-green-200 transition-all">
                              <span className="text-[10px] font-bold text-green-400 font-mono">₹</span>
                              <input 
                                  type="number" 
                                  className="w-24 text-right bg-transparent border-none outline-none font-black text-xs text-green-700"
                                  value={formData.amountPaid || ''}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                                  placeholder="0"
                              />
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
                <div className="text-left">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Select Purchase Product</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pick an item from your inventory</p>
                </div>
                <button onClick={() => setShowItemPicker(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={20} /></button>
             </div>
             
             <div className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
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
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar divide-y divide-gray-50 text-left">
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
                           <div className="text-sm font-black text-gray-900 italic">Buy: ₹{item.purchasePrice?.toLocaleString()}</div>
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
                       <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-center">
                          <X size={32} className="text-gray-300 mx-auto" />
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

export default AddPurchaseInvoice;
