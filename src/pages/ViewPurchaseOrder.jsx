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
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate(-1)} 
                className="group flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-[20px] shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-gray-500 hover:text-gray-800"
              >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-4">
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic underline decoration-indigo-500/20 underline-offset-8 decoration-4">View Order</h1>
                   <span className={cn(
                        "px-3.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-[2px] border shadow-sm",
                        orderData.status === 'Delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        orderData.status === 'Approved' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                   )}>
                      {orderData.status}
                   </span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mt-4 flex items-center gap-3">
                    REGISTRY REF: <span className="text-indigo-600 italic">#{orderData.orderNo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] border border-gray-100 shadow-xl shadow-gray-200/50 w-full sm:w-auto justify-end sm:justify-start">
               <button 
                onClick={() => navigate(`/purchases/order/edit/${id}`)}
                className="p-3 sm:px-5 sm:py-3 text-gray-600 hover:bg-gray-50 rounded-[18px] transition-all flex items-center gap-3 font-black uppercase text-[10px] tracking-[2px] group"
              >
                <Edit size={18} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                <span className="hidden sm:inline">Modify Entry</span>
              </button>
              <div className="w-px h-6 bg-gray-100"></div>
              <button 
                onClick={handleDelete}
                className="p-3 sm:px-5 sm:py-3 text-rose-500 hover:bg-rose-50 rounded-[18px] transition-all flex items-center gap-3 font-black uppercase text-[10px] tracking-[2px] group"
              >
                <Trash2 size={18} className="text-rose-200 group-hover:text-rose-500 transition-colors" />
                <span className="hidden sm:inline">Purge</span>
              </button>
              <div className="w-px h-6 bg-gray-100"></div>
              <button 
                onClick={() => handlePrint()} 
                className="px-8 py-3.5 bg-gray-900 text-white rounded-[18px] text-[10px] font-black hover:bg-indigo-600 transition-all uppercase tracking-[2px] shadow-2xl shadow-indigo-100/20 flex items-center gap-3 active:scale-95 group"
              >
                  <Printer size={18} className="group-hover:rotate-12 transition-transform" /> 
                  <span>Print Audit</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
             {/* Printable Area */}
             <div ref={componentRef} className="bg-white shadow-2xl rounded-[40px] overflow-hidden print:shadow-none print:rounded-none print:overflow-visible print:w-full border border-gray-50 flex flex-col min-h-[1200px]">
                 
                 {/* Print Header */}
                 <div className="p-8 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-8">
                    {/* Company Info Left */}
                    <div className="flex gap-4">
                        <div className="w-16 h-16 border-2 border-yellow-500 rounded-full flex items-center justify-center p-0.5 shrink-0">
                            <div className="w-full h-full bg-black rounded-full flex flex-col items-center justify-center text-white overflow-hidden p-0.5">
                                <div className="text-[8px] font-black leading-none">FAIZAN</div>
                                <div className="text-[5px] opacity-70">AQUACULTURE</div>
                            </div>
                        </div>
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
                 <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-16 bg-[#F9FAFF]/50 border-b border-gray-50">
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
                     <div className="flex flex-col justify-center items-end">
                        <div className="p-10 border-4 border-dashed border-indigo-100/50 rounded-[40px] flex flex-col items-center gap-4 group hover:border-indigo-400 transition-all">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-500/5 border border-indigo-50">
                                <ShoppingCart size={32} />
                             </div>
                             <div className="text-center">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] block mb-1">Procurement Status</span>
                                <span className="text-sm font-black text-indigo-500 uppercase italic tracking-widest">{orderData.status}</span>
                             </div>
                        </div>
                     </div>
                 </div>

                 {/* Line Items Table View */}
                 <div className="flex-1">
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
                 <div className="p-12 bg-gray-900 mt-auto relative overflow-hidden">
                     <div className="absolute inset-0 bg-linear-to-br from-indigo-900 to-black opacity-100" />
                     <div className="absolute left-0 bottom-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                     
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-12">
                         <div className="flex-1 space-y-8 min-w-[300px]">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[5px] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                    Procurement Audit Narratives
                                </h4>
                                <div className="p-8 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 italic text-xs text-indigo-100/70 leading-relaxed font-bold uppercase tracking-widest relative overflow-hidden group">
                                     <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500" />
                                     "{orderData.notes || 'Transaction recorded for inventory requisition and supplier placement.'}"
                                </div>
                            </div>
                            <div className="space-y-2 max-w-lg">
                                <p className="text-[9px] font-black text-indigo-900 bg-indigo-300 rounded-lg px-3 py-1 inline-block uppercase tracking-[2px] mb-2 italic">Standard Audit Terms</p>
                                <p className="text-[10px] font-bold text-white/30 leading-loose uppercase tracking-tighter">
                                    {orderData.terms || 'Standard business terms apply for procurement orders. Prices mentioned are subject to market variations unless fixed.'}
                                </p>
                            </div>
                         </div>

                         <div className="w-full md:w-96 space-y-6">
                              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 space-y-6 shadow-2xl">
                                 <div className="flex justify-between items-center text-[11px] text-white/30 font-black uppercase tracking-[3px]">
                                     <span>Indent Registry Value</span>
                                     <span className="text-white not-italic">₹ {orderData.subtotal?.toLocaleString() || '0'}</span>
                                 </div>
                                 {orderData.additionalCharges > 0 && (
                                    <div className="flex justify-between items-center text-[11px] text-white/30 font-black uppercase tracking-[3px]">
                                        <span>Logistics / Meta charges</span>
                                        <span className="text-indigo-400 not-italic">+ ₹ {orderData.additionalCharges}</span>
                                    </div>
                                 )}
                                 {orderData.overallDiscount > 0 && (
                                    <div className="flex justify-between items-center text-[11px] text-rose-400 font-black uppercase tracking-[3px]">
                                        <span>Indent Rebates</span>
                                        <span className="">- ₹ {orderData.overallDiscount.toLocaleString()}</span>
                                    </div>
                                 )}
                                 <div className="pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-black text-white/20 italic uppercase tracking-widest">
                                     <span>Round Off Diff</span>
                                     <span>{orderData.roundOffDiff > 0 ? '+' : ''} ₹ {orderData.roundOffDiff || '0.00'}</span>
                                 </div>
                                 
                                 <div className="pt-6 border-t border-indigo-500/20">
                                    <span className="text-[10px] font-black uppercase tracking-[5px] text-indigo-500 block mb-3 italic">Final Acquisition Indent</span>
                                    <div className="text-5xl font-black italic tracking-tighter text-white flex items-center gap-4">
                                        <span className="text-xl font-bold opacity-30 not-italic">₹</span>
                                        {orderData.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex flex-col items-center gap-4 pt-10">
                                  <div className="w-48 h-px bg-white/10" />
                                  <div className="flex flex-col items-center">
                                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[5px] italic">PROCUREMENT AUDIT SEAL</p>
                                      <p className="text-[10px] font-bold text-indigo-500/50 uppercase mt-2">For FAIZAN MACHINERY & AQUA CULTURE</p>
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

export default ViewPurchaseOrder;
