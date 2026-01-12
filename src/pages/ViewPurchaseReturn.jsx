import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  ArrowLeft, Printer, Edit, Trash2, Mail, Download, Share2
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

const ViewPurchaseReturn = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const componentRef = useRef();
    
    const [returnData, setReturnData] = useState(null);
    const [loading, setLoading] = useState(true);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: returnData ? `Purchase_Return_${returnData.returnNo}` : 'Purchase_Return'
    });

    useEffect(() => {
        const fetchReturn = async () => {
            try {
                const response = await api.get(`/returns/${id}`);
                setReturnData(response.data);
            } catch (error) {
                console.error("Error fetching return:", error);
                Swal.fire('Error', 'Failed to load return details', 'error');
                navigate('/purchases/returns');
            } finally {
                setLoading(false);
            }
        };
        fetchReturn();
    }, [id, navigate]);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/returns/${id}`);
                Swal.fire('Deleted!', 'Purchase Return has been deleted.', 'success');
                navigate('/purchases/returns');
            } catch (error) {
                console.error('Error deleting return:', error);
                Swal.fire('Error', 'Failed to delete return', 'error');
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!returnData) return null;

    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50/50 pb-20">
          {/* Top Header */}
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-gray-500 hover:text-gray-800"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-black text-gray-900 tracking-tight italic">Viewing Purchase Return</h1>
                   <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-500 border-indigo-100">
                      Debit Note
                   </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                    Reference: <span className="text-gray-700 font-bold">#{returnData.returnNo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
               <button 
                onClick={() => navigate(`/purchases/return/edit/${id}`)}
                className="p-2 sm:px-4 sm:py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all flex items-center gap-2 font-medium text-sm group"
                title="Edit"
              >
                <Edit size={16} className="text-gray-400 group-hover:text-gray-600" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <div className="w-px h-4 bg-gray-200"></div>
              <button 
                onClick={handleDelete}
                className="p-2 sm:px-4 sm:py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 font-medium text-sm group"
                title="Delete"
              >
                <Trash2 size={16} className="text-red-400 group-hover:text-red-500" />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <div className="w-px h-4 bg-gray-200"></div>
              <button 
                onClick={() => handlePrint()} 
                className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2"
              >
                  <Printer size={16} /> 
                  <span>Print</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
             {/* Printable Area */}
             <div ref={componentRef} className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none print:overflow-visible print:w-full printable-voucher">
                 
                 {/* Print Header */}
                 <div className="p-6 sm:p-8 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">Purchase Return / Debit Note</h1>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Supplier Inventory Audit Copy</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <h2 className="text-lg font-bold text-gray-900 italic">#{returnData.returnNo}</h2>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-bold">Date: {new Date(returnData.date).toLocaleDateString('en-IN')}</p>
                        {returnData.originalInvoiceNo && (
                            <p className="text-xs text-gray-500 uppercase">Ref Invoice: {returnData.originalInvoiceNo}</p>
                        )}
                    </div>
                 </div>

                 {/* Vendor Details */}
                 <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 bg-gray-50/20">
                     <div>
                         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Returned To (Supplier)</h3>
                         <div className="space-y-1">
                             <p className="text-sm font-black text-gray-900 uppercase">{returnData.partyName || (returnData.party?.name)}</p>
                             {returnData.party && (
                                <>
                                    <p className="text-[11px] text-gray-500 max-w-full sm:max-w-[250px] leading-relaxed uppercase">{returnData.party.billingAddress || returnData.party.address || 'No Address Provided'}</p>
                                    <div className="pt-3 space-y-1">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Mobile: <span className="text-gray-700">{returnData.party.phone}</span></p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">GSTIN: <span className="text-gray-700">{returnData.party.gstin}</span></p>
                                    </div>
                                </>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Items Table */}
                 <div className="border-t border-gray-100 overflow-x-auto">
                     <table className="w-full text-left min-w-[600px] sm:min-w-full">
                         <thead>
                             <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                 <th className="px-4 sm:px-8 py-4">#</th>
                                 <th className="px-4 sm:px-8 py-4 w-1/2">Audit Item Description</th>
                                 <th className="px-4 sm:px-8 py-4 text-center">Net Qty</th>
                                 <th className="px-4 sm:px-8 py-4 text-right">Unit Rate</th>
                                 <th className="px-4 sm:px-8 py-4 text-right">Net Value</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                             {returnData.items.map((item, index) => (
                                 <tr key={index}>
                                     <td className="px-4 sm:px-8 py-5 text-xs font-black text-gray-300 italic">{index + 1}</td>
                                     <td className="px-4 sm:px-8 py-5">
                                         <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.name}</p>
                                         <p className="text-[9px] text-gray-400 mt-1 font-black uppercase tracking-widest">HSN: {item.hsn || 'N/A'}</p>
                                     </td>
                                     <td className="px-4 sm:px-8 py-5 text-center text-xs font-black text-gray-600 italic">{item.qty} {item.unit}</td>
                                     <td className="px-4 sm:px-8 py-5 text-right text-xs font-black text-gray-600 italic">₹ {item.rate.toLocaleString()}</td>
                                     <td className="px-4 sm:px-8 py-5 text-right text-sm font-black text-gray-900 italic">₹ {item.amount.toLocaleString()}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>

                 {/* Totals Section */}
                 <div className="p-6 sm:p-8 bg-gray-50/30 border-t border-gray-100 mb-auto">
                     <div className="flex justify-end">
                         <div className="w-full sm:w-72 space-y-4">
                             <div className="flex justify-between text-[11px] text-gray-500 font-black uppercase tracking-widest">
                                 <span>Subtotal Audit</span>
                                 <span>₹ {returnData.subtotal.toLocaleString()}</span>
                             </div>
                             {returnData.additionalCharges > 0 && (
                                <div className="flex justify-between text-[11px] text-gray-500 font-black uppercase tracking-widest">
                                    <span>Procurement Charges</span>
                                    <span>+ ₹ {returnData.additionalCharges}</span>
                                </div>
                             )}
                             {returnData.discountAmount > 0 && (
                                <div className="flex justify-between text-[11px] text-indigo-600 font-black uppercase tracking-widest">
                                    <span>Audit Adjustment</span>
                                    <span>- ₹ {returnData.discountAmount.toLocaleString()}</span>
                                </div>
                             )}
                             {returnData.roundOffDiff !== 0 && (
                                <div className="flex justify-between text-[11px] text-gray-400 font-black uppercase tracking-widest italic">
                                    <span>Round Offset</span>
                                    <span>{returnData.roundOffDiff > 0 ? '+' : ''} ₹ {returnData.roundOffDiff}</span>
                                </div>
                             )}
                             <div className="border-t-2 border-gray-900 pt-5 flex justify-between items-center bg-gray-900 rounded-2xl p-4 shadow-xl">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Final Debit Value</span>
                                 <span className="text-2xl font-black text-white italic tracking-tighter">₹ {returnData.totalAmount.toLocaleString()}</span>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Footer / Notes - Fixed for Print */}
                 <div className="p-6 sm:p-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-10 text-[10px] text-gray-400 break-inside-avoid">
                     <div className="space-y-4">
                         <h4 className="font-black text-gray-900 uppercase tracking-[3px]">Audit Notes & Terms</h4>
                         <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-indigo-500">
                            <p className="whitespace-pre-line leading-relaxed italic text-gray-600">"{returnData.notes || 'No notes provided'}"</p>
                         </div>
                         <p className="whitespace-pre-line leading-relaxed mt-4 font-bold border-t border-gray-50 pt-4">{returnData.terms}</p>
                     </div>
                     <div className="flex flex-col items-center sm:items-end justify-center">
                        <div className="w-full sm:w-64 text-center">
                            <h4 className="font-black text-gray-900 uppercase tracking-[3px] mb-8">Authorized Auditor</h4>
                            <div className="h-px bg-gray-200 w-full mb-2"></div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Signature & Seal</p>
                        </div>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </DashboardLayout>
    );
};

export default ViewPurchaseReturn;
