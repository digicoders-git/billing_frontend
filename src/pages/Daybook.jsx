import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  ArrowLeft,
  Star,
  ChevronDown,
  Download,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import * as XLSX from 'xlsx';

const Daybook = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [staffList, setStaffList] = useState(['All Staff']);
  const [filters, setFilters] = useState({
    staff: 'All Staff',
    period: 'This Week',
    type: 'All Transactions',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [invoicesRes, expensesRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/expenses')
      ]);

      const allTransactions = [
        // Sales Invoices
        ...(invoicesRes.data || []).map(inv => ({
          id: inv._id,
          date: new Date(inv.date),
          partyName: inv.partyName || (inv.party?.name) || 'N/A',
          transactionType: 'Sales Invoices',
          transactionNo: inv.invoiceNo,
          totalAmount: inv.totalAmount || 0,
          moneyIn: inv.amountReceived || 0,
          moneyOut: 0,
          balanceAmount: inv.balanceAmount || 0,
          createdBy: inv.createdBy || 'Admin'
        })),
        
        // Expenses (Payment Out)
        ...(expensesRes.data || []).map(exp => ({
          id: exp._id,
          date: new Date(exp.date),
          partyName: exp.partyName || 'Cash Expense',
          transactionType: 'Payment Out',
          transactionNo: exp.expenseNumber,
          totalAmount: exp.totalAmount || 0,
          moneyIn: 0,
          moneyOut: exp.totalAmount || 0,
          balanceAmount: 0,
          createdBy: exp.createdBy || 'Admin'
        }))
      ];

      // Sort by date (newest first)
      allTransactions.sort((a, b) => b.date - a.date);

      // Extract unique staff names for filter
      const uniqueStaff = ['All Staff', ...new Set(allTransactions.map(t => t.createdBy).filter(Boolean))];
      setStaffList(uniqueStaff);

      setTransactions(allTransactions);
      
      console.log('Daybook Data Loaded:', {
        totalTransactions: allTransactions.length,
        invoices: invoicesRes.data?.length || 0,
        expenses: expensesRes.data?.length || 0,
        uniqueStaff: uniqueStaff
      });
    } catch (error) {
      console.error('Error fetching daybook data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Period Filter
    const now = new Date();
    if (filters.period === 'This Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => t.date >= weekAgo);
    } else if (filters.period === 'This Month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(t => t.date >= monthAgo);
    } else if (filters.period === 'This Year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(t => t.date >= yearStart);
    } else if (filters.period === 'Custom Range' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => t.date >= start && t.date <= end);
    }
    // 'All Time' shows everything

    // Transaction Type Filter
    if (filters.type !== 'All Transactions') {
      filtered = filtered.filter(t => t.transactionType === filters.type);
    }

    // Staff Filter
    if (filters.staff !== 'All Staff') {
      filtered = filtered.filter(t => t.createdBy === filters.staff);
    }

    return filtered;
  }, [transactions, filters]);

  const netAmount = useMemo(() => {
    const totalIn = filteredTransactions.reduce((sum, t) => sum + t.moneyIn, 0);
    const totalOut = filteredTransactions.reduce((sum, t) => sum + t.moneyOut, 0);
    return totalIn - totalOut;
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  const handleRowClick = (transaction) => {
    // Navigate to appropriate print page based on transaction type
    if (transaction.transactionType === 'Sales Invoices') {
      // Navigate to Invoice Print page
      navigate(`/invoice-pdf/${transaction.id}`);
    } else if (transaction.transactionType === 'Payment Out') {
      // Navigate to Expense Print page
      navigate(`/expenses/print/${transaction.id}`);
    }
  };

  const handleDownloadExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredTransactions.map(transaction => ({
        'Date': transaction.date.toLocaleDateString('en-GB'),
        'Party Name': transaction.partyName,
        'Transaction Type': transaction.transactionType,
        'Transaction No.': transaction.transactionNo,
        'Total Amount': transaction.totalAmount,
        'Money In': transaction.moneyIn || 0,
        'Money Out': transaction.moneyOut || 0,
        'Balance Amount': transaction.balanceAmount || 0,
        'Created By': transaction.createdBy
      }));

      // Add summary row
      const totalIn = filteredTransactions.reduce((sum, t) => sum + t.moneyIn, 0);
      const totalOut = filteredTransactions.reduce((sum, t) => sum + t.moneyOut, 0);
      
      excelData.push({
        'Date': '',
        'Party Name': '',
        'Transaction Type': '',
        'Transaction No.': 'TOTAL',
        'Total Amount': filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
        'Money In': totalIn,
        'Money Out': totalOut,
        'Balance Amount': '',
        'Created By': ''
      });

      excelData.push({
        'Date': '',
        'Party Name': '',
        'Transaction Type': '',
        'Transaction No.': 'NET AMOUNT',
        'Total Amount': netAmount,
        'Money In': '',
        'Money Out': '',
        'Balance Amount': '',
        'Created By': ''
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: 25 }, // Party Name
        { wch: 18 }, // Transaction Type
        { wch: 15 }, // Transaction No
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Money In
        { wch: 15 }, // Money Out
        { wch: 15 }, // Balance Amount
        { wch: 15 }  // Created By
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daybook');

      // Generate filename with date
      const filename = `Daybook_${filters.period.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      console.log('Excel downloaded:', filename);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Error downloading Excel file. Please try again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading Daybook...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header - Hidden on Print */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 no-print">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Daybook</h1>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Star size={18} className="text-gray-400" />
            </button>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Favourite</span>
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Staff Filter - Dynamic */}
              <div className="relative">
                <select
                  value={filters.staff}
                  onChange={(e) => setFilters({...filters, staff: e.target.value})}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:border-blue-500"
                >
                  {staffList.map((staff, index) => (
                    <option key={index} value={staff}>{staff}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              {/* Period Filter */}
              <div className="relative">
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({...filters, period: e.target.value})}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:border-blue-500"
                >
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Year</option>
                  <option>All Time</option>
                  <option>Custom Range</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              {/* Custom Date Range Inputs */}
              {filters.period === 'Custom Range' && (
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 animate-fade-in shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">From</span>
                    <input 
                      type="date" 
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      className="text-xs font-medium outline-none bg-transparent"
                    />
                  </div>
                  <div className="w-px h-6 bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">To</span>
                    <input 
                      type="date" 
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      className="text-xs font-medium outline-none bg-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:border-blue-500"
                >
                  <option>All Transactions</option>
                  <option>Sales Invoices</option>
                  <option>Payment Out</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                Download Excel
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <Printer size={16} />
                Print PDF
              </button>
            </div>
          </div>
        </div>

        {/* Net Amount - Hidden on Print */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 no-print">
          <div className="text-sm text-gray-600">
            Net Amount: <span className="font-bold text-gray-900">₹ {netAmount.toLocaleString()}</span>
            <span className="ml-4 text-xs text-gray-500">
              ({filteredTransactions.length} transactions)
            </span>
          </div>
        </div>

        {/* Print Header - Only Visible on Print */}
        <div className="print-only hidden">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Daybook Report</h1>
            <p className="text-sm text-gray-600">
              Period: {filters.period === 'Custom Range' ? `${filters.startDate} to ${filters.endDate}` : filters.period} | Type: {filters.type} | Staff: {filters.staff}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Net Amount: <span className="font-bold">₹ {netAmount.toLocaleString()}</span> | 
              Total Transactions: {filteredTransactions.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Generated on: {new Date().toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="p-6 print:p-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden print:border-0 print:rounded-none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DATE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PARTY NAME</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TRANSACTION TYPE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TRANSACTION NO.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">TOTAL AMOUNT</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">MONEY IN</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">MONEY OUT</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">BALANCE AMOUNT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CREATED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      onClick={() => handleRowClick(transaction)}
                      className="hover:bg-gray-50 print:hover:bg-white cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {transaction.date.toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 uppercase">
                        {transaction.partyName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {transaction.transactionType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {transaction.transactionNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ₹ {transaction.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {transaction.moneyIn > 0 ? `₹ ${transaction.moneyIn.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {transaction.moneyOut > 0 ? `₹ ${transaction.moneyOut.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {transaction.balanceAmount > 0 ? `₹ ${transaction.balanceAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {transaction.createdBy}
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        No transactions found for selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            /* Hide everything except table */
            .no-print, .no-print * {
              display: none !important;
            }

            /* Show print header */
            .print-only {
              display: block !important;
            }

            /* Reset page styles */
            body, html, #root {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              width: 100% !important;
              overflow: visible !important;
            }

            /* Hide sidebar and navigation */
            aside, nav, header, footer {
              display: none !important;
            }

            /* Main content full width */
            main {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              overflow: visible !important;
              display: block !important;
            }
            
            /* Target the specific page containers */
            .min-h-screen {
                 min-height: 0 !important;
                 height: auto !important;
                 overflow: visible !important;
                 background: white !important;
            }

            /* Table styles for print */
            table {
              page-break-inside: auto;
              border-collapse: collapse;
              width: 100%;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            /* Ensure table header repeats if needed, though browsers verify support varies */
            thead {
              display: table-header-group;
            }
            
            /* Hide Scrollbars - The Key Fix */
            ::-webkit-scrollbar {
                display: none !important;
                width: 0px;
                background: transparent;
            }
            * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }

            /* Page setup */
            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            /* Remove shadows, borders, and rounding */
            .bg-white, .rounded-lg, .border {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
            }
            
            /* Explicitly reset overflow for the table container */
            .overflow-x-auto, .overflow-hidden {
                overflow: visible !important;
            }
            
            /* Adjust padding for the content area */
            .p-6 {
                padding: 0 !important;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default Daybook;
