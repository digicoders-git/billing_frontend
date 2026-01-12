import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Printer, Trash2, Edit3,
    Calendar, Receipt, Truck,
    CheckCircle2, Loader2
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';

const ViewPaymentOut = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef();

    const fetchPayment = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/payments/${id}`);
            setPayment(response.data);
        } catch {
            Swal.fire('Error', 'Failed to fetch payment details', 'error');
            navigate('/purchases/payment-out');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Transaction?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Yes, Delete'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/payments/${id}`);
                Swal.fire('Deleted!', 'Payment record removed.', 'success');
                navigate('/purchases/payment-out');
            } catch {
                Swal.fire('Error', 'Failed to delete record', 'error');
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
            </DashboardLayout>
        );
    }

    if (!payment) return null;

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50/30 min-h-screen">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-3 bg-white hover:bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl border border-gray-100 shadow-sm transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Payment Voucher</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{payment.receiptNo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => handlePrint()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest"
                        >
                            <Printer size={16} /> Print
                        </button>
                        <button 
                            onClick={() => navigate(`/purchases/edit-payment-out/${id}`)}
                            className="p-3 bg-white text-gray-400 hover:text-green-600 rounded-xl border border-gray-100 shadow-sm transition-all"
                        >
                            <Edit3 size={18} />
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-xl border border-gray-100 shadow-sm transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Voucher Content */}
                <div ref={componentRef} className="bg-white rounded-[40px] shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden printable-voucher">
                    {/* Header Strip */}
                    <div className="h-4 bg-gray-900 w-full" />
                    
                    <div className="p-10 sm:p-16 space-y-12">
                        {/* Voucher Info */}
                        <div className="flex justify-between items-start border-b border-gray-50 pb-12">
                            <div className="space-y-4">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl w-fit">
                                    <Receipt size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase">Payment Voucher</h2>
                                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[4px] mt-1">Transaction Proof</p>
                                </div>
                            </div>
                            <div className="text-right space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Voucher Number</span>
                                    <span className="text-lg font-black text-gray-900 uppercase italic tracking-tight">{payment.receiptNo}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Transaction Date</span>
                                    <span className="text-lg font-black text-gray-900 uppercase italic tracking-tight">
                                        {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Party Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] block border-l-4 border-indigo-500 pl-4">Paid To (Vendor)</span>
                                <div className="bg-gray-50 p-8 rounded-[32px] space-y-3">
                                    <h3 className="text-xl font-black text-gray-900 uppercase italic">{payment.partyName || (payment.party?.name)}</h3>
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <Truck size={16} />
                                        <span className="text-[12px] font-bold uppercase tracking-wider">{payment.party?.city || 'Vendor Account'}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Account ID</span>
                                        <p className="text-[11px] font-bold text-gray-500 mt-1">{payment.party?._id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] block border-l-4 border-red-500 pl-4">Transaction Details</span>
                                <div className="bg-red-50/30 p-8 rounded-[32px] space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest opacity-60">Payment Mode</span>
                                        <span className="px-4 py-1.5 bg-white text-gray-900 rounded-full text-[11px] font-black uppercase tracking-widest border border-red-100 shadow-sm">{payment.paymentMode}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest opacity-60">Auth Status</span>
                                        <span className="flex items-center gap-2 text-green-600 text-[11px] font-black uppercase tracking-widest">
                                            <CheckCircle2 size={16} /> Verified
                                        </span>
                                    </div>
                                    <div className="pt-6 border-t border-red-100/50 flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">Net Amount Paid</span>
                                            <div className="text-4xl font-black text-gray-900 italic tracking-tighter mt-1">
                                                <span className="text-lg font-bold text-red-500 mr-1 not-italic">₹</span>
                                                {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {payment.notes && (
                            <div className="space-y-4">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] block border-l-4 border-gray-300 pl-4">Remarks / Internal Notes</span>
                                <div className="bg-gray-50/50 p-8 rounded-[32px] border border-dashed border-gray-200">
                                    <p className="text-gray-600 text-[13px] font-bold uppercase leading-relaxed italic">"{payment.notes}"</p>
                                </div>
                            </div>
                        )}

                        {/* Signature Section - Fixed for Print */}
                        <div className="pt-10 grid grid-cols-2 gap-20 break-inside-avoid">
                            <div className="text-center space-y-4">
                                <div className="h-px bg-gray-100 w-full" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Receiver's Signature</span>
                            </div>
                            <div className="text-center space-y-4">
                                <div className="h-px bg-gray-100 w-full" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Authorised Signatory</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { 
                        margin: 0; 
                        size: auto;
                    }
                    .no-print { display: none !important; }
                    body { 
                        background: white !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                    }
                    .printable-voucher { 
                        box-shadow: none !important; 
                        border: none !important;
                        margin: 0 !important;
                        padding: 1.5cm !important;
                        width: 100% !important;
                        min-height: 100vh !important;
                        page-break-inside: avoid;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}} />
        </DashboardLayout>
    );
};

export default ViewPaymentOut;
