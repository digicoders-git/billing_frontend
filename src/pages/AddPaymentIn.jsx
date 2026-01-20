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
                                    <div 
                                        className="w-full h-16 flex items-center justify-between px-6 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-black/20 hover:shadow-lg transition-all group"
                                        onClick={() => setShowPartyDropdown(true)}
                                    >
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`p-2.5 rounded-xl transition-colors ${formData.party ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                <User size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={cn("text-sm font-black uppercase tracking-tight truncate transition-colors", formData.party ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600")}>
                                                    {formData.party?.name || "Select Payer Account"}
                                                </span>
                                                {formData.party && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{formData.party.billingAddress || 'Quick Entry'}</span>}
                                            </div>
                                        </div>
                                        <ChevronDown size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block px-1">Received On</label>
                                        <div className="relative group/date">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/date:text-black transition-colors"><Calendar size={18} /></div>
                                            <input 
                                                type="date" 
                                                className="w-full h-16 pl-14 pr-4 bg-white border border-gray-200 rounded-2xl text-[13px] font-black text-gray-900 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all uppercase cursor-pointer"
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] block px-1">Mode</label>
                                        <div className="relative group/mode">
                                            <select 
                                                className="w-full h-16 pl-6 pr-12 bg-white border border-gray-200 rounded-2xl text-[11px] font-black text-gray-900 appearance-none focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all uppercase tracking-wider cursor-pointer"
                                                value={formData.mode}
                                                onChange={(e) => setFormData({...formData, mode: e.target.value})}
                                            >
                                                <option value="Cash">Cash Payment</option>
                                                <option value="Online">Online / UPI</option>
                                                <option value="Cheque">Bank Cheque</option>
                                                <option value="NEFT">Bank Transfer (NEFT)</option>
                                            </select>
                                            <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within/mode:text-black" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Amount & Notes */}
                            <div className="space-y-10 lg:pl-12 lg:border-l lg:border-gray-50">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] block text-center sm:text-left px-1">Receipt Amount (₹)</label>
                                    <div className="relative group/amount">
                                        <div className="absolute left-7 top-1/2 -translate-y-1/2 font-black text-2xl text-gray-900 italic opacity-40 group-focus-within/amount:opacity-100 transition-opacity">₹</div>
                                        <input 
                                            type="number" 
                                            placeholder="0.00"
                                            className="w-full h-28 pl-14 pr-8 bg-white border border-gray-100 rounded-[32px] text-5xl font-black text-gray-900 focus:border-black focus:shadow-2xl focus:shadow-black/5 transition-all outline-none italic placeholder:text-gray-200"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end opacity-0 group-hover/amount:opacity-100 transition-opacity duration-500">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Receiving</span>
                                            <span className="text-[11px] font-black text-black uppercase tracking-tight">CASH IN</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] block px-1">Narration / Internal Notes</label>
                                    <textarea 
                                        className="w-full h-24 px-7 py-5 bg-white border border-gray-100 rounded-[24px] text-[12px] font-bold text-gray-900 focus:border-black hover:shadow-md outline-none transition-all resize-none italic placeholder:text-gray-300"
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
        {/* Party Selection Checkbox Modal */}
        {showPartyDropdown && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                <div 
                    className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                     {/* Modal Header */}
                     <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Select Payer</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Select account to receive payment from</p>
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
                                placeholder="Search customer by name..."
                                className="w-full pl-14 pr-5 py-4 bg-gray-50 font-bold border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-black transition-all placeholder:text-gray-400 text-sm"
                                autoFocus
                                value={partySearch}
                                onChange={(e) => setPartySearch(e.target.value)}
                            />
                        </div>
                     </div>

                     {/* List */}
                     <div className="max-h-[400px] overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                        {parties.filter(p => !partySearch || p.name.toLowerCase().includes(partySearch.toLowerCase())).map((party) => (
                            <div 
                                key={party._id}
                                onClick={() => {
                                    setFormData({...formData, party: party, partyName: party.name});
                                    setShowPartyDropdown(false);
                                    setPartySearch('');
                                }}
                                className="group p-4 rounded-2xl hover:bg-black/5 border border-transparent hover:border-black/5 cursor-pointer transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-black text-lg group-hover:bg-white group-hover:text-black group-hover:shadow-sm transition-all">
                                        {party.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight group-hover:underline decoration-2 underline-offset-2">{party.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{party.billingAddress || 'No Address'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Due</div>
                                    <div className="text-sm font-black text-red-500">₹ {(party.openingBalance || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                        {parties.length === 0 && (
                            <div className="py-8 text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No customers found</p>
                            </div>
                        )}
                        
                        <div 
                            onClick={() => navigate('/add-party')}
                            className="mt-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:border-black hover:bg-black/5 transition-all group"
                        >
                            <User size={18} className="text-gray-400 group-hover:text-black transition-colors" />
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-black transition-colors">Create New Customer</span>
                        </div>
                     </div>
                </div>
            </div>
        )}
        </DashboardLayout>
    );
};

export default AddPaymentIn;
