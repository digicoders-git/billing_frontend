import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  ArrowLeft, Printer, Edit, Trash2, Mail, Download, Share2
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

const ViewSalesReturn = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const componentRef = useRef();
    
    const [returnData, setReturnData] = useState(null);
    const [loading, setLoading] = useState(true);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: returnData ? `Sales_Return_${returnData.returnNo}` : 'Sales_Return'
    });

    useEffect(() => {
        const fetchReturn = async () => {
            try {
                const response = await api.get(`/returns/${id}`);
                setReturnData(response.data);
            } catch (error) {
                console.error("Error fetching return:", error);
                Swal.fire('Error', 'Failed to load return details', 'error');
                navigate('/sales/returns');
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
                Swal.fire('Deleted!', 'Return has been deleted.', 'success');
                navigate('/sales/returns');
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
                   <h1 className="text-2xl font-black text-gray-900 tracking-tight">Viewing Sales Return</h1>
                   <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-red-50 text-red-500 border-red-100">
                      Unpaid
                   </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                    Reference: <span className="text-gray-700 font-bold">#{returnData.returnNo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
               <button 
                onClick={() => navigate(`/sales/return/edit/${id}`)}
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
             <div ref={componentRef} className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none print:overflow-visible print:w-full">
                 
                 {/* Print Header */}
                 <div className="p-6 sm:p-8 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">Sales Return / Credit Note</h1>
                        <p className="text-xs text-gray-500 font-medium">Original Copy</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <h2 className="text-lg font-bold text-gray-900">#{returnData.returnNo}</h2>
                        <p className="text-xs text-gray-500 mt-1">Date: {new Date(returnData.date).toLocaleDateString('en-IN')}</p>
                        {returnData.originalInvoiceNo && (
                            <p className="text-xs text-gray-500">Original Invoice: {returnData.originalInvoiceNo}</p>
                        )}
                    </div>
                 </div>

                 {/* Party Details */}
                 <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
                     <div>
                         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Return From (Customer)</h3>
                         <div className="space-y-1">
                             <p className="text-sm font-bold text-gray-900">{returnData.partyName || (returnData.party?.name)}</p>
                             {returnData.party && (
                                <>
                                    <p className="text-xs text-gray-500 max-w-full sm:max-w-[200px]">{returnData.party.billingAddress || 'No Address'}</p>
                                    <p className="text-xs text-gray-500 mt-2">Mobile: {returnData.party.phone}</p>
                                    <p className="text-xs text-gray-500">GSTIN: {returnData.party.gstin}</p>
                                </>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Items Table */}
                 <div className="border-t border-gray-100 overflow-x-auto">
                     <table className="w-full text-left min-w-[600px] sm:min-w-full">
                         <thead>
                             <tr className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                 <th className="px-4 sm:px-8 py-4">#</th>
                                 <th className="px-4 sm:px-8 py-4 w-1/2">Item Description</th>
                                 <th className="px-4 sm:px-8 py-4 text-center">Qty</th>
                                 <th className="px-4 sm:px-8 py-4 text-right">Rate</th>
                                 <th className="px-4 sm:px-8 py-4 text-right">Amount</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                             {returnData.items.map((item, index) => (
                                 <tr key={index}>
                                     <td className="px-4 sm:px-8 py-4 text-xs font-bold text-gray-400">{index + 1}</td>
                                     <td className="px-4 sm:px-8 py-4">
                                         <p className="text-sm font-bold text-gray-900">{item.name}</p>
                                         <p className="text-[10px] text-gray-400 mt-0.5">HSN: {item.hsn || 'N/A'}</p>
                                     </td>
                                     <td className="px-4 sm:px-8 py-4 text-center text-sm font-medium text-gray-600">{item.qty} {item.unit}</td>
                                     <td className="px-4 sm:px-8 py-4 text-right text-sm font-medium text-gray-600">₹ {item.rate}</td>
                                     <td className="px-4 sm:px-8 py-4 text-right text-sm font-bold text-gray-900">₹ {item.amount.toLocaleString()}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>

                 {/* Totals Section */}
                 <div className="p-6 sm:p-8 bg-gray-50/30 border-t border-gray-100">
                     <div className="flex justify-end">
                         <div className="w-full sm:w-64 space-y-3">
                             <div className="flex justify-between text-xs text-gray-500 font-medium">
                                 <span>Subtotal</span>
                                 <span>₹ {returnData.subtotal.toLocaleString()}</span>
                             </div>
                             {returnData.additionalCharges > 0 && (
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>Add. Charges</span>
                                    <span>+ ₹ {returnData.additionalCharges}</span>
                                </div>
                             )}
                             {returnData.overallDiscount > 0 && (
                                <div className="flex justify-between text-xs text-green-600 font-medium">
                                    <span>Discount</span>
                                    <span>- ₹ {returnData.overallDiscountType === 'percentage' 
                                        ? `${(returnData.subtotal * returnData.overallDiscount / 100).toFixed(2)} (${returnData.overallDiscount}%)` 
                                        : returnData.overallDiscount}
                                    </span>
                                </div>
                             )}
                             {returnData.roundOffDiff !== 0 && (
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>Round Off</span>
                                    <span>{returnData.roundOffDiff > 0 ? '+' : ''} ₹ {returnData.roundOffDiff}</span>
                                </div>
                             )}
                             <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                 <span className="text-sm font-black text-gray-900 uppercase">Total Refund</span>
                                 <span className="text-xl font-black text-gray-900">₹ {returnData.totalAmount.toLocaleString()}</span>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Footer / Notes - Fixed for Print */}
                 <div className="p-6 sm:p-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[10px] text-gray-500 break-inside-avoid">
                     <div className="space-y-2">
                         <h4 className="font-black text-gray-900 uppercase tracking-widest">Notes & Terms</h4>
                         <p className="whitespace-pre-line leading-relaxed">{returnData.notes}</p>
                         <p className="whitespace-pre-line leading-relaxed">{returnData.terms}</p>
                     </div>
                     <div className="space-y-2 text-left sm:text-right">
                         <h4 className="font-black text-gray-900 uppercase tracking-widest">Authorized Signatory</h4>
                         <div className="h-12"></div>
                         <p>For Your Company Name</p>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </DashboardLayout>
    );
};

export default ViewSalesReturn;
