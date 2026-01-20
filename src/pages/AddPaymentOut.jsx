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
        utrNumber: '', // UTR/Transaction Reference Number
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
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                            <div className="relative">
                                                <div 
                                                    className="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-black/20 hover:shadow-lg transition-all group"
                                                    onClick={() => setShowPartyDropdown(true)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("p-2.5 rounded-xl transition-colors", formData.party ? "bg-black text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200")}>
                                                            <Truck size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-sm font-bold uppercase tracking-tight truncate", formData.partyName ? "text-gray-900" : "text-gray-400")}>
                                                                {formData.partyName || "Select Vendor"}
                                                            </span>
                                                            {formData.party && (
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Vendor selected</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={20} className={cn("text-gray-300 transition-transform group-hover:text-black", showPartyDropdown && "rotate-180")} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase block">Payment Date</label>
                                                <div className="relative">
                                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input 
                                                        type="date" 
                                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-indigo-300 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                        value={formData.date}
                                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase block">Receipt ID</label>
                                                <div className="relative">
                                                    <Receipt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input 
                                                        type="text" 
                                                        readOnly
                                                        className="w-full h-12 pl-11 pr-4 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                                                        value={formData.receiptNo}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Amount & Payment Mode */}
                                    <div className="space-y-6 lg:border-l lg:border-gray-50 lg:pl-12">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-gray-600 uppercase">Amount</label>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">Payment Out</span>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-2xl text-gray-900">₹</div>
                                                <input 
                                                    type="number" 
                                                    placeholder="0.00"
                                                    className="w-full h-20 pl-12 pr-6 bg-white border-2 border-gray-100 rounded-xl text-3xl font-bold text-gray-900 focus:border-black focus:shadow-lg focus:shadow-black/5 outline-none transition-all placeholder:text-gray-200"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                                />
                                            </div>
                                        </div>


                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase block">Payment Method</label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full h-12 pl-4 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 appearance-none hover:bg-white hover:border-black/20 focus:bg-white focus:border-black outline-none transition-all cursor-pointer"
                                                        value={formData.paymentMode}
                                                        onChange={(e) => setFormData({...formData, paymentMode: e.target.value, utrNumber: ''})}
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="Online">Online / UPI</option>
                                                        <option value="Bank Transfer">Bank Transfer</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase block">Notes</label>
                                                <textarea 
                                                    className="w-full h-12 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:bg-white focus:border-black outline-none transition-all resize-none placeholder:text-gray-400"
                                                    placeholder="Add remarks..."
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        {/* UTR Number Field - Shows only for Online/UPI or Bank Transfer */}
                                        {(formData.paymentMode === 'Online' || formData.paymentMode === 'Bank Transfer') && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="text-xs font-bold text-indigo-600 uppercase block flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    UTR / Transaction Reference
                                                </label>
                                                <div className="relative">
                                                    <Receipt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                                                    <input 
                                                        type="text" 
                                                        className="w-full h-12 pl-11 pr-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-medium text-gray-800 hover:bg-white hover:border-indigo-400 focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-300"
                                                        placeholder="Enter UTR number..."
                                                        value={formData.utrNumber}
                                                        onChange={(e) => setFormData({...formData, utrNumber: e.target.value})}
                                                    />
                                                </div>
                                                <p className="text-xs text-indigo-500 flex items-center gap-1">
                                                    <HelpCircle size={12} />
                                                    Transaction reference for {formData.paymentMode}
                                                </p>
                                            </div>
                                        )}
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

            {/* Vendor Selection Modal */}
            {showPartyDropdown && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div 
                        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                         {/* Modal Header */}
                         <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Select Vendor</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Select account to make payment to</p>
                            </div>
                            <div 
                                onClick={() => setShowPartyDropdown(false)}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 flex items-center justify-center cursor-pointer transition-all shadow-sm active:scale-95"
                            >
                                <X size={20} />
                            </div>
                         </div>

                         {/* Search Bar */}
                         <div className="p-6 pb-2">
                            <div className="relative group/search">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-black transition-colors" size={20} />
                                <input 
                                    type="text"
                                    placeholder="Search vendor by name..."
                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 font-bold border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-black transition-all placeholder:text-gray-400 text-sm"
                                    autoFocus
                                    value={searchParty}
                                    onChange={(e) => setSearchParty(e.target.value)}
                                />
                            </div>
                         </div>

                         {/* List */}
                         <div className="max-h-[400px] overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                            {fetchingParties ? (
                                <div className="py-12 flex flex-col items-center gap-4 text-gray-400">
                                    <Loader2 size={32} className="animate-spin text-black" />
                                    <span className="text-[10px] font-black uppercase tracking-[4px]">Loading...</span>
                                </div>
                            ) : filteredParties.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No matching vendors found</p>
                                </div>
                            ) : (
                                filteredParties.map(party => (
                                    <div 
                                        key={party._id}
                                        onClick={() => {
                                            setFormData({
                                                ...formData, 
                                                party: party._id,
                                                partyName: party.name
                                            });
                                            setShowPartyDropdown(false);
                                            setSearchParty('');
                                        }}
                                        className="group p-4 rounded-2xl hover:bg-black/5 border border-transparent hover:border-black/5 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-black text-lg group-hover:bg-white group-hover:text-black group-hover:shadow-sm transition-all">
                                                {party.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight group-hover:underline decoration-2 underline-offset-2">{party.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{party.city || 'No Location'} • {party.phone || 'No Phone'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Payable</div>
                                            <div className="text-sm font-black text-red-500">₹ {(party.openingBalance || 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            <div 
                                onClick={() => navigate('/add-party')}
                                className="mt-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:border-black hover:bg-black/5 transition-all group"
                            >
                                <Plus size={18} className="text-gray-400 group-hover:text-black transition-colors" />
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-black transition-colors">Link New Vendor</span>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AddPaymentOut;
