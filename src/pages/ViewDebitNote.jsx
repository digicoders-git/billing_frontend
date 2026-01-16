import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  ArrowLeft, Printer, Edit, Trash2, Mail, Download, Share2, ScanBarcode
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

const ViewDebitNote = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const componentRef = useRef();
    
    const [noteData, setNoteData] = useState(null);
    const [loading, setLoading] = useState(true);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: noteData ? `Debit_Note_${noteData.returnNo}` : 'Debit_Note'
    });

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const response = await api.get(`/returns/${id}`);
                setNoteData(response.data);
            } catch (error) {
                console.error("Error fetching debit note:", error);
                Swal.fire('Error', 'Failed to load debit note details', 'error');
                navigate('/purchases/debit-notes');
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [id, navigate]);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This debit note will be removed from registry!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/returns/${id}`);
                Swal.fire('Deleted!', 'Debit Note removed.', 'success');
                navigate('/purchases/debit-notes');
            } catch (error) {
                console.error('Error deleting debit note:', error);
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
                   <h1 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">View Debit Note</h1>
                   <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-500 border-indigo-100 italic">
                      Audit Entry
                   </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                    Registry Ref: <span className="text-indigo-600 font-black tracking-widest">#{noteData.returnNo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
               <button 
                onClick={() => navigate(`/purchases/debit-note/edit/${id}`)}
                className="p-2 sm:px-4 sm:py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest group"
                title="Edit"
              >
                <Edit size={16} className="text-gray-400 group-hover:text-gray-600" />
                <span className="hidden sm:inline">Modify</span>
              </button>
              <div className="w-px h-4 bg-gray-200"></div>
              <button 
                onClick={handleDelete}
                className="p-2 sm:px-4 sm:py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest group"
                title="Delete"
              >
                <Trash2 size={16} className="text-red-400 group-hover:text-red-500" />
                <span className="hidden sm:inline">Purge</span>
              </button>
              <div className="w-px h-4 bg-gray-200"></div>
              <button 
                onClick={() => handlePrint()} 
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-[10px] font-black hover:bg-black transition-all uppercase tracking-[2px] shadow-lg hover:shadow-black/20 flex items-center gap-2 active:scale-95"
              >
                  <Printer size={16} /> 
                  <span>Print Audit</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
             {/* Printable Area */}
             <div ref={componentRef} className="bg-white shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:rounded-none print:overflow-visible print:w-full printable-voucher border border-gray-100">
                 
                 {/* Print Header */}
                 <div className="p-8 border-b-4 border-gray-900 flex flex-col sm:flex-row justify-between gap-6 bg-white">
                    {/* Company Info Left */}
                    <div className="w-[60%] flex gap-4">
                        <div className="w-16 h-16 border-2 border-yellow-500 rounded-full flex items-center justify-center p-0.5 shrink-0">
                            <div className="w-full h-full bg-black rounded-full flex flex-col items-center justify-center text-white overflow-hidden p-0.5">
                                <div className="text-[8px] font-black leading-none">FAIZAN</div>
                                <div className="text-[5px] opacity-70">AQUACULTURE</div>
                            </div>
                        </div>
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

                    {/* Debit Note Details Right */}
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="flex items-center gap-4 mb-2 justify-end">
                             <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Debit Note</h1>
                        </div>
                        <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-[4px] inline-block mb-4">Financial Ledger Adjustment</p>
                        
                        <div className="text-xl font-black text-gray-900 italic tracking-widest mb-1 uppercase">#{noteData.returnNo}</div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest italic">Registry Date: <span className="text-gray-900 not-italic">{new Date(noteData.date).toLocaleDateString('en-GB')}</span></p>
                            {noteData.originalInvoiceNo && (
                                <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest italic">Bill Ref: <span className="text-indigo-600 not-italic">#{noteData.originalInvoiceNo}</span></p>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* Party Details */}
                 <div className="p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-2 gap-12 bg-gray-50/30">
                     <div className="relative">
                         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            Issued To (Party)
                         </h3>
                         <div className="space-y-2">
                             <p className="text-xl font-black text-gray-900 uppercase italic tracking-tight">{noteData.partyName || (noteData.party?.name)}</p>
                             {noteData.party && (
                                <>
                                    <p className="text-xs text-gray-500 font-bold max-w-[300px] leading-relaxed uppercase italic mt-2">{noteData.party.billingAddress || noteData.party.address || 'Address Not Registered'}</p>
                                    <div className="pt-6 grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mobile Contact</p>
                                            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{noteData.party.mobile || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tax Identity</p>
                                            <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{noteData.party.gstin || 'UNREGISTERED'}</p>
                                        </div>
                                    </div>
                                </>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Items Table */}
                 <div className="border-t border-gray-100 overflow-x-auto min-h-[400px]">
                     <table className="w-full text-left">
                         <thead>
                             <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
                                 <th className="px-10 py-6 w-16">#</th>
                                 <th className="px-4 py-6">Adjustment Product / Narrative</th>
                                 <th className="px-4 py-6 text-center">Audit Qty</th>
                                 <th className="px-4 py-6 text-right">Adj Rate</th>
                                 <th className="px-10 py-6 text-right">Debit Amt</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                             {noteData.items.map((item, index) => (
                                 <tr key={index} className="group">
                                     <td className="px-10 py-8 text-[11px] font-black text-gray-300 italic group-hover:text-indigo-500 transition-colors uppercase">{index + 1}</td>
                                     <td className="px-4 py-8">
                                         <p className="text-[15px] font-black text-gray-900 uppercase tracking-tighter italic group-hover:text-black transition-colors">{item.name}</p>
                                         <p className="text-[9px] text-indigo-400 mt-2 font-black uppercase tracking-[2px] italic">HSN: {item.hsn || 'NON-GST'}</p>
                                     </td>
                                     <td className="px-4 py-8 text-center sm:text-center">
                                         <div className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-[11px] font-black text-gray-700 italic uppercase">
                                             {item.qty} {item.unit || 'PCS'}
                                         </div>
                                     </td>
                                     <td className="px-4 py-8 text-right text-xs font-black text-gray-500 italic uppercase">₹ {item.rate.toLocaleString()}</td>
                                     <td className="px-10 py-8 text-right text-[16px] font-black text-gray-900 italic tracking-tighter">
                                        <span className="text-[11px] font-bold opacity-30 mr-1.5 not-italic">₹</span>
                                        {item.amount.toLocaleString()}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>

                 {/* Totals Section */}
                 <div className="p-8 sm:p-12 bg-[#F9FAFF] border-t-2 border-dashed border-gray-200">
                     <div className="flex flex-col sm:flex-row justify-between items-start gap-12">
                         <div className="flex-1 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Audit Declarations</h4>
                                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm italic text-[11px] text-gray-500 leading-relaxed font-bold uppercase tracking-wider relative overflow-hidden">
                                     <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
                                     "{noteData.notes || 'Transaction adjustment recorded for ledger balancing.'}"
                                </div>
                            </div>
                            <div className="relative">
                                <p className="text-[9px] font-bold text-gray-400 leading-loose uppercase tracking-tighter border-t border-gray-100 pt-4">
                                    {noteData.terms || 'Standard business terms apply for debit note adjustments.'}
                                </p>
                            </div>
                         </div>

                         <div className="w-full sm:w-80 space-y-4">
                              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                 <div className="flex justify-between text-[11px] text-gray-400 font-black uppercase tracking-widest italic">
                                     <span>Net Registry Value</span>
                                     <span className="text-gray-900 not-italic">₹ {noteData.subtotal?.toLocaleString() || '0'}</span>
                                 </div>
                                 {noteData.additionalCharges > 0 && (
                                    <div className="flex justify-between text-[11px] text-gray-400 font-black uppercase tracking-widest italic">
                                        <span>Meta Adjustments</span>
                                        <span className="text-gray-900 not-italic">+ ₹ {noteData.additionalCharges}</span>
                                    </div>
                                 )}
                                 {noteData.discountAmount > 0 && (
                                    <div className="flex justify-between text-[11px] text-red-500 font-black uppercase tracking-widest italic">
                                        <span>Audit Rebates</span>
                                        <span className="">- ₹ {noteData.discountAmount.toLocaleString()}</span>
                                    </div>
                                 )}
                                 <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-300 italic uppercase">
                                     <span>Round Off</span>
                                     <span>{noteData.roundOffDiff > 0 ? '+' : ''} ₹ {noteData.roundOffDiff || '0.00'}</span>
                                 </div>
                              </div>
                              
                              <div className="bg-gray-900 rounded-3xl p-8 text-white relative shadow-2xl overflow-hidden group">
                                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                                  <span className="text-[9px] font-black uppercase tracking-[4px] opacity-40 block mb-2">Final Settlement Value</span>
                                  <div className="text-3xl font-black italic tracking-tighter relative flex items-center gap-2">
                                      <span className="text-lg font-bold opacity-30 not-italic">₹</span>
                                      {noteData.totalAmount.toLocaleString()}
                                  </div>
                              </div>

                               <div className="mt-12 text-center sm:text-right pt-12">
                                   <div className="w-full h-px bg-gray-100 mb-2" />
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-[4px]">For FAIZAN MACHINERY & AQUA CULTURE</p>
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

export default ViewDebitNote;
