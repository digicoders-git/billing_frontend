import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  ArrowLeft, Printer, Edit, Trash2, Mail, Download, Share2
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

const ViewCreditNote = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const componentRef = useRef();
    
    const [noteData, setNoteData] = useState(null);
    const [loading, setLoading] = useState(true);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: noteData ? `Credit_Note_${noteData.returnNo}` : 'Credit_Note'
    });

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const response = await api.get(`/returns/${id}`);
                setNoteData(response.data);
            } catch (error) {
                console.error("Error fetching credit note:", error);
                Swal.fire('Error', 'Failed to load credit note details', 'error');
                navigate('/sales/credit-notes');
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
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
                Swal.fire('Deleted!', 'Credit Note has been deleted.', 'success');
                navigate('/sales/credit-notes');
            } catch (error) {
                console.error('Error deleting credit note:', error);
                Swal.fire('Error', 'Failed to delete credit note', 'error');
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

    if (!noteData) return null;

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
                   <h1 className="text-2xl font-black text-gray-900 tracking-tight">Viewing Credit Note</h1>
                   <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-blue-500 border-blue-100">
                      Issued
                   </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                    Reference: <span className="text-gray-700 font-bold">#{noteData.returnNo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
               <button 
                onClick={() => navigate(`/sales/credit-note/edit/${id}`)}
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
                 <div className="p-6 sm:p-8 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
                    {/* Company Info Left */}
                    <div className="w-[60%] flex gap-4">
                        <img src="/Logo.png" alt="Company Logo" className="w-20 h-20 object-contain shrink-0" />
                        <div className="flex-1">
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

                    {/* Credit Note Details Right */}
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">Credit Note</h1>
                        <p className="text-xs text-gray-500 font-bold mb-4">Original Copy</p>
                        
                        <h2 className="text-lg font-bold text-gray-900">#{noteData.returnNo}</h2>
                        <p className="text-xs text-gray-500 mt-1">Date: {new Date(noteData.date).toLocaleDateString('en-GB')}</p>
                        {noteData.originalInvoiceNo && (
                            <p className="text-xs text-gray-500">Ref: {noteData.originalInvoiceNo}</p>
                        )}
                    </div>
                 </div>

                 {/* Party Details */}
                 <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
                     <div>
                         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Credit To (Customer)</h3>
                         <div className="space-y-1">
                             <p className="text-sm font-bold text-gray-900">{noteData.partyName || (noteData.party?.name)}</p>
                             {noteData.party && (
                                <>
                                    <p className="text-xs text-gray-500 max-w-full sm:max-w-[200px]">{noteData.party.billingAddress || 'No Address'}</p>
                                    <p className="text-xs text-gray-500 mt-2">Mobile: {noteData.party.phone}</p>
                                    <p className="text-xs text-gray-500">GSTIN: {noteData.party.gstin}</p>
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
                             {noteData.items.map((item, index) => (
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
                                 <span>₹ {noteData.subtotal.toLocaleString()}</span>
                             </div>
                             {noteData.additionalCharges > 0 && (
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>Add. Charges</span>
                                    <span>+ ₹ {noteData.additionalCharges}</span>
                                </div>
                             )}
                             {noteData.overallDiscount > 0 && (
                                <div className="flex justify-between text-xs text-green-600 font-medium">
                                    <span>Discount</span>
                                    <span>- ₹ {noteData.overallDiscountType === 'percentage' 
                                        ? `${(noteData.subtotal * noteData.overallDiscount / 100).toFixed(2)} (${noteData.overallDiscount}%)` 
                                        : noteData.overallDiscount}
                                    </span>
                                </div>
                             )}
                             {noteData.roundOffDiff !== 0 && (
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>Round Off</span>
                                    <span>{noteData.roundOffDiff > 0 ? '+' : ''} ₹ {noteData.roundOffDiff}</span>
                                </div>
                             )}
                             <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                 <span className="text-sm font-black text-gray-900 uppercase">Credit Amount</span>
                                 <span className="text-xl font-black text-gray-900">₹ {noteData.totalAmount.toLocaleString()}</span>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Footer / Notes */}
                 <div className="p-6 sm:p-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[10px] text-gray-500">
                     <div className="space-y-2">
                         <h4 className="font-black text-gray-900 uppercase tracking-widest">Notes & Terms</h4>
                         <p className="whitespace-pre-line leading-relaxed">{noteData.notes}</p>
                         <p className="whitespace-pre-line leading-relaxed">{noteData.terms}</p>
                     </div>
                     <div className="space-y-2 text-left sm:text-right">
                         <h4 className="font-black text-gray-900 uppercase tracking-widest">Authorized Signatory</h4>
                         <div className="h-16"></div>
                         <p className="font-bold">For FAIZAN MACHINERY & AQUA CULTURE</p>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </DashboardLayout>
    );
};

export default ViewCreditNote;
