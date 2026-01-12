import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Save, Plus, Trash2, User, Calendar, 
  Hash, FileText, ArrowLeft, Settings,
  ChevronDown, ScanBarcode
} from 'lucide-react';

const mockParties = [
  { id: 1, name: 'ABC Electronics Ltd', address: '123 Business Park, Mumbai', gstin: '27AABCU9603R1ZX', mobile: '9876543210', placeOfSupply: 'Maharashtra' },
  { id: 2, name: 'XYZ Trading Co', address: '456 Market Street, Delhi', gstin: '07AABCU9603R1ZY', mobile: '9876543211', placeOfSupply: 'Delhi' }
];

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    invoiceNo: '',
    date: '',
    paymentTerms: '30',
    party: null,
    items: [],
    notes: '',
    terms: '',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage',
    autoRoundOff: true,
    amountReceived: 0,
    paymentMethod: 'Cash'
  });

  useEffect(() => {
    // Mock loading existing data
    const existingInvoice = {
      invoiceNo: 'INV-2024-001',
      date: '2024-01-15',
      paymentTerms: '30',
      party: mockParties[0],
      items: [
        { id: 1, name: 'Laptop Computer - Dell Inspiron 15', hsn: '8471', qty: 2, unit: 'PCS', rate: 45000, discount: 5, amount: 85500 },
        { id: 2, name: 'Wireless Mouse - Logitech MX Master', hsn: '8471', qty: 2, unit: 'PCS', rate: 3500, discount: 0, amount: 7000 }
      ],
      notes: 'Thank you for your business!',
      terms: 'Payment due within 30 days',
      additionalCharges: 0,
      overallDiscount: 0,
      overallDiscountType: 'percentage',
      autoRoundOff: true,
      amountReceived: 15000,
      paymentMethod: 'Cash'
    };
    
    // Use a small timeout to avoid the synchronous setState warning if it persists
    const timer = setTimeout(() => {
      setFormData(existingInvoice);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [id]);

  const dueDate = useMemo(() => {
    if (!formData.date) return '';
    const days = parseInt(formData.paymentTerms) || 0;
    const date = new Date(formData.date);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, [formData.paymentTerms, formData.date]);

  const updateItem = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
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
      items: [...prev.items, { id: Date.now(), name: '', hsn: '', qty: 1, unit: 'PCS', rate: 0, discount: 0, amount: 0 }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
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
    const balance = roundedTotal - (parseFloat(formData.amountReceived) || 0);

    return { subtotal, taxableAmount, discountVal, roundedTotal, roundOffDiff, balance };
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/invoices');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Top Sticky Header */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 shrink-0">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-sm sm:text-xl font-semibold text-gray-800 truncate">Edit Invoice</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button 
              onClick={handleSubmit}
              className="px-4 sm:px-6 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-md transition-all"
            >
              Update
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:max-w-[1400px] mx-auto space-y-4">
          <div className="grid grid-cols-12 gap-4">
            
            <div className="col-span-12 lg:col-span-9 space-y-4">
              {/* Party Selection Block */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm relative">
                {formData.party && (
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0"><User size={20} /></div>
                        <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">{formData.party.name}</h2>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">{formData.party.address}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span>GSTIN: <span className="text-gray-700">{formData.party.gstin}</span></span>
                        <span>Mobile: <span className="text-gray-700">{formData.party.mobile}</span></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                       <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">{formData.party.placeOfSupply}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="hidden md:block">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left w-10">No</th>
                        <th className="px-4 py-3 text-left">Items/ Services</th>
                        <th className="px-4 py-3 text-left w-24">HSN</th>
                        <th className="px-4 py-3 text-center w-24">QTY</th>
                        <th className="px-4 py-3 text-right w-32">Rate (₹)</th>
                        <th className="px-4 py-3 text-right w-24">Disc (%)</th>
                        <th className="px-4 py-3 text-right w-32">Amount (₹)</th>
                        <th className="px-4 py-3 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                          <td className="px-4 py-3 text-center text-xs text-gray-400">{index + 1}</td>
                          <td className="px-2 py-3">
                            <input type="text" className="w-full bg-transparent border-none outline-none text-sm font-semibold" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <input type="text" className="w-full bg-transparent border-none outline-none text-xs text-center text-gray-500" value={item.hsn} onChange={(e) => updateItem(item.id, 'hsn', e.target.value)} />
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center justify-center gap-1 border border-gray-100 rounded bg-gray-50/50 p-1">
                              <input type="number" className="w-12 bg-transparent border-none outline-none text-center text-xs font-bold" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} />
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-right">
                             <input type="number" className="w-full bg-transparent border-none outline-none text-right text-sm font-bold" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                          </td>
                          <td className="px-2 py-3 text-right">
                             <input type="number" className="w-full bg-transparent border-none outline-none text-right text-xs text-gray-400" value={item.discount} onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} />
                          </td>
                          <td className="px-4 py-3 text-right font-black text-gray-900">₹ {item.amount.toLocaleString()}</td>
                          <td className="px-2 py-3 text-center">
                             <Trash2 size={16} className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors" onClick={() => removeItem(item.id)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                        <span>Item #{index + 1}</span>
                        <button onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 size={16} /></button>
                      </div>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Qty / Unit</label>
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
                            <input type="number" className="w-full bg-transparent border-none outline-none text-xs font-bold" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} />
                            <span className="text-[9px] text-gray-400">{item.unit}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Rate</label>
                          <input type="number" className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold text-gray-500">Amount:</span>
                        <span className="text-sm font-black text-gray-900">₹ {item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 flex justify-between items-center bg-gray-50/30 border-t border-gray-100">
                  <button onClick={addItem} className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
                    <Plus size={18} /> Add New Row
                  </button>
                  <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer shadow-sm bg-white text-gray-600">
                    <ScanBarcode size={20} />
                    <span className="text-xs font-bold">Barcode</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Notes</label>
                    <textarea 
                      className="w-full h-20 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-blue-100 p-3 text-xs resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Terms & Conditions</label>
                  <textarea 
                    className="w-full h-20 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-blue-100 p-3 text-xs resize-none"
                    value={formData.terms}
                    onChange={(e) => setFormData({...formData, terms: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-3 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Invoice No</label>
                      <input type="text" value={formData.invoiceNo} onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})} className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-xs text-center font-bold" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase lg:text-left text-right w-full block">Date</label>
                      <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-blue-50/30 border border-blue-400 rounded px-2 py-1.5 text-xs font-bold text-blue-800" />
                   </div>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Due Date</label>
                      <div className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs font-bold text-gray-500 bg-gray-50/50 text-center">{dueDate}</div>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
                    <span>Subtotal</span>
                    <span className="text-gray-700">₹ {totals.subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                   <div className="flex justify-between items-center gap-2 bg-gray-800 p-3 rounded-xl text-white shadow-lg overflow-hidden relative">
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="text-[10px] font-black uppercase opacity-60 tracking-[2px]">Total Amount</div>
                        <div className="text-lg sm:text-2xl font-black truncate">₹ {totals.roundedTotal.toLocaleString()}</div>
                      </div>
                   </div>

                   <div className="pt-6 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Amount Received</label>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                           <span className="text-gray-400 font-bold shrink-0">₹</span>
                           <input type="number" className="bg-transparent border-none outline-none flex-1 font-black text-gray-800 text-sm min-w-0" value={formData.amountReceived} onChange={(e) => setFormData({...formData, amountReceived: parseFloat(e.target.value) || 0})} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-2 border-t border-dashed border-gray-100">
                         <span className="text-[10px] font-black uppercase text-blue-600 shrink-0">Balance</span>
                         <span className="text-base sm:text-lg font-black text-blue-600 italic">₹ {totals.balance.toLocaleString()}</span>
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

export default EditInvoice;