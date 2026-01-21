import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Plus, Trash2, Calendar, 
  Hash, FileText, Settings, 
  ArrowLeft, Search, X,
  Truck, Save, ScanBarcode,
  ChevronDown, Calculator, User,
  FileSearch, CheckCircle2, Receipt
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const gstOptions = [
    "None", "Exempted", "GST @ 0%", "GST @ 0.1%", "GST @ 0.25%", "GST @ 1.5%",
    "GST @ 3%", "GST @ 5%", "GST @ 6%", "GST @ 8.9%", "GST @ 12%", "GST @ 13.8%",
    "GST @ 18%", "GST @ 14% + cess @ 12%", "GST @ 28%", "GST @ 28% + Cess @ 5%",
    "GST @ 40%", "GST @ 28% + Cess @ 36%", "GST @ 28% + Cess @ 60%"
];

const AddDebitNote = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    returnNo: '',
    date: new Date().toISOString().split('T')[0],
    originalInvoiceNo: '',
    party: null,
    items: [
      { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, gst: 0, rate: 0, amount: 0 }
    ],
    notes: '',
    terms: '1. This Debit Note is issued against over-billing / item returns.\n2. Adjustments will reflect in the next payment cycle.',
    additionalCharges: 0,
    overallDiscount: 0,
    overallDiscountType: 'percentage', // 'percentage' or 'fixed'
    autoRoundOff: true,
    type: 'Debit Note'
  });

  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [searchParty, setSearchParty] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Item Picker State
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickerSearchTerm, setPickerSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesRes, itemsRes, nextNoRes, purchasesRes] = await Promise.all([
          api.get('/parties'),
          api.get('/items'),
          api.get('/returns/next-receipt?type=Debit Note'),
          api.get('/purchases')
        ]);
        
        setParties(partiesRes.data || []);
        setItems(itemsRes.data || []);
        setPurchases(purchasesRes.data || []);
        
        if (!isEdit) {
          setFormData(prev => ({ 
            ...prev, 
            returnNo: `DN-${nextNoRes.data.nextNo.padStart(3, '0')}` 
          }));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    const fetchEditData = async () => {
      if (!isEdit) return;
      setLoading(true);
      try {
        const response = await api.get(`/returns/${id}`);
        const data = response.data;
        setFormData({
          ...data,
          party: data.party,
          items: data.items.map(it => ({ ...it, id: it._id || Date.now() + Math.random() })),
          date: new Date(data.date).toISOString().split('T')[0],
          overallDiscountType: data.overallDiscountType || 'fixed'
        });
      } catch (error) {
        console.error("Error fetching debit note:", error);
        Swal.fire('Error', 'Failed to load debit note', 'error');
        navigate('/purchases/debit-notes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    if (isEdit) fetchEditData();
  }, [id, isEdit, navigate]);

  const updateItem = (itemId, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === itemId || item._id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'qty' || field === 'rate' || field === 'gstRate' || field === 'mrp') {
             const qty = parseFloat(updatedItem.qty) || 0;
             const rate = parseFloat(updatedItem.rate) || 0;
             
             let gst = 0;
             const gstStr = updatedItem.gstRate || 'None';
             if (gstStr && gstStr.includes('@')) {
                 gst = parseFloat(gstStr.split('@')[1]) || 0;
             } else if (gstStr && gstStr.includes('%')) {
                  gst = parseFloat(gstStr.replace('%', '')) || 0;
             }
             updatedItem.gst = gst;

             const baseAmount = qty * rate;
             const taxAmount = baseAmount * (gst / 100);
             updatedItem.amount = baseAmount + taxAmount;
          }

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
      const index = activeItemIndex;
      
      const rate = itemData.purchasePrice || itemData.sellingPrice || 0;
      const gstStr = itemData.gstRate || 'None'; 
      let gst = 0;
      if(gstStr && gstStr.includes('@')) {
          gst = parseFloat(gstStr.split('@')[1]) || 0;
      }
      
      const qty = newItems[index].qty || 1;
      const baseAmount = rate * qty;
      const taxAmount = baseAmount * (gst / 100);

      newItems[index] = {
        ...newItems[index],
        itemId: itemData._id,
        name: itemData.name,
        hsn: itemData.hsn || '',
        mrp: itemData.mrp || 0,
        gst: gst,
        gstRate: gstStr,
        rate: rate,
        unit: itemData.unit || 'PCS',
        amount: baseAmount + taxAmount
      };

       // Auto-add new row if selecting for the last row
       if (index === newItems.length - 1) {
         newItems.push({ id: Date.now() + 1, itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, gst: 0, gstRate: 'None', rate: 0, amount: 0 });
       }

      return { ...prev, items: newItems };
    });
    setShowItemPicker(false);
    setPickerSearchTerm('');
    setActiveItemIndex(null);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, gst: 0, gstRate: 'None', rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (itemId) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ 
        ...prev, 
        items: prev.items.filter(item => (item.id !== itemId && item._id !== itemId)) 
      }));
    }
  };

  const selectPurchaseInvoice = (inv) => {
      setFormData(prev => ({
          ...prev,
          originalInvoiceNo: inv.purchaseNo || inv.invoiceNo,
          items: inv.items.map(it => {
              let gst = 0;
              if (it.gstRate && typeof it.gstRate === 'string') {
                  if (it.gstRate.includes('@')) gst = parseFloat(it.gstRate.split('@')[1]) || 0;
                  else if (it.gstRate.includes('%')) gst = parseFloat(it.gstRate.replace('%','')) || 0;
              }
              return {
                  ...it,
                  id: Date.now() + Math.random(),
                  itemId: it.itemId?._id || it.itemId,
                  mrp: it.mrp || 0,
                  gst: gst
              };
          }).concat([{ id: Date.now() + 1, itemId: null, name: '', hsn: '', qty: 1, unit: 'PCS', mrp: 0, gst: 0, rate: 0, amount: 0 }])
      }));
      setShowInvoicePicker(false);
      Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Linked to Bill #${inv.purchaseNo || inv.invoiceNo}`,
          showConfirmButton: false,
          timer: 1500
      });
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

    return { subtotal, taxableAmount, roundedTotal, roundOffDiff, discountVal };
  }, [formData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.party) {
        Swal.fire({
            icon: 'error',
            title: 'Required',
            text: 'Please select a vendor account.',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    const validItems = formData.items.filter(it => it.name.trim() !== '' && it.amount > 0);
    if (validItems.length === 0) {
        Swal.fire('Warning', 'Please add at least one valid item registry.', 'warning');
        return;
    }
    
    setLoading(true);
    try {
        const payload = {
            ...formData,
            party: formData.party._id || formData.party.id,
            partyName: formData.party.name,
            items: validItems.map(item => ({
                itemId: item.itemId,
                name: item.name,
                hsn: item.hsn || '',
                qty: parseFloat(item.qty) || 0,
                unit: item.unit || 'PCS',
                rate: parseFloat(item.rate) || 0,
                amount: parseFloat(item.amount) || 0
            })),
            totalAmount: totals.roundedTotal,
            subtotal: totals.subtotal,
            discountAmount: totals.discountVal,
            roundOffDiff: totals.roundOffDiff,
            type: 'Debit Note'
        };

        if (isEdit) {
            await api.put(`/returns/${id}`, payload);
            Swal.fire({
              icon: 'success',
              title: 'Record Updated',
              text: 'Debit Note has been successfully updated.',
              timer: 2000,
              showConfirmButton: false
            });
        } else {
            await api.post('/returns', payload);
            Swal.fire({
              icon: 'success',
              title: 'Entry Recorded',
              text: 'Debit Note has been saved successfully.',
              timer: 2000,
              showConfirmButton: false
            });
        }
        navigate('/purchases/debit-notes');
    } catch (error) {
        console.error("Submission error:", error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to save record', 'error');
    } finally {
        setLoading(false);
    }
  };

  const filteredPurchases = useMemo(() => {
      if (!formData.party) return [];
      return purchases.filter(p => (p.party?._id || p.party) === (formData.party._id || formData.party.id));
  }, [purchases, formData.party]);

  if (loading && isEdit) {
    return (
        <DashboardLayout>
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Syncing Engine...</p>
                </div>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/30 pb-24">
        {/* Header Section */}
        <div className="max-w-[1600px] mx-auto px-6 py-8 no-print">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="group flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-gray-400 hover:text-indigo-600"
                    >
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic underline decoration-indigo-500/20 underline-offset-8 decoration-4">
                                {isEdit ? 'Edit' : 'Issue'} Debit Note
                            </h1>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${isEdit ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                {isEdit ? 'Registry Update' : 'New Audit Entry'}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mt-4">
                            Supply Return Ledger & Financial Adjustment Audit Registry
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 md:flex-none px-10 py-4 bg-gray-900 text-white rounded-[22px] text-[11px] font-black shadow-2xl shadow-gray-200 hover:bg-indigo-600 hover:-translate-y-1 transition-all uppercase tracking-[2px] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isEdit ? 'Sync Update' : 'Save Registry'}</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-12 gap-8">
            
            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              
              {/* Vendor Selection */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                        <Truck size={18} className="text-gray-400" />
                        <span>Vendor Account Selection</span>
                    </div>
                    {formData.party && (
                         <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active Vendor</span>
                         </div>
                    )}
                </div>

                {!formData.party ? (
                  <button 
                    onClick={() => setShowPartyDropdown(true)}
                    className="w-full flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-black hover:bg-gray-50 transition-all group"
                  >
                     <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-black mb-4 transition-colors">
                        <User size={24} />
                     </div>
                     <span className="text-sm font-bold text-gray-900">Select Vendor Account</span>
                     <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Link adjustment to supplier ledger</p>
                  </button>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-gray-200">
                            <Truck size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">{formData.party.name}</h2>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">GST: {formData.party.gstin || 'UNREGISTERED'}</span>
                                <span className="w-1 border-r border-gray-200 h-3" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">ID: {formData.party.id || formData.party._id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="text-right mr-4 hidden md:block">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Ledger Bal</p>
                            <p className="text-lg font-black text-gray-900 italic">₹ {(formData.party.balance || 0).toLocaleString()}</p>
                         </div>
                        <button 
                            onClick={() => setFormData(prev => ({ ...prev, party: null }))}
                            className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-[2px] text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                        >
                            Change Vendor
                        </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                        <ScanBarcode size={18} className="text-gray-400" />
                        <span className="uppercase tracking-widest text-xs">Adjustment Registry</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Items: {formData.items.filter(i => i.name).length}</span>
                        <div className="w-px h-4 bg-gray-200" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-[2px]">Value: ₹ {totals.subtotal.toLocaleString()}</span>
                    </div>
                </div>
                
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto min-w-0">
                    <table className="w-full border-collapse min-w-[1400px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-5 text-left w-16">NO</th>
                        <th className="px-6 py-5 text-left min-w-[300px]">ITEMS/ SERVICES</th>
                        <th className="px-6 py-5 text-left w-24">HSN</th>
                        <th className="px-6 py-5 text-center w-28">QTY</th>
                        <th className="px-6 py-5 text-right w-32">MRP</th>
                        <th className="px-6 py-5 text-center w-24">GST %</th>
                        <th className="px-6 py-5 text-right w-36">PRICE (₹)</th>
                        <th className="px-6 py-5 text-right w-44">AMOUNT (₹)</th>
                        <th className="px-6 py-5 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {formData.items.map((item, index) => (
                        <tr key={item.id || item._id} className="hover:bg-gray-50 transition-colors group">
                           <td className="px-6 py-5 text-center text-sm text-gray-400 font-medium">{index + 1}</td>
                           <td className="px-6 py-5">
                             <div 
                               className="relative w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-800 hover:border-indigo-400 focus-within:border-indigo-500 transition-all cursor-pointer flex items-center gap-2"
                               onClick={() => {
                                 setActiveItemIndex(index);
                                 setShowItemPicker(true);
                               }}
                             >
                               {item.name ? (
                                   <div className="flex flex-col flex-1 truncate">
                                       <span className="font-bold text-gray-900 truncate uppercase tracking-tight">{item.name}</span>
                                       {item.hsn && <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">HSN: {item.hsn}</span>}
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
                               value={item.hsn || ''}
                               onChange={(e) => updateItem(item.id || item._id, 'hsn', e.target.value)}
                             />
                           </td>
                           <td className="px-4 py-5">
                             <div className="flex items-center justify-center gap-1.5">
                               <input 
                                 type="number" 
                                 className="w-14 bg-transparent border-b border-gray-200 px-1 py-1.5 text-center text-sm font-black text-indigo-600 focus:border-indigo-500 outline-none"
                                 value={item.qty}
                                 onFocus={(e) => e.target.select()}
                                 onChange={(e) => updateItem(item.id || item._id, 'qty', parseFloat(e.target.value) || 0)}
                               />
                               <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{item.unit || 'PCS'}</span>
                             </div>
                           </td>
                           <td className="px-4 py-5 text-right">
                              <input 
                               type="number" 
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-medium text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                               value={item.mrp || 0}
                               onFocus={(e) => e.target.select()}
                               onChange={(e) => updateItem(item.id || item._id, 'mrp', parseFloat(e.target.value) || 0)}
                             />
                           </td>
                           <td className="px-4 py-5 text-center">
                              <select
                                value={item.gstRate || 'None'}
                                onChange={(e) => updateItem(item.id || item._id, 'gstRate', e.target.value)}
                                className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-[10px] font-black text-gray-600 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all cursor-pointer uppercase"
                              >
                                {gstOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                           </td>
                           <td className="px-4 py-5 text-right">
                              <input 
                               type="number" 
                               className="w-full bg-transparent border-b border-gray-200 px-2 py-1.5 text-sm text-right font-black text-gray-800 hover:border-gray-300 focus:border-indigo-500 outline-none transition-all"
                               value={item.rate || 0}
                               onFocus={(e) => e.target.select()}
                               onChange={(e) => updateItem(item.id || item._id, 'rate', parseFloat(e.target.value) || 0)}
                             />
                           </td>
                           <td className="px-6 py-5 text-right font-black text-indigo-600 text-sm italic">
                             ₹ {(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </td>
                           <td className="px-4 py-5 text-center">
                              <Trash2 
                                size={16} 
                                className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 mx-auto"
                                onClick={() => removeItem(item.id || item._id)}
                              />
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                  {/* Mobile View - Recreated Premium Segmented Cards */}
                <div className="md:hidden space-y-6">
                  {formData.items.map((item, index) => (
                    <div key={item.id || item._id} className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500 fill-mode-backwards" style={{ animationDelay: `${index * 100}ms` }}>
                        
                        {/* Card Header */}
                        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Details</span>
                             </div>
                             {index > 0 && (
                                <button onClick={() => removeItem(item.id || item._id)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-red-500 shadow-sm active:scale-90 transition-all">
                                    <Trash2 size={14} />
                                </button>
                             )}
                        </div>
                        
                        <div className="p-5 space-y-5">
                            {/* Block 1: Item Selection */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Product Description</label>
                                <div 
                                    className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between active:bg-gray-100 transition-colors"
                                    onClick={() => {
                                        setActiveItemIndex(index);
                                        setShowItemPicker(true);
                                    }}
                                >
                                    <span className={`text-sm font-bold truncate pr-4 ${item.name ? "text-gray-900 uppercase" : "text-gray-400 italic"}`}>
                                        {item.name || 'Tap to search item...'}
                                    </span>
                                    <Search size={16} className="text-gray-400 shrink-0" />
                                </div>
                            </div>

                            {/* Block 2: HSN & Quantity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">HSN Code</label>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 text-center uppercase placeholder:text-gray-300 focus:ring-0" 
                                            placeholder="XXXX" 
                                            value={item.hsn || ''} 
                                            onChange={(e) => updateItem(item.id || item._id, 'hsn', e.target.value)} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest ml-1">Quantity</label>
                                    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-3 flex items-center justify-center gap-1">
                                        <input 
                                            type="number" 
                                            className="w-full bg-transparent border-none p-0 text-lg font-black text-indigo-700 text-center placeholder:text-indigo-200 focus:ring-0" 
                                            placeholder="0" 
                                            value={item.qty} 
                                            onChange={(e) => updateItem(item.id || item._id, 'qty', parseFloat(e.target.value) || 0)} 
                                        />
                                        <span className="text-[9px] font-bold text-indigo-400 uppercase">{item.unit || 'PCS'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-dashed border-gray-200"></div>

                            {/* Block 3: MRP & GST */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">MRP</label>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 flex items-center justify-center gap-1">
                                        <span className="text-gray-400 text-xs font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 text-center placeholder:text-gray-300 focus:ring-0" 
                                            placeholder="0" 
                                            value={item.mrp || 0} 
                                            onChange={(e) => updateItem(item.id || item._id, 'mrp', parseFloat(e.target.value) || 0)} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">GST Rate</label>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 relative">
                                        <select 
                                            value={item.gstRate || 'None'} 
                                            onChange={(e) => updateItem(item.id || item._id, 'gstRate', e.target.value)} 
                                            className="w-full bg-transparent border-none p-0 text-xs font-bold text-gray-900 text-center appearance-none focus:ring-0"
                                        >
                                            {gstOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Block 4: Rate (Price) */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Unit Rate (Price)</label>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-center gap-1">
                                    <span className="text-gray-400 text-sm font-bold">₹</span>
                                    <input 
                                        type="number" 
                                        className="w-full bg-transparent border-none p-0 text-base font-bold text-gray-900 text-center placeholder:text-gray-300 focus:ring-0" 
                                        placeholder="0" 
                                        value={item.rate || 0} 
                                        onChange={(e) => updateItem(item.id || item._id, 'rate', parseFloat(e.target.value) || 0)} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card Footer: Amount */}
                        <div className="bg-gray-900 px-5 py-4 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Row Total</span>
                            <span className="text-xl font-black text-white tracking-tight">₹ {(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                    <span className="text-sm font-black text-gray-500 group-hover:text-indigo-600 uppercase tracking-widest">Add Adjustment Row</span>
                  </div>
                </div>
              </div>

              {/* Remarks/Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-900 font-black text-[10px] uppercase tracking-[4px]">
                    <FileText size={18} className="text-indigo-400" />
                    <label>Internal Audit Narrative</label>
                  </div>
                  <textarea 
                    className="w-full h-32 bg-gray-50 rounded-2xl border-none p-6 text-sm font-bold text-gray-700 resize-none outline-none focus:bg-white border border-transparent focus:border-black transition-all italic leading-relaxed placeholder:uppercase placeholder:tracking-[2px] placeholder:text-gray-300"
                    placeholder="ENTER TRANSACTION REASON / AUDIT NOTES..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-5 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-900 font-black text-[10px] uppercase tracking-[4px]">
                        <Settings size={18} className="text-gray-400" />
                        <label>Voucher Declarations</label>
                    </div>
                    <textarea 
                        className="w-full h-32 bg-gray-50 rounded-2xl border-none p-6 text-[11px] font-black text-gray-400 leading-[2.2] resize-none outline-none focus:bg-white border border-transparent focus:border-black transition-all uppercase tracking-[1px]"
                        value={formData.terms || ''}
                        onChange={(e) => setFormData({...formData, terms: e.target.value})}
                    />
                </div>
              </div>
            </div>

            {/* Side Meta Pane Component */}
            <div className="col-span-12 lg:col-span-3 space-y-8">
                
              {/* Transaction Meta */}
              <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-8 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-50 pb-6 mb-2 flex items-center gap-2 italic">
                    <Hash size={16} className="text-indigo-500" />
                    <span>MetaData Registry</span>
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] pl-1">Voucher ID No</label>
                      <input 
                          type="text" 
                          value={formData.returnNo} 
                          onChange={(e) => setFormData({...formData, returnNo: e.target.value})}
                          className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-base font-black text-gray-900 outline-none focus:bg-white focus:border-black transition-all italic tracking-tighter"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] pl-1">Registry Date</label>
                      <input 
                          type="date" 
                          value={formData.date} 
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-black transition-all uppercase"
                      />
                   </div>
                   <div className="space-y-2 relative">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] pl-1">Link to Bill #</label>
                      <div className="relative group">
                          <input 
                              type="text" 
                              value={formData.originalInvoiceNo || ''} 
                              onChange={(e) => setFormData({...formData, originalInvoiceNo: e.target.value})}
                              placeholder="AUTO-PICK INVOICE..."
                              className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 pr-12 text-sm font-black text-indigo-600 outline-none focus:bg-white focus:border-black transition-all uppercase placeholder:normal-case italic tracking-tighter bg-indigo-50/30"
                          />
                          <button 
                             onClick={() => {
                                 if(!formData.party) {
                                     Swal.fire('Info', 'Select vendor first to pick invoice', 'info');
                                     return;
                                 }
                                 setShowInvoicePicker(true);
                             }}
                             className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                          >
                             <FileSearch size={20} />
                          </button>
                      </div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-2 pl-1 italic">Click search icon to link vendor invoices</p>
                   </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-8 shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-50 pb-6 italic">
                    Summary Breakdown
                </div>
                
                <div className="space-y-5">
                    <div className="flex justify-between items-center group">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Net Value</span>
                        <span className="text-sm font-black text-gray-800 italic">₹ {(totals.total || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center gap-2 py-3 border-t border-dashed border-gray-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adjustment Charges</span>
                        <div className="flex items-center bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all w-28">
                            <span className="text-slate-400 text-xs font-bold mr-1">₹</span>
                            <input 
                                type="number" 
                                value={formData.additionalCharges || ''} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setFormData({...formData, additionalCharges: parseFloat(e.target.value) || 0})}
                                placeholder="0"
                                className="w-full bg-transparent border-none outline-none text-right font-bold text-sm text-slate-700 p-0 placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-gray-100 text-center">
                        <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-[4px] mb-2">Adjusted Total</div>
                        <div className="text-4xl font-black text-indigo-600 tracking-tighter italic">
                            ₹ {((totals.total || 0) + (parseFloat(formData.additionalCharges) || 0)).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-center">
                     <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[4px] py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none"
                     >
                        {loading ? 'AUDITING...' : 'CONFIRM ADJUSTMENT'}
                     </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>


        {/* Vendor Selection Modal */}
        {showPartyDropdown && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col">
                    <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Vendor Registry</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mt-2">Select party for financial audit</p>
                        </div>
                        <button onClick={() => setShowPartyDropdown(false)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-10 shrink-0">
                        <div className="relative group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                            <input 
                                type="text" 
                                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] text-base font-black placeholder:text-gray-300 focus:bg-white focus:border-black outline-none transition-all uppercase tracking-tight shadow-inner"
                                placeholder="SEARCH BY NAME, MOBILE OR GSTIN..."
                                value={searchParty}
                                onChange={(e) => setSearchParty(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto px-6 pb-10 custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 gap-3">
                            {parties.filter(p => {
                                const term = searchParty.toLowerCase().trim();
                                if (!term) return true;
                                return p.name.toLowerCase().includes(term) || (p.mobile || '').includes(term) || (p.gstin || '').toLowerCase().includes(term);
                            }).map(party => (
                                <div 
                                    key={party._id} 
                                    className="p-6 hover:bg-gray-50 cursor-pointer rounded-3xl border border-transparent hover:border-gray-100 transition-all flex items-center justify-between group active:scale-[0.98]"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, party }));
                                        setShowPartyDropdown(false);
                                        setSearchParty('');
                                    }}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                                            <Truck size={28} />
                                        </div>
                                        <div>
                                            <div className="font-black text-lg text-gray-900 uppercase italic tracking-tighter group-hover:text-black transition-colors">{party.name}</div>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[2px]">{party.mobile || 'NO CONTACT'}</span>
                                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                                <span className="text-[9px] bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-indigo-500 font-black uppercase tracking-widest">{party.gstin || 'UNREGISTERED'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all font-black text-[10px] uppercase tracking-widest">
                                        SELECT
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Invoice Picker Modal */}
        {showInvoicePicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col">
                    <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Purchase Registry</h3>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[4px] mt-2 italic">Select invoice to auto-load audit items</p>
                        </div>
                        <button onClick={() => setShowInvoicePicker(false)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="overflow-y-auto px-6 py-6 custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 gap-4">
                            {filteredPurchases.length > 0 ? filteredPurchases.map(inv => (
                                <div 
                                    key={inv._id} 
                                    className="p-6 hover:bg-[#F9FAFF] cursor-pointer rounded-3xl border border-gray-100 hover:border-indigo-100 transition-all flex items-center justify-between group active:scale-[0.98] border-l-4 border-l-transparent hover:border-l-indigo-500"
                                    onClick={() => selectPurchaseInvoice(inv)}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-all shadow-sm border border-gray-50">
                                            <Calendar size={20} />
                                            <span className="text-[10px] font-black mt-1 uppercase italic">{new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div>
                                            <div className="font-black text-lg text-gray-900 uppercase italic tracking-tighter group-hover:text-indigo-900 transition-colors">#{inv.purchaseNo || inv.invoiceNo}</div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[2px]">ITEMS: {inv.items.length}</span>
                                                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                                <span className="text-[11px] text-green-600 font-black uppercase tracking-widest italic">VAL: ₹ {inv.totalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all font-black text-[9px] uppercase tracking-[3px]">
                                        AUTO-LOAD
                                    </div>
                                </div>
                            )) : (
                                <div className="p-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-200">
                                        <FileSearch size={32} />
                                    </div>
                                    <p className="text-[12px] font-black text-gray-400 uppercase tracking-[5px]">No Purchase Registry Found</p>
                                    <p className="text-[10px] text-gray-300 mt-3 uppercase italic">No records exist for this vendor account.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

      {/* Item Picker Modal */}
      {showItemPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
             <div className="px-10 py-8 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
                <div className="text-left">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Select Item</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[4px] mt-2">Pick an item from your inventory</p>
                </div>
                <button onClick={() => setShowItemPicker(false)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-2xl transition-all"><X size={24} /></button>
             </div>
             
             <div className="p-8 space-y-6">
                {/* Search Bar */}
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="SEARCH BY NAME OR CODE..."
                    className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-black outline-none focus:bg-white focus:border-black transition-all uppercase tracking-wider placeholder:text-gray-300"
                    value={pickerSearchTerm}
                    onChange={(e) => setPickerSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Item List */}
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar divide-y divide-gray-50 text-left">
                  {items
                    .filter(item => 
                      item.name.toLowerCase().includes(pickerSearchTerm.toLowerCase()) || 
                      (item.code && item.code.toLowerCase().includes(pickerSearchTerm.toLowerCase()))
                    )
                    .map(item => (
                      <div 
                        key={item._id}
                        className="px-6 py-5 hover:bg-gray-50/80 cursor-pointer flex items-center justify-between group transition-all rounded-3xl border border-transparent hover:border-gray-100"
                        onClick={() => selectItem(item)}
                      >
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-indigo-200 group-hover:scale-110 transition-all text-gray-300 group-hover:text-indigo-600">
                              <Receipt size={24} />
                           </div>
                           <div>
                              <div className="font-black text-gray-900 text-base uppercase italic tracking-tight group-hover:text-indigo-900 transition-colors">{item.name}</div>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Code: {item.code || '-'}</span>
                                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                 <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{item.category}</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-black text-gray-900 italic">Buy: ₹{(item.purchasePrice || 0).toLocaleString()}</div>
                           <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Stock: {item.stock} {item.unit}</div>
                        </div>
                      </div>
                    ))
                  }
                  {items.filter(item => 
                    item.name.toLowerCase().includes(pickerSearchTerm.toLowerCase()) || 
                    (item.code && item.code.toLowerCase().includes(pickerSearchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="py-20 text-center">
                       <div className="bg-gray-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-center">
                          <X size={32} className="text-gray-200" />
                       </div>
                       <p className="text-xs font-black text-gray-300 uppercase tracking-[4px]">No products found</p>
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

export default AddDebitNote;
