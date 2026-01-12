import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Settings, Keyboard, 
    ChevronDown, Calendar, Search, 
    X, HelpCircle, Truck, Wallet,
    History, Receipt, CheckCircle2,
    AlertCircle, Loader2, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const AddPaymentOut = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        party: '',
        partyName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'Bank Transfer',
        receiptNo: '',
        notes: '',
        type: 'Payment Out'
    });

    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingParties, setFetchingParties] = useState(false);
    const [showPartyDropdown, setShowPartyDropdown] = useState(false);
    const [searchParty, setSearchParty] = useState('');
    const [stats, setStats] = useState({ availableCash: 0, last30Days: 0, pendingBills: 0 });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setFetchingParties(true);
        try {
            // Fetch Parties (Vendors/Suppliers)
            const partyRes = await api.get('/parties');
            // Filter parties that are suppliers (if you have such differentiation, or just all)
            setParties(partyRes.data);

            // Fetch Next Receipt Number
            const receiptRes = await api.get('/payments/next-receipt?type=Payment Out');
            setFormData(prev => ({ ...prev, receiptNo: receiptRes.data.nextNo }));

            // Fetch Stats (Can be specific for Payment Out)
            const statsRes = await api.get('/payments/stats');
            setStats({
                availableCash: 1432900, // Placeholder
                last30Days: statsRes.data.todayOut || 0,
                pendingBills: statsRes.data.totalPayable || 0
            });
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setFetchingParties(false);
        }
    };

    const filteredParties = parties.filter(p => 
        p.name.toLowerCase().includes(searchParty.toLowerCase()) ||
        (p.phone && p.phone.includes(searchParty))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.party || !formData.amount) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Details',
                text: 'Please select a vendor and enter amount.',
                background: '#fff',
                confirmButtonColor: '#111827'
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/payments', formData);
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Payment recorded successfully',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff'
            });
            setTimeout(() => navigate('/purchases/payment-out'), 1500);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to record payment',
                confirmButtonColor: '#111827'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
                {/* Standard Sticky Header */}
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm mb-6 sticky top-0 z-20">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-sm sm:text-xl font-bold text-gray-800 truncate uppercase tracking-tight">New Payment Out</h1>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 sm:px-8 py-2 bg-black text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/20 transition-all uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {loading ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Summary & Stats */}
                        <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                             <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                <div className="p-3 bg-red-50 text-red-500 rounded-xl"><Wallet size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Available Cash</span>
                                    <span className="text-sm font-black text-gray-900 italic">₹ {(stats?.availableCash || 0).toLocaleString()}</span>
                                </div>
                             </div>
                             <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl"><History size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today's Paid</span>
                                    <span className="text-sm font-black text-gray-900 italic text-indigo-600">₹ {(stats?.last30Days || 0).toLocaleString()}</span>
                                </div>
                             </div>
                             <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                <div className="p-3 bg-green-50 text-green-500 rounded-xl"><Receipt size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Vendors</span>
                                    <span className="text-sm font-black text-gray-900 italic text-green-600">{parties.length} Accounts</span>
                                </div>
                             </div>
                        </div>

                        {/* Form Body */}
                        <div className="lg:col-span-12 space-y-6">
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden p-6 sm:p-12 relative group min-h-[500px]">
                                {/* Animated background element */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-50/20 to-transparent rounded-full blur-3xl -mr-64 -mt-64 group-hover:scale-110 transition-transform duration-1000" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                    {/* Left Column: Vendor Selection & Basic Details */}
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Supplier / Vendor Account</label>
                                                {formData.party && (
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 size={10} /> Selected
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative group/search">
                                                <div 
                                                    className={cn(
                                                        "w-full h-20 flex justify-between items-center px-8 bg-gray-50 border-2 border-transparent rounded-[24px] cursor-pointer hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/10 transition-all outline-none",
                                                        showPartyDropdown && "bg-white border-indigo-200 shadow-xl shadow-indigo-500/10"
                                                    )}
                                                    onClick={() => setShowPartyDropdown(!showPartyDropdown)}
                                                >
                                                    <div className="flex items-center gap-5 overflow-hidden">
                                                        <div className={cn("p-3 rounded-xl transition-all", formData.party ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white text-gray-300 shadow-sm")}>
                                                            <Truck size={24} />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className={cn("text-base font-black uppercase tracking-tight truncate", formData.partyName ? "text-gray-900" : "text-gray-300")}>
                                                                {formData.partyName || "CHOOSE VENDOR ACCOUNT"}
                                                            </span>
                                                            {formData.party && (
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-widest">Active Ledger linked</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={24} className={cn("text-gray-300 transition-transform duration-500 ml-4", showPartyDropdown && "rotate-180")} />
                                                </div>

                                                {showPartyDropdown && (
                                                    <>
                                                        <div className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-sm" onClick={() => setShowPartyDropdown(false)} />
                                                        <div className="absolute top-full left-0 w-full mt-4 bg-white border border-gray-100 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                                            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                                                                <div className="relative">
                                                                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                    <input 
                                                                        type="text" 
                                                                        className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl text-[13px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
                                                                        placeholder="SEARCH VENDOR BY NAME OR PHONE ..."
                                                                        autoFocus
                                                                        value={searchParty}
                                                                        onChange={(e) => setSearchParty(e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="max-h-80 overflow-y-auto py-3 custom-scrollbar">
                                                                {fetchingParties ? (
                                                                    <div className="py-20 flex flex-col items-center gap-4 text-gray-400">
                                                                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                                                                        <span className="text-[10px] font-black uppercase tracking-[4px]">Fetching Ledger...</span>
                                                                    </div>
                                                                ) : filteredParties.length === 0 ? (
                                                                    <div className="py-20 text-center text-gray-400">
                                                                        <span className="text-[10px] font-black uppercase tracking-[4px]">No Matching Accounts Found</span>
                                                                    </div>
                                                                ) : (
                                                                    filteredParties.map(party => (
                                                                        <div 
                                                                            key={party._id}
                                                                            className="px-8 py-5 hover:bg-indigo-50/50 cursor-pointer border-b border-gray-50 last:border-0 transition-all flex items-center justify-between group/item"
                                                                            onClick={() => {
                                                                                setFormData({
                                                                                    ...formData, 
                                                                                    party: party._id,
                                                                                    partyName: party.name
                                                                                });
                                                                                setShowPartyDropdown(false);
                                                                            }}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <div className="font-black text-[15px] text-gray-800 uppercase tracking-tight group-hover/item:text-indigo-600 transition-colors">{party.name}</div>
                                                                                <div className="flex items-center gap-2 mt-1">
                                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{party.city || 'Location N/A'}</span>
                                                                                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{party.phone}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-col items-end">
                                                                                <div className={cn(
                                                                                    "text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider",
                                                                                    party.balanceType === 'To Pay' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
                                                                                )}>
                                                                                    {party.balanceType === 'To Pay' ? 'Payable' : 'Receivable'}: ₹{party.openingBalance?.toLocaleString()}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                            <button 
                                                                onClick={() => navigate('/add-party')}
                                                                className="w-full py-6 text-indigo-600 font-black text-[12px] uppercase tracking-[4px] bg-gray-50/50 hover:bg-indigo-50 hover:underline transition-all flex items-center justify-center gap-3"
                                                            >
                                                                <Plus size={16} /> Link New Vendor Account
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Payment Date</label>
                                                <div className="relative group/date">
                                                    <Calendar size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/date:text-indigo-500 transition-colors" />
                                                    <input 
                                                        type="date" 
                                                        className="w-full h-16 pl-16 pr-6 bg-gray-50 border-2 border-transparent rounded-[20px] text-[14px] font-black text-gray-700 hover:bg-white hover:border-indigo-100 focus:bg-white focus:border-indigo-500 shadow-sm focus:shadow-xl transition-all uppercase cursor-pointer outline-none"
                                                        value={formData.date}
                                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Ref / Receipt ID</label>
                                                <div className="relative group/ref">
                                                    <Receipt size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/ref:text-indigo-500 transition-colors" />
                                                    <input 
                                                        type="text" 
                                                        readOnly
                                                        className="w-full h-16 pl-16 px-6 bg-gray-100 border-2 border-transparent rounded-[20px] text-[14px] font-black text-gray-400 cursor-not-allowed outline-none italic"
                                                        value={formData.receiptNo}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Amount & Payment Mode */}
                                    <div className="space-y-8 lg:border-l lg:border-gray-50 lg:pl-12">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px]">Transaction Amount</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase tracking-tighter animate-pulse">Cash Out</span>
                                                </div>
                                            </div>
                                            <div className="relative group/amount">
                                                <div className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-4xl text-red-500 italic opacity-50 group-focus-within/amount:opacity-100 transition-opacity">₹</div>
                                                <input 
                                                    type="number" 
                                                    placeholder="0.00"
                                                    className="w-full h-32 pl-16 pr-10 bg-red-50 border-2 border-transparent rounded-[32px] text-5xl font-black text-gray-900 focus:bg-white focus:border-red-500 focus:shadow-[0_20px_50px_rgba(239,68,68,0.15)] transition-all outline-none italic placeholder:text-red-200"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Payment Method</label>
                                                <div className="relative group/mode">
                                                    <select 
                                                        className="w-full h-16 pl-8 pr-12 bg-gray-50 border-2 border-transparent rounded-[20px] text-[13px] font-black text-gray-800 appearance-none hover:bg-white hover:border-indigo-100 focus:bg-white focus:border-indigo-500 shadow-sm focus:shadow-xl outline-none transition-all uppercase tracking-[2px] cursor-pointer"
                                                        value={formData.paymentMode}
                                                        onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                                                    >
                                                        <option value="Cash">Cash Handover</option>
                                                        <option value="Online">Online / UPI</option>
                                                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                                        <option value="Cheque">Bank Cheque</option>
                                                    </select>
                                                    <ChevronDown size={22} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within/mode:text-indigo-500 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Personal Notes</label>
                                                <textarea 
                                                    className="w-full h-16 px-8 py-5 bg-gray-50 border-2 border-transparent rounded-[20px] text-[12px] font-bold text-gray-600 focus:bg-white focus:border-indigo-500 shadow-sm focus:shadow-xl outline-none transition-all resize-none overflow-hidden placeholder:italic uppercase"
                                                    placeholder="REMARKS ..."
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Bottom Info Bar */}
                                <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-4 bg-gray-50/50 px-6 py-3 rounded-2xl border border-gray-100">
                                        <AlertCircle size={18} className="text-indigo-400" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                            Entries are recorded in real-time and affect company ledger.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-1 rounded-full bg-gray-100" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Security Badge */}
                    <div className="mt-12 flex flex-col items-center justify-center gap-6">
                         <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-gray-100 to-transparent" />
                        <div className="flex items-center gap-4 px-10 py-3 bg-white border border-gray-100 rounded-full shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all cursor-default group">
                            <div className="w-3 h-3 rounded-full bg-green-500 group-hover:scale-125 transition-transform" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[5px]">
                                P2P Encryption Active • <span className="text-gray-900 italic font-black">Secure Core</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="fixed bottom-8 left-8 hidden 2xl:flex flex-col gap-3 p-6 bg-white border border-gray-100 text-gray-900 rounded-[28px] shadow-2xl animate-in slide-in-from-left-10 fade-in duration-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-900 rounded-xl text-indigo-400 shadow-lg shadow-gray-200"><Keyboard size={24} /></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">System Shortcuts</span>
                            <span className="text-[13px] font-black text-gray-900 italic uppercase">ALT + ENTER to Post Entry</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddPaymentOut;
