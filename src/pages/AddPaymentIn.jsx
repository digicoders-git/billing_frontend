import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    ArrowLeft, Settings, Keyboard, 
    ChevronDown, Calendar, Search, 
    X, HelpCircle, User, Wallet,
    History, Receipt, CircleDollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const AddPaymentIn = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        party: null,
        partyName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'Cash',
        paymentNo: '...',
        notes: ''
    });

    const [stats, setStats] = useState({
        collectedToday: 0,
        totalReceivables: 0,
        overdueCount: 0
    });

    const [showPartyDropdown, setShowPartyDropdown] = useState(false);
    const [parties, setParties] = useState([]);
    const [partySearch, setPartySearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [partiesRes, statsRes, nextIdsRes] = await Promise.all([
                    api.get('/parties'),
                    api.get('/payments/stats'),
                    api.get('/payments/next-receipt')
                ]);
                
                setParties(partiesRes.data);
                setStats(statsRes.data);
                setFormData(prev => ({ ...prev, paymentNo: nextIdsRes.data.nextNo }));
            } catch (error) {
                console.error("Failed to fetch data", error);
                Swal.fire('Error', 'Failed to load initial data', 'error');
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.party || !formData.amount) {
            Swal.fire('Error', 'Please select a Party and enter Amount', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                type: 'Payment In',
                receiptNo: formData.paymentNo,
                date: formData.date,
                party: formData.party._id,
                partyName: formData.party.name,
                amount: parseFloat(formData.amount),
                paymentMode: formData.mode,
                notes: formData.notes
            };

            await api.post('/payments', payload);
            
            await Swal.fire({
                title: 'Success!',
                text: 'Payment Received Recorded Successfully',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            navigate('/sales/payment-in');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to save payment', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[#FDFDFF] pb-20 font-sans">
                {/* Action Toolbar */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="group flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-gray-500 hover:text-gray-800"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Receive Payment</h1>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                                Entry Reference: <span className="text-gray-700 font-bold">#{formData.paymentNo}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto justify-end sm:justify-start">
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CircleDollarSign size={18} />
                            )}
                            <span>{loading ? 'Saving...' : 'Save Receipt'}</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-6">
                    {/* Stats Dashboard for Context */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"><Wallet size={24} /></div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Receivables</span>
                                <span className="text-lg font-black text-gray-900 italic truncate">₹ {(stats?.totalReceivables || 0).toLocaleString()}</span>
                            </div>
                         </div>
                         <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"><History size={24} /></div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Collected Today</span>
                                <span className="text-lg font-black text-indigo-600 italic truncate">₹ {(stats?.collectedToday || 0).toLocaleString()}</span>
                            </div>
                         </div>
                         <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"><Receipt size={24} /></div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Active Debtors</span>
                                <span className="text-lg font-black text-amber-600 italic truncate">{stats.overdueCount} Parties</span>
                            </div>
                         </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-12 relative group">
                        {/* Decorative Background Element */}
                        <div className="absolute bottom-0 right-0 w-80 h-80 bg-green-50/40 rounded-full blur-3xl -mb-40 -mr-40 group-hover:scale-110 transition-transform duration-1000" />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                            {/* Left Side: Party Selection */}
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Customer / Party Account</label>
                                    <div className="relative">
                                        <div 
                                            className="w-full h-16 flex justify-between items-center px-6 bg-gray-50 border border-transparent rounded-[22px] cursor-pointer hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all"
                                            onClick={() => setShowPartyDropdown(!showPartyDropdown)}
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm"><User size={20} /></div>
                                                <span className={cn("text-sm font-black uppercase tracking-tight truncate", formData.party ? "text-gray-900" : "text-gray-300")}>
                                                    {formData.party?.name || "Select Payer Account"}
                                                </span>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-gray-300 transition-transform duration-300", showPartyDropdown && "rotate-180")} />
                                        </div>

                                        {showPartyDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-50 lg:hidden bg-black/20 backdrop-blur-sm" onClick={() => setShowPartyDropdown(false)} />
                                                <div className="absolute top-full left-0 w-full mt-3 bg-white border border-gray-100 rounded-[32px] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                                                        <div className="relative group/search">
                                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors" />
                                                            <input 
                                                                type="text" 
                                                                className="w-full pl-11 pr-4 py-3.5 bg-white border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                                                placeholder="TYPE TO SEARCH CUSTOMER..."
                                                                autoFocus
                                                                value={partySearch}
                                                                onChange={(e) => setPartySearch(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-72 overflow-y-auto py-2 custom-scrollbar">
                                                        {parties.filter(p => !partySearch || p.name.toLowerCase().includes(partySearch.toLowerCase())).map(party => (
                                                            <div 
                                                                key={party._id}
                                                                className="px-7 py-4 hover:bg-indigo-50/50 cursor-pointer border-b border-gray-50 last:border-0 transition-all flex items-center justify-between group/item"
                                                                onClick={() => {
                                                                    setFormData({...formData, party: party, partyName: party.name});
                                                                    setShowPartyDropdown(false);
                                                                    setPartySearch('');
                                                                }}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <div className="font-black text-[13px] text-gray-800 uppercase tracking-tight group-hover/item:text-indigo-600 transition-colors italic">{party.name}</div>
                                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{party.billingAddress || 'No Location'}</div>
                                                                </div>
                                                                <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded">DUE: ₹ {party.openingBalance || 0}</div>
                                                            </div>
                                                        ))}
                                                        {parties.length === 0 && (
                                                             <div className="px-7 py-4 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No Parties Found</div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate('/add-party')}
                                                        className="w-full py-5 text-indigo-600 font-black text-[11px] uppercase tracking-[4px] bg-gray-50/50 hover:bg-indigo-50 hover:underline transition-all"
                                                    >
                                                        + Create New Party
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Entry Date</label>
                                        <div className="relative group/date">
                                            <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/date:text-indigo-500 transition-colors" />
                                            <input 
                                                type="date" 
                                                className="w-full h-16 pl-14 pr-4 bg-gray-50 border border-transparent rounded-[22px] text-[13px] font-black text-gray-700 hover:bg-white hover:shadow-md focus:bg-white focus:border-indigo-100 outline-none transition-all uppercase cursor-pointer italic"
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Payment Method</label>
                                        <div className="relative group/mode">
                                            <select 
                                                className="w-full h-16 pl-6 pr-12 bg-gray-50 border border-transparent rounded-[22px] text-[11px] font-black text-gray-700 appearance-none hover:bg-white hover:shadow-md focus:bg-white focus:border-indigo-100 outline-none transition-all uppercase tracking-[2px] cursor-pointer"
                                                value={formData.mode}
                                                onChange={(e) => setFormData({...formData, mode: e.target.value})}
                                            >
                                                <option value="Cash">Cash Receipt</option>
                                                <option value="Online">Online / UPI / QR</option>
                                                <option value="Cheque">Bank Cheque</option>
                                                <option value="NEFT">NEFT / RTGS</option>
                                            </select>
                                            <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none transition-colors group-focus-within/mode:text-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Amount & Notes */}
                            <div className="space-y-10 lg:pl-12 lg:border-l lg:border-gray-50">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] block text-center sm:text-left px-1">Receipt Amount (₹)</label>
                                    <div className="relative group/amount">
                                        <div className="absolute left-7 top-1/2 -translate-y-1/2 font-black text-2xl text-green-500 italic opacity-40 group-focus-within/amount:opacity-100 transition-opacity">₹</div>
                                        <input 
                                            type="number" 
                                            placeholder="0.00"
                                            className="w-full h-28 pl-14 pr-8 bg-green-50/30 border border-transparent rounded-[32px] text-5xl font-black text-gray-900 focus:bg-white focus:border-green-100 focus:shadow-2xl focus:shadow-green-500/10 transition-all outline-none italic"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end opacity-0 group-hover/amount:opacity-100 transition-opacity duration-500">
                                            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Receiving</span>
                                            <span className="text-[11px] font-black text-green-500 uppercase tracking-tight">CASH IN</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Narration / Internal Notes</label>
                                    <textarea 
                                        className="w-full h-24 px-7 py-5 bg-gray-50 border border-transparent rounded-[24px] text-[12px] font-bold text-gray-600 focus:bg-white focus:border-indigo-100 hover:bg-white hover:shadow-md outline-none transition-all resize-none italic"
                                        placeholder="Add private reference or transaction details..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Suggestions / Recent History Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-700">
                        <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between group cursor-pointer hover:border-indigo-100">
                           <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12"><HelpCircle size={20} /></div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transaction Guide</span>
                           </div>
                           <ChevronDown className="-rotate-90 text-gray-200 group-hover:text-indigo-400 transition-colors" size={20} />
                        </div>
                        <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between group cursor-pointer hover:border-indigo-100 text-gray-400">
                           <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg"><Keyboard size={20} /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest italic">ALT + S to Quick Save</span>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="mt-8 flex justify-center pb-12">
                     <div className="flex items-center gap-3 px-6 py-2 bg-white border border-gray-100 rounded-full shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[4px]">Financial Shield Active • Safe Transaction</span>
                     </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddPaymentIn;
