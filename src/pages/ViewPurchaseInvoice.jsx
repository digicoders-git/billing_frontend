import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Edit, FileText, Calendar, User, Building, Printer, Truck, Hash } from 'lucide-react';
import api from '../lib/axios';

const ViewPurchaseInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/purchases/${id}`);
        setInvoice(response.data);
      } catch (error) {
        console.error("Failed to fetch purchase details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg font-bold text-gray-400 animate-pulse">Loading Invoice Details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-xl font-bold text-gray-800">Invoice Not Found</div>
          <button 
            onClick={() => navigate('/purchases/invoices')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (balanceAmount, totalAmount) => {
    let status = 'Paid';
    if (balanceAmount > 0) {
      status = balanceAmount < totalAmount ? 'Partial' : 'Unpaid';
    }

    const styles = {
      Unpaid: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
      Partial: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
      Paid: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' }
    };
    
    const style = styles[status] || styles.Unpaid;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 font-sans pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95"
                >
                <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Purchase Bill Details</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Hash size={12} className="text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{invoice.invoiceNo}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs font-semibold text-gray-500">{new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Print
              </button>
              <button
                onClick={() => navigate(`/purchases/edit/${id}`)}
                className="flex-1 sm:flex-none py-2.5 px-6 bg-gray-900 text-white rounded-xl shadow-lg shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-0.5 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Edit size={16} /> Edit Bill
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Invoice & Party Info */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Party Card */}
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                    
                    <div className="relative z-10 flex items-start gap-5">
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-200">
                            <Truck size={24} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Supplier Details</label>
                            <h2 className="text-xl font-black text-gray-800 tracking-tight leading-tight mb-1">{invoice.partyName}</h2>
                            <p className="text-sm font-medium text-gray-500 mb-4">{invoice.party ? invoice.party.address : 'No address provided'}</p>
                            
                            <div className="flex gap-3">
                                <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-600">
                                    GST: {invoice.party ? invoice.party.gstin : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden min-h-[300px]">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Item Breakdown</h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{invoice.items.length} Items</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FDFDFF] border-b border-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">#</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Rate</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/10 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-800">{item.name}</div>
                                            {item.hsn && <div className="text-[10px] font-bold text-gray-400 mt-0.5">HSN: {item.hsn}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-gray-700">{item.qty}</span>
                                            <span className="text-[10px] text-gray-400 ml-1 uppercase">{item.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-600">
                                            ₹{item.rate.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                                            ₹{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notes Section */}
                {(invoice.notes || invoice.terms) && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {invoice.notes && (
                            <div className="bg-amber-50 rounded-[20px] p-5 border border-amber-100">
                                <label className="text-[10px] font-black text-amber-800/50 uppercase tracking-widest mb-2 block">Internal Notes</label>
                                <p className="text-sm font-medium text-amber-900 leading-relaxed">"{invoice.notes}"</p>
                            </div>
                        )}
                         {invoice.terms && (
                            <div className="bg-gray-50 rounded-[20px] p-5 border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Terms & Conditions</label>
                                <p className="text-xs font-medium text-gray-600 leading-relaxed whitespace-pre-line">{invoice.terms}</p>
                            </div>
                        )}
                     </div>
                )}

            </div>

            {/* Right Column - Summary & Stats */}
            <div className="space-y-6">
                
                {/* Status Card */}
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Payment Status</h3>
                        {getStatusBadge(invoice.balanceAmount, invoice.totalAmount)}
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Bill</span>
                            <span className="text-base font-black text-gray-900">₹{invoice.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Paid</span>
                            <span className="text-base font-black text-green-700">₹{invoice.amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Balance Due</span>
                            <span className="text-base font-black text-red-600">₹{invoice.balanceAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Calculations Card */}
                 <div className="bg-gray-900 rounded-[24px] p-6 shadow-xl shadow-gray-900/10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                     <div className="relative z-10 space-y-3">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{invoice.subtotal.toLocaleString()}</span>
                        </div>
                        {invoice.additionalCharges > 0 && (
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Add. Charges</span>
                                <span>+ ₹{invoice.additionalCharges.toLocaleString()}</span>
                            </div>
                        )}
                        {invoice.overallDiscount > 0 && (
                             <div className="flex justify-between text-sm text-green-400 font-medium">
                                <span>Discount</span>
                                <span>- ₹{invoice.overallDiscount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-4 mt-2 border-t border-gray-700 flex justify-between items-end">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Grand Total</span>
                            <span className="text-2xl font-black tracking-tight">₹{invoice.totalAmount.toLocaleString()}</span>
                        </div>
                     </div>
                 </div>

                 {/* Meta Info */}
                 <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Meta Information</h3>
                    <div className="space-y-3 text-xs font-bold text-gray-600">
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span>Created At</span>
                            <span>{new Date(invoice.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span>Last Updated</span>
                            <span>{new Date(invoice.updatedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Payment Method</span>
                            <span className="uppercase">{invoice.paymentMethod}</span>
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

export default ViewPurchaseInvoice;
