import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
    Plus, ArrowRightLeft, Download, Calendar, 
    Building2, X, TrendingUp, Wallet, Banknote, CreditCard, PiggyBank,
    Eye, Edit, Trash2
} from 'lucide-react';
import Pagination from '../components/shared/Pagination';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const CashBank = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);

  // Adjust Balance Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    accountId: '',
    type: 'add',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
        // Fetch Accounts
        const accRes = await api.get('/accounts');
        setAccounts(accRes.data);

        // Fetch Payments
        const response = await api.get('/payments');
        const data = response.data.map(p => ({
            ...p,
            id: p._id,
            date: new Date(p.date).toLocaleDateString('en-IN'),
            txnNo: p.receiptNo, 
            party: p.partyName,
            mode: p.paymentMode,
            received: p.type === 'Payment In' ? p.amount : 0,
            paid: p.type === 'Payment Out' ? p.amount : 0,
            balance: 0,
            branch: p.branch || 'Main Branch'
        }));
        
        setTransactions(data);

    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate Branch Revenue
  const branchRevenue = transactions.reduce((acc, txn) => {
      const branch = txn.branch || 'Main Branch';
      if (!acc[branch]) acc[branch] = 0;
      if (txn.type === 'Payment In') {
          acc[branch] += txn.amount;
      }
      return acc;
  }, {});
  
  const totalRevenue = Object.values(branchRevenue).reduce((sum, val) => sum + val, 0);

  // Initialize form with first account
  useEffect(() => {
    if (accounts.length > 0 && !adjustForm.accountId) {
      setAdjustForm(prev => ({ ...prev, accountId: accounts[0]?._id }));
    }
  }, [accounts]);

  const handleAdjustSubmit = async () => {
    const selectedAccount = accounts.find(a => a._id === adjustForm.accountId);
    if (!selectedAccount) return;

    let newBalance = selectedAccount.openingBalance;
    if (adjustForm.type === 'add') newBalance += parseFloat(adjustForm.amount);
    else newBalance -= parseFloat(adjustForm.amount);

    try {
        await api.put(`/accounts/${selectedAccount._id}`, { openingBalance: newBalance });
        Swal.fire('Success', 'Balance Adjusted', 'success');
        setShowAdjustModal(false);
        fetchData();
    } catch (e) {
        Swal.fire('Error', 'Failed to adjust balance', 'error');
    }
  };

  const handleDeleteAccount = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! History associated with this account might be affected.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000000',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/accounts/${id}`);
        Swal.fire(
          'Deleted!',
          'Account has been deleted.',
          'success'
        );
        fetchData();
      } catch (error) {
        Swal.fire(
          'Error!',
          'Failed to delete account.',
          'error'
        );
        console.error(error);
      }
    }
  };

  const filteredTransactions = transactions; 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
  );

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.openingBalance, 0);

  const downloadCSV = () => {
    const headers = ["DATE", "TYPE", "BRANCH", "TXN NO", "PARTY", "MODE", "PAID", "RECEIVED"];
    const rows = filteredTransactions.map(t => [
        t.date, t.type, t.branch, t.txnNo, t.party, t.mode, t.paid, t.received
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.body.appendChild(document.createElement("a"));
    link.href = encodedUri;
    link.download = "transactions.csv";
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      {/* Adjust Balance Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Adjust Balance</h3>
                    <button onClick={() => setShowAdjustModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Account</label>
                            <select value={adjustForm.accountId} onChange={(e) => setAdjustForm({...adjustForm, accountId: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600/20">
                                {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type</label>
                            <div className="flex gap-2">
                                <button onClick={() => setAdjustForm({...adjustForm, type: 'add'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${adjustForm.type === 'add' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 border-green-600' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>+ Add</button>
                                <button onClick={() => setAdjustForm({...adjustForm, type: 'reduce'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${adjustForm.type === 'reduce' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 border-red-600' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>- Reduce</button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">₹</span>
                            <input type="number" value={adjustForm.amount} onChange={(e) => setAdjustForm({...adjustForm, amount: e.target.value})} className="w-full pl-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600/20" placeholder="0" />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
                    <button onClick={() => setShowAdjustModal(false)} className="px-6 py-3 font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-gray-700">Cancel</button>
                    <button onClick={handleAdjustSubmit} className="px-10 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all">Confirm Adjustment</button>
                </div>
            </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Summary</h1>
            <p className="text-sm text-gray-500">Real-time assets and branch collections</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setShowAdjustModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm font-bold text-xs uppercase tracking-widest"
              >
                  <ArrowRightLeft size={14} />
                  Adjust
              </button>
              <button 
                onClick={() => navigate('/add-cash-bank')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#000000] text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-[#b4933d] transition-all font-bold text-xs uppercase tracking-widest"
              >
                  <Plus size={14} />
                  Add Account
              </button>
          </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#000000] rounded-2xl p-5 relative overflow-hidden shadow-xl shadow-indigo-600/10 group">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 opacity-80 mb-3">
                      <Wallet size={14} className="text-white" />
                      <p className="text-[10px] font-bold text-white uppercase tracking-widest text-nowrap">Net Portfolio</p>
                  </div>
                  <h3 className="text-2xl font-bold text-white tabular-nums italic">₹{totalBalance.toLocaleString()}</h3>
              </div>
              <Wallet size={80} className="absolute -bottom-4 -right-4 text-white/10 rotate-12 transition-transform group-hover:rotate-0 duration-500" />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <Banknote size={14} />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-nowrap">Cash Holdings</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tabular-nums italic">₹{accounts.filter(a => a.type === 'Cash').reduce((s, a) => s + a.openingBalance, 0).toLocaleString()}</h3>
              </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                          <TrendingUp size={14} />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-nowrap">Total Revenue</p>
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 tabular-nums italic">₹{totalRevenue.toLocaleString()}</h3>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
          
          {/* ACCOUNTS LIST TABLE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div>
                      <h2 className="text-base font-bold text-gray-900">Financial Accounts</h2>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Active Banks & Cash Drawers</p>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-gray-50/20">
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic">Account Info</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic">Type</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic">Bank Details</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic text-right">Current Balance</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {accounts.map((acc) => (
                              <tr key={acc._id} className="group hover:bg-indigo-50/30 transition-all duration-200">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${acc.type === 'Bank' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                              {acc.type === 'Bank' ? <CreditCard size={16} /> : <PiggyBank size={16} />}
                                          </div>
                                          <div>
                                              <p className="font-bold text-gray-900 text-sm">{acc.name}</p>
                                              <p className="text-[10px] text-gray-400 font-medium">Updated: {new Date(acc.updatedAt).toLocaleDateString()}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${acc.type === 'Bank' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {acc.type}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      {acc.type === 'Bank' ? (
                                          <div className="space-y-0.5">
                                              <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold text-gray-400 uppercase">Bank:</span>
                                                  <span className="text-xs font-medium text-gray-700">{acc.bankName}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold text-gray-400 uppercase">A/C:</span>
                                                  <span className="text-xs font-mono text-gray-600">{acc.accountNumber}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold text-gray-400 uppercase">IFSC:</span>
                                                  <span className="text-xs font-mono text-gray-600">{acc.ifsc}</span>
                                              </div>
                                          </div>
                                      ) : (
                                          <span className="text-xs text-gray-400 italic">-- Cash Drawer --</span>
                                      )}
                                  </td>
                                  <td className={`px-6 py-4 text-right font-bold text-sm tabular-nums italic ${acc.openingBalance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                      ₹{(acc.openingBalance || 0).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                                          <button 
                                            onClick={() => navigate(`/view-account/${acc._id}`)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="View Details"
                                          >
                                              <Eye size={16} />
                                          </button>
                                          <button 
                                            onClick={() => navigate(`/edit-account/${acc._id}`)}
                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Edit Account"
                                          >
                                              <Edit size={16} />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteAccount(acc._id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Account"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {accounts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm italic">
                                    No financial accounts added yet.
                                </td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* BRANCH REVENUE MATRIX TABLE - Showing Branch Wise Income */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div>
                      <h2 className="text-base font-bold text-gray-900">Branch Revenue Matrix</h2>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Income by Branch</p>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-gray-50/20">
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic">Branch Name</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic text-right">Revenue (Received)</th>
                              <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 italic">Contribution</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {Object.entries(branchRevenue).map(([branchName, revenue]) => (
                              <tr key={branchName} className="group hover:bg-indigo-50/30 transition-all duration-200">
                                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                                              <Building2 size={16} />
                                          </div>
                                          {branchName}
                                      </div>
                                  </td>
                                  <td className={`px-6 py-4 text-right font-bold text-sm tabular-nums italic text-green-600`}>
                                      ₹{revenue.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="w-24">
                                          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: totalRevenue > 0 ? `${(revenue/totalRevenue)*100}%` : '0%' }}></div>
                                          </div>
                                          <span className="text-[9px] text-gray-400">{totalRevenue > 0 ? Math.round((revenue/totalRevenue)*100) : 0}%</span>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {Object.keys(branchRevenue).length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-gray-400 text-sm italic">
                                    No transactions recorded yet.
                                </td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* TRANSACTIONS SECTION */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap justify-between items-center bg-gray-50/50 gap-4">
                  <div className="flex gap-4">
                      <button className="text-xs font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1 uppercase tracking-widest">Recent Transactions</button>
                  </div>
                  <div className="flex gap-2">
                       <button onClick={downloadCSV} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 shadow-sm"><Download size={14} /></button>
                  </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50/20">
                          <tr>
                              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Date</th>
                              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Log Entry</th>
                              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic">Branch</th>
                              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">In/Out</th>
                              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 italic text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {currentTransactions.map((txn) => (
                              <tr key={txn.id} className="hover:bg-gray-50/30 transition-colors">
                                  <td className="px-6 py-3 text-[11px] font-medium text-gray-500">{txn.date}</td>
                                  <td className="px-6 py-3">
                                      <p className="text-xs font-bold text-indigo-600">#{txn.txnNo}</p>
                                      <p className="text-[10px] text-gray-400 font-medium truncate w-24 sm:w-32">{txn.party}</p>
                                  </td>
                                  <td className="px-6 py-3">
                                      <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-lg text-[9px] font-bold uppercase tracking-tight">{txn.branch}</span>
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                     <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tight ${txn.type === 'Payment In' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{txn.type}</span>
                                  </td>
                                  <td className="px-6 py-3 text-right font-bold text-sm text-gray-900 tabular-nums italic">₹{txn.amount.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
               
              <div className="p-4 border-t border-gray-50">
                  <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      totalItems={filteredTransactions.length}
                      onPageChange={setCurrentPage}
                  />
              </div>
          </div>
      </div>
    </DashboardLayout>
  );
};

export default CashBank;