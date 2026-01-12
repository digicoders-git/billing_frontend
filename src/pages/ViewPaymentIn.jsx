import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useReactToPrint } from 'react-to-print';
import { 
    ArrowLeft, Printer, Share2, 
    Download, Edit, Trash2, CheckCircle2,
    Calendar, User, Wallet, FileText
} from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const ViewPaymentIn = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const componentRef = useRef();

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Payment_Receipt_${id}`,
    });

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const response = await api.get(`/payments/${id}`);
                setPayment(response.data);
            } catch (error) {
                console.error('Error fetching payment:', error);
                Swal.fire('Error', 'Failed to load payment details', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPayment();
    }, [id]);

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
                await api.delete(`/payments/${id}`);
                await Swal.fire('Deleted!', 'Payment has been deleted.', 'success');
                navigate('/sales/payment-in');
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('Error', 'Failed to delete payment', 'error');
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!payment) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Payment Not Found</h2>
                    <button onClick={() => navigate('/sales/payment-in')} className="mt-4 text-blue-600 hover:underline">Go Back</button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/50 pb-20">
                {/* Action Toolbar */}
                <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/sales/payment-in')} 
                            className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-gray-500 hover:text-gray-800"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Receipt #{payment.receiptNo}</h1>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Received
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Created on {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
                        <button 
                            onClick={() => navigate(`/sales/payment-in/edit/${id}`)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit size={20} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button 
                            onClick={handleDelete}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={20} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button 
                            onClick={() => handlePrint()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95"
                        >
                            <Printer size={16} />
                            <span className="hidden sm:inline">Print Receipt</span>
                        </button>
                    </div>
                </div>

                {/* Receipt Preview */}
                <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
                    <div ref={componentRef} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-8 sm:p-12 print:shadow-none print:border-none print:w-full">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Payment Receipt</h2>
                                <p className="text-gray-500 mt-2 font-medium">Receipt No: <span className="text-gray-900 font-bold">#{payment.receiptNo}</span></p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-gray-900 tracking-tight">
                                    ₹ {payment.amount.toLocaleString()}
                                </div>
                                <p className="text-green-600 font-bold uppercase tracking-wider text-xs mt-1">Payment Received Successfully</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Received From</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">{payment.partyName}</p>
                                            {payment.party?.billingAddress && (
                                                <p className="text-sm text-gray-500 mt-0.5">{payment.party.billingAddress}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Payment Date</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                            <Calendar size={20} />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {new Date(payment.date).toLocaleDateString('en-IN', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Payment Mode</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                            <Wallet size={20} />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{payment.paymentMode}</p>
                                    </div>
                                </div>

                                {payment.notes && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Narration / Notes</label>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 italic text-gray-600 text-sm">
                                            "{payment.notes}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span>Authorized Signature not required for computer generated receipts</span>
                            </div>
                            <div className="text-xs text-gray-300 font-mono uppercase tracking-widest">
                                ID: {payment._id}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ViewPaymentIn;
