import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Settings, Keyboard, 
    ChevronDown, Calendar, Search, 
    X, HelpCircle, Truck, Wallet,
    History, Receipt, CheckCircle2,
    AlertCircle, Loader2, Save
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const EditPaymentOut = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        party: '',
        partyName: '',
        amount: '',
        date: '',
        paymentMode: '',
        receiptNo: '',
        notes: '',
        type: 'Payment Out'
    });

    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [showPartyDropdown, setShowPartyDropdown] = useState(false);
    const [searchParty, setSearchParty] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        setFetchingData(true);
        try {
            const [partyRes, paymentRes] = await Promise.all([
                api.get('/parties'),
                api.get(`/payments/${id}`)
            ]);
            
            setParties(partyRes.data);
            
            const pay = paymentRes.data;
            setFormData({
                party: pay.party?._id || pay.party,
                partyName: pay.partyName || pay.party?.name,
                amount: pay.amount,
                date: new Date(pay.date).toISOString().split('T')[0],
                paymentMode: pay.paymentMode,
                receiptNo: pay.receiptNo,
                notes: pay.notes || '',
                type: 'Payment Out'
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'Failed to load transaction data', 'error');
            navigate('/purchases/payment-out');
        } finally {
            setFetchingData(false);
        }
    };

    const filteredParties = parties.filter(p => 
        p.name.toLowerCase().includes(searchParty.toLowerCase()) ||
        (p.phone && p.phone.includes(searchParty))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.party || !formData.amount) {
            Swal.fire('Error', 'Missing required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/payments/${id}`, formData);
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Transaction updated successfully',
                timer: 1500,
                showConfirmButton: false
            });
            setTimeout(() => navigate('/purchases/payment-out'), 1500);
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
                {/* Standard Sticky Header */}
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm mb-6 sticky top-0 z-20">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-sm sm:text-xl font-bold text-gray-800 truncate uppercase tracking-tight">Edit Payment Out</h1>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 sm:px-8 py-2 bg-black text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/20 transition-all uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {loading ? 'Update Payment' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="p-8 max-w-6xl mx-auto">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/30 rounded-full blur-3xl -mr-48 -mt-48" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                            {/* Left Side */}
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Vendor Account</label>
                                    <div className="relative">
                                        <div 
                                            className="w-full h-16 flex justify-between items-center px-6 bg-gray-50 border-2 border-transparent rounded-2xl cursor-pointer hover:bg-white hover:border-indigo-100 transition-all"
                                            onClick={() => setShowPartyDropdown(!showPartyDropdown)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Truck size={20} className="text-indigo-500" />
                                                <span className="text-sm font-black uppercase text-gray-900">{formData.partyName}</span>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-gray-300 transition-transform", showPartyDropdown && "rotate-180")} />
                                        </div>

                                        {showPartyDropdown && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 overflow-hidden">
                                                <div className="p-4 bg-gray-50">
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest outline-none border-none shadow-sm"
                                                        placeholder="SEARCH ..."
                                                        value={searchParty}
                                                        onChange={(e) => setSearchParty(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {filteredParties.map(p => (
                                                        <div 
                                                            key={p._id}
                                                            className="px-6 py-4 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 transition-all font-black text-[12px] uppercase text-gray-700"
                                                            onClick={() => {
                                                                setFormData({...formData, party: p._id, partyName: p.name});
                                                                setShowPartyDropdown(false);
                                                            }}
                                                        >
                                                            {p.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full h-16 px-6 bg-gray-50 border-2 border-transparent rounded-2xl text-[13px] font-black text-gray-700 hover:bg-white hover:border-indigo-100 focus:border-indigo-500 transition-all outline-none uppercase"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Receipt #</label>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            className="w-full h-16 px-6 bg-gray-100 border-2 border-transparent rounded-2xl text-[13px] font-black text-gray-400 italic outline-none"
                                            value={formData.receiptNo}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Side */}
                            <div className="space-y-8 lg:border-l lg:border-gray-50 lg:pl-12">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Amount Paid</label>
                                    <div className="relative">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-red-500 italic opacity-50">₹</span>
                                        <input 
                                            type="number" 
                                            className="w-full h-24 pl-16 pr-8 bg-red-50 border-2 border-transparent rounded-[24px] text-4xl font-black text-gray-900 focus:bg-white focus:border-red-500 transition-all outline-none italic"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Payment Mode</label>
                                    <select 
                                        className="w-full h-16 px-8 bg-gray-50 border-2 border-transparent rounded-2xl text-[12px] font-black text-gray-700 appearance-none hover:bg-white hover:border-indigo-100 outline-none transition-all uppercase tracking-widest cursor-pointer"
                                        value={formData.paymentMode}
                                        onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                                    >
                                        <option value="Cash">Cash Handover</option>
                                        <option value="Online">Online / UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Update Notes</label>
                                    <textarea 
                                        className="w-full h-20 px-8 py-5 bg-gray-50 border-2 border-transparent rounded-2xl text-[12px] font-bold text-gray-600 focus:bg-white focus:border-indigo-500 transition-all resize-none outline-none uppercase"
                                        placeholder="REMARKS ..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditPaymentOut;
