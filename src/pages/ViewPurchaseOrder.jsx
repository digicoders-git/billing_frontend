import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  ArrowLeft, Printer, Edit, Trash2, Mail, Download, Share2, ScanBarcode,
  Package, Truck, Calendar, Hash, CheckCircle2, ShoppingCart
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { cn } from '../lib/utils';

const ViewPurchaseOrder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const componentRef = useRef();
    
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: orderData ? `PO_${orderData.orderNo}` : 'Purchase_Order'
    });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/purchase-orders/${id}`);
                setOrderData(response.data);
            } catch (error) {
                console.error("Error fetching order:", error);
                Swal.fire('Error', 'Failed to load purchase order details', 'error');
                navigate('/purchases/orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, navigate]);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This purchase order will be removed from registry!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/purchase-orders/${id}`);
                Swal.fire('Deleted!', 'Purchase Order removed.', 'success');
                navigate('/purchases/orders');
            } catch (error) {
                console.error('Error deleting order:', error);
                Swal.fire('Error', 'Failed to delete record', 'error');
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-400">Loading Registry Entry...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!orderData) return null;

    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50/50 pb-20 no-print">
          {/* Top Header */}
          {/* Top Header */}
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(-1)} 
                  className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-500 transition-all shadow-sm"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                     Purchase Order <span className="text-gray-400">#{orderData.orderNo}</span>
                  </h1>
                  <div className="flex items-center gap-3 mt-1.5">
                     <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5",
                          orderData.status === 'Delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          orderData.status === 'Approved' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                     )}>
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            orderData.status === 'Delivered' ? "bg-emerald-500" :
                            orderData.status === 'Approved' ? "bg-indigo-500" :
                            "bg-amber-500"
                        )} />
                        {orderData.status}
                     </span>
                     <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(orderData.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                     </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button 
                  onClick={handleDelete}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} />
                  <span className="sm:inline">Delete</span>
                </button>
                <button 
                  onClick={() => navigate(`/purchases/order/edit/${id}`)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium bg-white"
                >
                  <Edit size={16} />
                  <span className="sm:inline">Edit</span>
                </button>
                <button 
                  onClick={() => handlePrint()} 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg shadow-lg shadow-gray-200 transition-all text-sm font-medium active:scale-95"
                >
                  <Printer size={16} />
                  <span className="sm:inline">Print</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
             {/* Printable Area */}
             <div ref={componentRef} className="bg-white shadow-2xl rounded-[40px] overflow-hidden print:shadow-none print:rounded-none print:overflow-visible print:w-full border border-gray-50 flex flex-col min-h-[1200px]">
                 
                 {/* Print Header */}
                 <div className="p-8 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-8">
                    {/* Company Info Left */}
                    <div className="flex gap-4">
                        <img src="/Logo.png" alt="Company Logo" className="w-20 h-20 object-contain shrink-0" />
                        <div>
                            <h1 className="text-lg font-black leading-tight mb-1 text-black">FAIZAN MACHINERY & AQUA CULTURE</h1>
                            <p className="text-[9px] leading-tight mb-1 font-medium text-gray-600">BARHNI ROAD, ITWA BAZAR, SIDDHARTH NAGAR, UTTAR PRADESH, 272192</p>
                            <div className="grid grid-cols-2 text-[9px] font-medium text-gray-600">
                                <div><strong>GSTIN:</strong> 09DWAPK9067Q1ZJ</div>
                                <div><strong>Mobile:</strong> 9839280238</div>
                                <div><strong>PAN:</strong> DWAPK9069Q</div>
                            </div>
                            <div className="text-[9px] font-medium text-gray-600"><strong>Email:</strong> fmaaquaculture@gmail.com</div>
                        </div>
                    </div>

                    {/* PO Details Right */}
                    <div className="text-left md:text-right">
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">Purchase Order</h1>
                        <p className="text-xs text-indigo-600 font-bold mb-4 uppercase tracking-widest">{orderData.status}</p>
                        
                        <div className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg shadow-sm mb-2">
                             <div className="text-lg font-black tracking-widest uppercase">#{orderData.orderNo}</div>
                        </div>
                        <div className="space-y-1 text-xs text-gray-500 font-medium">
                            <p>Date: <span className="text-gray-900 font-bold">{new Date(orderData.date).toLocaleDateString('en-GB')}</span></p>
                            {orderData.expiryDate && (
                                <p className="text-rose-500">Expires: {new Date(orderData.expiryDate).toLocaleDateString('en-GB')}</p>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* Party Details View */}
                 <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#F9FAFF]/50 border-b border-gray-50 text-left">
                     <div className="space-y-8">
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-12 bg-indigo-500 rounded-full" />
                            <div>
                                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[5px] mb-1 leading-none">Primary Supplier Account</h3>
                                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest italic">Inventory Acquisition Source</p>
                            </div>
                         </div>
                         <div className="space-y-4 pl-4">
                             <p className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">{orderData.partyName || (orderData.party?.name)}</p>
                             {orderData.party && (
                                <div className="space-y-6 pt-4">
                                    <div className="p-6 bg-white rounded-[28px] border border-gray-100 shadow-sm space-y-4 max-w-[400px]">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                                <Truck size={20} />
                                            </div>
                                            <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase italic">{orderData.party.billingAddress || orderData.party.address || 'Address Not Registered In Registry'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 pl-2">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[3px]">Mobile Reference</p>
                                            <p className="text-xs font-black text-gray-700 uppercase tracking-widest">{orderData.party.mobile || 'SECURE NA'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[3px]">Fiscal Identity</p>
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{orderData.party.gstin || 'UNREGISTERED ENTITY'}</p>
                                        </div>
                                    </div>
                                </div>
                             )}
                         </div>
                     </div>
                     
                     {/* Moved Notes & Terms to Middle Section to fill space */}
                     <div className="flex flex-col justify-between space-y-6 pl-4 border-l border-gray-100/50">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2">
                                <Hash size={12} className="text-gray-400" />
                                Audit Narratives
                            </h4>
                            <div className="p-6 bg-gray-50 rounded-[20px] border border-gray-100/50 text-xs font-medium text-gray-500 leading-relaxed italic relative">
                                 "{orderData.notes || 'Transaction recorded for inventory requisition.'}"
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Standard Terms</h4>
                            <p className="text-[10px] font-bold text-gray-400 leading-loose uppercase tracking-wide">
                                {orderData.terms || 'Standard business terms apply. Goods once sold will not be taken back.'}
                            </p>
                        </div>
                     </div>
                 </div>

                 {/* Line Items Mobile View */}
                 <div className="md:hidden print:hidden space-y-4 p-4">
                     {orderData.items.map((item, index) => (
                        <div key={index} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">ITEM {index + 1}</span>
                            </div>
                            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900">
                                {item.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">HSN</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 min-h-[34px] flex items-center">
                                        {item.hsn || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">MRP</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 min-h-[34px] flex items-center">
                                        {item.mrp || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Qty</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-indigo-600 min-h-[34px] flex items-center">
                                        {item.qty} {item.unit || 'PCS'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Rate</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 min-h-[34px] flex items-center">
                                        ₹{item.rate ? item.rate.toLocaleString() : '0'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">GST</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 min-h-[34px] flex items-center">
                                        {item.gstRate || item.tax || 'None'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Disc %</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 min-h-[34px] flex items-center">
                                        {item.discount || 0}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                                <span className="text-base font-bold text-indigo-600">₹ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                     ))}
                 </div>

                 {/* Line Items Table View */}
                 <div className="hidden md:block print:block flex-1">
                     <table className="w-full text-left">
                         <thead>
                             <tr className="bg-[#FDFDFF] text-[10px] font-black text-gray-400 uppercase tracking-[3px] border-b border-gray-100 italic">
                                 <th className="px-12 py-8 w-24 opacity-30 text-center">#</th>
                                 <th className="px-6 py-8">Acquisition Description & HSN Audit</th>
                                 <th className="px-6 py-8 text-center w-32">Procure Qty</th>
                                 <th className="px-6 py-8 text-right w-48">Audit Rate (₹)</th>
                                 <th className="px-12 py-8 text-right w-48">Indent Amt (₹)</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                             {orderData.items.map((item, index) => (
                                 <tr key={index} className="group hover:bg-[#F9FAFF] transition-all">
                                     <td className="px-12 py-10 text-[11px] font-black text-gray-200 italic group-hover:text-indigo-400 transition-colors uppercase text-center">{index + 1}</td>
                                     <td className="px-6 py-10">
                                         <p className="text-lg font-black text-gray-900 uppercase tracking-tighter italic group-hover:translate-x-1 transition-transform">{item.name}</p>
                                         <div className="flex items-center gap-4 mt-3">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[3px] italic bg-indigo-50 px-3 py-1 rounded-lg">HSN: {item.hsn || 'NON-GST'}</span>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[2px]">LINE RECORD SYNCED</span>
                                         </div>
                                     </td>
                                     <td className="px-6 py-10 text-center">
                                         <div className="inline-block px-5 py-2 bg-gray-900 text-white rounded-[16px] text-xs font-black italic uppercase shadow-xl shadow-black/10">
                                             {item.qty} {item.unit || 'PCS'}
                                         </div>
                                     </td>
                                     <td className="px-6 py-10 text-right text-sm font-black text-gray-400 italic uppercase">₹ {item.rate.toLocaleString()}</td>
                                     <td className="px-12 py-10 text-right text-xl font-black text-gray-900 italic tracking-tighter group-hover:scale-105 transition-transform origin-right">
                                        <span className="text-xs font-bold opacity-20 mr-2 not-italic">₹</span>
                                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>

                 {/* Totals & Meta (Registry Footer) */}
                 <div className="p-8 sm:p-10 bg-gray-50 border-t border-gray-100 mt-auto">
                     <div className="flex flex-col items-end gap-8">
                         {/* Totals Section */}
                         <div className="w-full sm:w-80 space-y-4">
                              <div className="space-y-3">
                                 <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                                     <span>Subtotal</span>
                                     <span className="text-gray-900">₹ {orderData.subtotal?.toLocaleString() || '0'}</span>
                                 </div>
                                 {orderData.additionalCharges > 0 && (
                                    <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                                        <span>Logistics</span>
                                        <span className="text-gray-900">+ ₹ {orderData.additionalCharges}</span>
                                    </div>
                                 )}
                                 {orderData.overallDiscount > 0 && (
                                    <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                                        <span>Discount</span>
                                        <span className="text-rose-500">- ₹ {orderData.overallDiscount.toLocaleString()}</span>
                                    </div>
                                 )}
                                 <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center text-xs font-medium text-gray-500">
                                     <span>Round Off</span>
                                     <span>{orderData.roundOffDiff > 0 ? '+' : ''} ₹ {orderData.roundOffDiff || '0.00'}</span>
                                 </div>
                              </div>
                              
                              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Indent</span>
                                 </div>
                                 <div className="text-2xl font-bold tracking-tight text-gray-900">
                                    ₹ {orderData.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                 </div>
                              </div>
                         </div>

                         {/* Signature Section (Moved to Bottom) */}
                         <div className="flex flex-col items-end space-y-2 mt-4 pt-4">
                              <div className="h-16 w-40 border-b-2 border-dashed border-gray-300 mb-2"></div>
                              <p className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Authorized Signatory</p>
                              <p className="text-[8px] font-semibold text-gray-400 uppercase">For FAIZAN MACHINERY</p>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </DashboardLayout>
    );
};

export default ViewPurchaseOrder;
