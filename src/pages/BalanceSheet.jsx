import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  ArrowLeft, 
  Star, 
  Info, 
  FileSpreadsheet, 
  Plus,
  X,
  Calendar,
  IndianRupee,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import * as XLSX from 'xlsx';

const AddEntryModal = ({ isOpen, onClose, type, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            ...formData, 
            amount: parseFloat(formData.amount) || 0,
            type 
        });
        onClose();
        setFormData({ name: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Add {type}</h3>
                        <p className="text-sm text-gray-500">Create a new entry for your balance sheet</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entry Name</label>
                        <div className="relative">
                            <input 
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder={`e.g. New ${type}`}
                            />
                            <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <div className="relative">
                            <input 
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="0.00"
                            />
                            <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="relative">
                            <input 
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea 
                            rows="2"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Add any additional details..."
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                        >
                            Save Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BalanceSheet = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeType, setActiveType] = useState('');

  // Data State
  const [data, setData] = useState({
    assets: {
      currentAssets: {
        cashInHand: 0,
        cashInBank: 0,
        accountsReceivable: 0,
        inventory: 0,
        taxReceivable: 0,
        tcsReceivable: 0,
        tdsReceivable: 0,
        customEntries: []
      },
      fixedAssets: { total: 0, entries: [] },
      investments: { total: 0, entries: [] },
      loansAdvance: { total: 0, entries: [] }
    },
    liabilities: {
      capital: { total: 0, entries: [] },
      currentLiabilities: {
        accountsPayable: 0,
        taxPayable: 0,
        tcsPayable: 0,
        tdsPayable: 0,
        customEntries: []
      },
      loans: { total: 0, entries: [] },
      netIncome: 0
    }
  });

  // Calculate Totals Helpers
  const sumEntries = (entries) => entries.reduce((acc, curr) => acc + curr.amount, 0);

  const calculateTotalCurrentAssets = () => {
     const basic = Object.values(data.assets.currentAssets).reduce((a, b) => typeof b === 'number' ? a + b : a, 0);
     const custom = sumEntries(data.assets.currentAssets.customEntries || []);
     return basic + custom;
  };

  const calculateTotalCurrentLiabilities = () => {
      const basic = Object.values(data.liabilities.currentLiabilities).reduce((a, b) => typeof b === 'number' ? a + b : a, 0);
      const custom = sumEntries(data.liabilities.currentLiabilities.customEntries || []);
      return basic + custom;
  };

  // Totals
  const totalCurrentAssets = calculateTotalCurrentAssets();
  const totalFixedAssets = data.assets.fixedAssets.total + sumEntries(data.assets.fixedAssets.entries);
  const totalInvestments = data.assets.investments.total + sumEntries(data.assets.investments.entries);
  const totalLoansAdvance = data.assets.loansAdvance.total + sumEntries(data.assets.loansAdvance.entries);
  
  const totalAssets = totalCurrentAssets + totalFixedAssets + totalInvestments + totalLoansAdvance;

  const totalCurrentLiabilities = calculateTotalCurrentLiabilities();
  const totalCapital = data.liabilities.capital.total + sumEntries(data.liabilities.capital.entries);
  const totalLoans = data.liabilities.loans.total + sumEntries(data.liabilities.loans.entries);
  
  const totalLiabilities = totalCapital + totalCurrentLiabilities + totalLoans + data.liabilities.netIncome;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const dashboardRes = await api.get('/dashboard');
        const dashboardData = dashboardRes.data;

        setData(prev => ({
          ...prev,
          assets: {
            ...prev.assets,
            currentAssets: {
              ...prev.assets.currentAssets,
              cashInHand: dashboardData.currentBalance || 0,
              accountsReceivable: dashboardData.toCollect || 0,
            }
          },
          liabilities: {
            ...prev.liabilities,
            currentLiabilities: {
              ...prev.liabilities.currentLiabilities,
              accountsPayable: dashboardData.toPay || 0
            }
          }
        }));
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddEntry = (entry) => {
      setData(prev => {
          const newData = { ...prev };
          
          if (entry.type === 'Capital') {
              newData.liabilities.capital.entries.push(entry);
          } else if (entry.type === 'Loan (Liability)') {
              newData.liabilities.loans.entries.push(entry);
          } else if (entry.type === 'Fixed Asset') {
              newData.assets.fixedAssets.entries.push(entry);
          } else if (entry.type === 'Investment') {
              newData.assets.investments.entries.push(entry);
          } else if (entry.type === 'Loans Advance') {
              newData.assets.loansAdvance.entries.push(entry);
          } else if (entry.type === 'Net Income') {
              // Usually calculated
          }
          
          return newData;
      });
  };

  const openModal = (type) => {
      setActiveType(type);
      setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleExcelDownload = () => {
      // Prepare data into an Array of Arrays (AoA) for XLSX
      const wb = XLSX.utils.book_new();
      
      const headers = ['LIABILITIES', 'AMOUNT', '', 'ASSETS', 'AMOUNT'];
      const dataRows = [];
      dataRows.push(['Balance Sheet via Faizan Aquaculture']);
      dataRows.push(['As of ' + new Date().toLocaleDateString()]);
      dataRows.push([]); // Empty row
      dataRows.push(headers);

      // We need to zip Liabilities and Assets rows side by side
      // 1. Flatten Liabilities
      const liabList = [];
      liabList.push({ name: 'CAPITAL', amount: totalCapital, isHeader: true });
      data.liabilities.capital.entries.forEach(e => liabList.push({ name: `  ${e.name}`, amount: e.amount }));

      liabList.push({ name: 'CURRENT LIABILITY', amount: totalCurrentLiabilities, isHeader: true });
      liabList.push({ name: '  Tax Payable', amount: data.liabilities.currentLiabilities.taxPayable });
      liabList.push({ name: '  TCS Payable', amount: data.liabilities.currentLiabilities.tcsPayable });
      liabList.push({ name: '  TDS Payable', amount: data.liabilities.currentLiabilities.tdsPayable });
      liabList.push({ name: '  Accounts Payable', amount: data.liabilities.currentLiabilities.accountsPayable });
      // Add custom current liabilities if any logic supported it

      liabList.push({ name: 'LOANS', amount: totalLoans, isHeader: true });
      data.liabilities.loans.entries.forEach(e => liabList.push({ name: `  ${e.name}`, amount: e.amount }));

      liabList.push({ name: 'NET INCOME', amount: data.liabilities.netIncome, isHeader: true });

      // 2. Flatten Assets
      const assetList = [];
      assetList.push({ name: 'CURRENT ASSETS', amount: totalCurrentAssets, isHeader: true });
      assetList.push({ name: '  Tax Receivable', amount: data.assets.currentAssets.taxReceivable });
      assetList.push({ name: '  TCS Receivable', amount: data.assets.currentAssets.tcsReceivable });
      assetList.push({ name: '  TDS Receivable', amount: data.assets.currentAssets.tdsReceivable });
      assetList.push({ name: '  Cash In Hand', amount: data.assets.currentAssets.cashInHand });
      assetList.push({ name: '  Cash In Bank', amount: data.assets.currentAssets.cashInBank });
      assetList.push({ name: '  Accounts Receivable', amount: data.assets.currentAssets.accountsReceivable });
      assetList.push({ name: '  Inventory', amount: data.assets.currentAssets.inventory });

      assetList.push({ name: 'FIXED ASSETS', amount: totalFixedAssets, isHeader: true });
      data.assets.fixedAssets.entries.forEach(e => assetList.push({ name: `  ${e.name}`, amount: e.amount }));

      assetList.push({ name: 'INVESTMENTS', amount: totalInvestments, isHeader: true });
      data.assets.investments.entries.forEach(e => assetList.push({ name: `  ${e.name}`, amount: e.amount }));

      assetList.push({ name: 'LOANS ADVANCE', amount: totalLoansAdvance, isHeader: true });
      data.assets.loansAdvance.entries.forEach(e => assetList.push({ name: `  ${e.name}`, amount: e.amount }));

      // 3. Zip them
      const maxLength = Math.max(liabList.length, assetList.length);
      for (let i = 0; i < maxLength; i++) {
          const l = liabList[i] || { name: '', amount: '' };
          const a = assetList[i] || { name: '', amount: '' };
          dataRows.push([l.name, l.amount || '', '', a.name, a.amount || '']);
      }

      // Add Totals
      dataRows.push([]);
      dataRows.push(['TOTAL LIABILITIES', totalLiabilities, '', 'TOTAL ASSETS', totalAssets]);

      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      
      // Formatting adjustments (basic column widths)
      ws['!cols'] = [
          { wch: 30 }, // Liab Name
          { wch: 15 }, // Liab Amount
          { wch: 5 },  // Spacer
          { wch: 30 }, // Asset Name
          { wch: 15 }  // Asset Amount
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");
      XLSX.writeFile(wb, "Balance_Sheet.xlsx");
  };

  const SectionRow = ({ label, value, isHeader = false, showInfo = false, children, onAddEntry, customEntries = [] }) => (
    <div className={`border-b border-gray-100 last:border-0 ${isHeader ? 'bg-gray-50/50' : ''}`}>
      <div className={`flex justify-between items-center py-3 px-4 ${isHeader ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {showInfo && <Info size={14} className="text-gray-400 cursor-help" />}
        </div>
        <span className={isHeader ? 'text-gray-900' : 'text-gray-700'}>{formatCurrency(value)}</span>
      </div>
      
      <div className="pl-4">
          {children}
          {customEntries.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 px-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <span className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">{entry.name}</span>
                  <span className="text-sm text-gray-700">{formatCurrency(entry.amount)}</span>
              </div>
          ))}
      </div>

      {onAddEntry && (
        <div className="px-4 py-2 bg-white">
            <button 
                onClick={onAddEntry}
                className="text-blue-500 text-xs font-bold uppercase tracking-wide flex items-center gap-1 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded transition-all"
            >
                <Plus size={14} /> Add New Entry
            </button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen pb-12">
        <AddEntryModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            type={activeType}
            onSave={handleAddEntry}
        />

        {/* Header content same as before ... */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex flex-col gap-4 sticky top-16 z-10 shadow-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Balance Sheet <span className="text-gray-500 font-normal text-sm ml-2">(As of Today)</span></h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExcelDownload}
                        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                    >
                        <FileSpreadsheet size={16} className="text-green-600" />
                        Excel Download
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                        <Star size={20} />
                    </button>
                </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 px-4 py-2 rounded-lg flex justify-between items-center text-xs text-yellow-800">
                <span>Balance sheet is updated once per day. Last updated at: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}</span>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* Left Column: Liabilities */}
                <div className="border-r border-gray-200 flex flex-col">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Liabilities
                    </div>
                    
                    <div className="flex flex-col grow">
                         {/* Capital */}
                         <SectionRow 
                            label="Capital" 
                            value={totalCapital} 
                            showInfo 
                            isHeader 
                            onAddEntry={() => openModal('Capital')}
                            customEntries={data.liabilities.capital.entries}
                         />

                         {/* Current Liability */}
                         <SectionRow label="Current Liability" value={totalCurrentLiabilities} showInfo isHeader>
                            <SectionRow label="Tax Payable" value={data.liabilities.currentLiabilities.taxPayable} />
                            <SectionRow label="TCS Payable" value={data.liabilities.currentLiabilities.tcsPayable} />
                            <SectionRow label="TDS Payable" value={data.liabilities.currentLiabilities.tdsPayable} />
                            <SectionRow label="Account Payable" value={data.liabilities.currentLiabilities.accountsPayable} />
                         </SectionRow>
                         
                         {/* Loans */}
                         <SectionRow 
                            label="Loans" 
                            value={totalLoans} 
                            showInfo 
                            isHeader 
                            onAddEntry={() => openModal('Loan (Liability)')} 
                            customEntries={data.liabilities.loans.entries}
                        />

                         {/* Net Income */}
                         <SectionRow label="Net Income" value={data.liabilities.netIncome} showInfo isHeader />
                         
                         {/* Spacer to push total to bottom if needed, or just let it sit here */}
                         <div className="grow min-h-[50px]"></div>

                         {/* Total Labels */}
                         <div className="bg-gray-50 px-4 py-4 border-t border-gray-200 font-bold text-gray-900 flex justify-between items-center text-lg mt-auto">
                            <span>Total Liabilities</span>
                            <span>{formatCurrency(totalLiabilities)}</span>
                         </div>
                    </div>
                </div>

                {/* Right Column: Assets */}
                <div className="flex flex-col">
                     <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Assets
                    </div>
                    
                    <div className="flex flex-col grow">
                         {/* Current Assets */}
                         <SectionRow label="Current Assets" value={totalCurrentAssets} showInfo isHeader>
                            <SectionRow label="Tax Receivable" value={data.assets.currentAssets.taxReceivable} />
                            <SectionRow label="TCS Receivable" value={data.assets.currentAssets.tcsReceivable} />
                            <SectionRow label="TDS Receivable" value={data.assets.currentAssets.tdsReceivable} />
                            <SectionRow label="Cash In Hand" value={data.assets.currentAssets.cashInHand} />
                            <SectionRow label="Cash In Bank" value={data.assets.currentAssets.cashInBank} />
                            <SectionRow label="Accounts Receivables" value={data.assets.currentAssets.accountsReceivable} />
                            <SectionRow label="Inventory In Hand" value={data.assets.currentAssets.inventory} />
                         </SectionRow>

                         {/* Fixed Assets */}
                         <SectionRow 
                            label="Fixed Assets" 
                            value={totalFixedAssets} 
                            showInfo 
                            isHeader 
                            onAddEntry={() => openModal('Fixed Asset')} 
                            customEntries={data.assets.fixedAssets.entries}
                         />
                         
                         {/* Investments */}
                         <SectionRow 
                            label="Investments" 
                            value={totalInvestments} 
                            showInfo 
                            isHeader 
                            onAddEntry={() => openModal('Investment')} 
                            customEntries={data.assets.investments.entries}
                         />

                         {/* Loans Advance */}
                         <SectionRow 
                            label="Loans Advance" 
                            value={totalLoansAdvance} 
                            showInfo 
                            isHeader 
                            onAddEntry={() => openModal('Loans Advance')} 
                            customEntries={data.assets.loansAdvance.entries}
                         />
                         
                         {/* Spacer */}
                         <div className="grow min-h-[50px]"></div>

                         {/* Total Labels */}
                         <div className="bg-gray-50 px-4 py-4 border-t border-gray-200 font-bold text-gray-900 flex justify-between items-center text-lg mt-auto">
                            <span>Total Assets</span>
                            <span>{formatCurrency(totalAssets)}</span>
                         </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BalanceSheet;
