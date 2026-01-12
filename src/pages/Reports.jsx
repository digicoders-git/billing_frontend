import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Star, 
  FileText, 
  BarChart3, 
  ChevronDown,
  ChevronUp,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const ReportSection = ({ section, handleReportClick, getFilteredItems }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const filteredItems = getFilteredItems(section.items);
    const isSearchActive = filteredItems.length !== section.items.length;
    
    const visibleItems = isSearchActive || isExpanded || section.items.length <= 5 
        ? filteredItems 
        : filteredItems.slice(0, 5);
        
    const showToggleButton = !isSearchActive && section.items.length > 5;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                {section.icon}
                <h3 className="font-semibold text-gray-700">{section.title}</h3>
                {section.count !== undefined && (
                    <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                        {section.count}
                    </span>
                )}
            </div>
            <div className="p-2 grow flex flex-col">
                <ul className="space-y-1 grow">
                    {visibleItems.map((item, itemIdx) => (
                        <li 
                            key={itemIdx} 
                            onClick={() => handleReportClick(item.name, item.data)}
                            className="group flex justify-between items-center px-4 py-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        >
                            <div className="flex flex-col">
                                <span className="text-gray-700 font-medium group-hover:text-blue-700 text-sm">{item.name}</span>
                                {item.value !== undefined && (
                                    <span className="text-xs text-gray-500 mt-0.5">₹ {item.value.toLocaleString()}</span>
                                )}
                            </div>
                            {item.isFavourite && <Star className="text-yellow-400 fill-current" size={16} />}
                        </li>
                    ))}
                </ul>
                
                {showToggleButton && (
                    <div className="px-4 py-2 mt-2 border-t border-gray-50">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium gap-1"
                        >
                            {isExpanded ? (
                                <>See less <ChevronUp size={16} /></>
                            ) : (
                                <>See more <ChevronDown size={16} /></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Reports = () => {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    invoices: [],
    purchases: [],
    parties: [],
    items: [],
    payments: [],
    returns: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoicesRes, purchasesRes, partiesRes, itemsRes, paymentsRes, returnsRes] = await Promise.all([
          api.get('/invoices'),
          api.get('/purchases'),
          api.get('/parties'),
          api.get('/items'),
          api.get('/payments'),
          api.get('/returns')
        ]);

        setData({
          invoices: invoicesRes.data || [],
          purchases: purchasesRes.data || [],
          parties: partiesRes.data || [],
          items: itemsRes.data || [],
          payments: paymentsRes.data || [],
          returns: returnsRes.data || []
        });
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate dynamic report data
  const reportData = useMemo(() => {
    const totalSales = data.invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPurchases = data.purchases.reduce((sum, pur) => sum + (pur.totalAmount || 0), 0);
    const totalPayments = data.payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const profit = totalSales - totalPurchases;

    // Party-wise calculations
    const partyWiseData = data.parties.map(party => {
      const partySales = data.invoices
        .filter(inv => (inv.party?._id || inv.party) === party._id)
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      
      const partyPurchases = data.purchases
        .filter(pur => (pur.party?._id || pur.party) === party._id)
        .reduce((sum, pur) => sum + (pur.totalAmount || 0), 0);

      return {
        party,
        sales: partySales,
        purchases: partyPurchases,
        outstanding: partySales - partyPurchases
      };
    });

    // Item-wise calculations
    const itemWiseData = data.items.map(item => {
      const itemSales = data.invoices.reduce((sum, inv) => {
        const itemInInvoice = inv.items?.find(i => (i.itemId?._id || i.itemId) === item._id);
        return sum + (itemInInvoice ? itemInInvoice.amount : 0);
      }, 0);

      const itemPurchases = data.purchases.reduce((sum, pur) => {
        const itemInPurchase = pur.items?.find(i => (i.itemId?._id || i.itemId) === item._id);
        return sum + (itemInPurchase ? itemInPurchase.amount : 0);
      }, 0);

      const currentStock = item.openingStock || 0;

      return {
        item,
        sales: itemSales,
        purchases: itemPurchases,
        stock: currentStock,
        isLowStock: currentStock < (item.lowStockWarning || 10)
      };
    });

    return {
      totalSales,
      totalPurchases,
      totalPayments,
      profit,
      partyWiseData,
      itemWiseData,
      topCustomers: partyWiseData
        .filter(p => p.sales > 0)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5),
      topSuppliers: partyWiseData
        .filter(p => p.purchases > 0)
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 5),
      lowStockItems: itemWiseData.filter(i => i.isLowStock),
      topSellingItems: itemWiseData
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
    };
  }, [data]);

  const filters = [
    "All", "Party", "Item", "Transaction", "Summary", "GST", "Favourite"
  ];

  const reportSections = [
    {
      title: "Favourite",
      category: "Favourite",
      icon: <Star className="text-yellow-500" size={20} />,
      items: [
        { name: "Profit And Loss Report", isFavourite: true, value: reportData.profit },
        { name: "Sales Summary", isFavourite: true, value: reportData.totalSales },
        { name: "Purchase Summary", isFavourite: true, value: reportData.totalPurchases },
        { name: "Party Outstanding", isFavourite: true },
      ]
    },
    {
      title: "Summary Reports",
      category: "Summary",
      icon: <BarChart3 className="text-green-500" size={20} />,
      count: 4,
      items: [
        { name: "Profit And Loss Report", value: reportData.profit },
        { name: "Balance Sheet", value: reportData.totalSales - reportData.totalPurchases },
        { name: "Cash Flow Statement", value: reportData.totalPayments },
        { name: "Trial Balance" },
      ]
    },
    {
      title: "Sales Reports",
      category: "Transaction",
      icon: <TrendingUp className="text-blue-500" size={20} />,
      count: data.invoices.length,
      items: [
        { name: "Sales Summary", value: reportData.totalSales },
        { name: "Sales by Customer", data: reportData.topCustomers },
        { name: "Sales by Item", data: reportData.topSellingItems },
        { name: "Sales Invoice List", data: data.invoices },
        { name: "Bill Wise Profit" },
      ]
    },
    {
      title: "Purchase Reports",
      category: "Transaction",
      icon: <ShoppingCart className="text-indigo-500" size={20} />,
      count: data.purchases.length,
      items: [
        { name: "Purchase Summary", value: reportData.totalPurchases },
        { name: "Purchase by Supplier", data: reportData.topSuppliers },
        { name: "Purchase by Item" },
        { name: "Purchase Invoice List", data: data.purchases },
      ]
    },
    {
      title: "Party Reports",
      category: "Party",
      icon: <Users className="text-purple-500" size={20} />,
      count: data.parties.length,
      items: [
        { name: "Party Statement (Ledger)" },
        { name: "Party Wise Outstanding", data: reportData.partyWiseData },
        { name: "Receivable Ageing Report" },
        { name: "Party Report By Item" },
        { name: "Top Customers", data: reportData.topCustomers },
        { name: "Top Suppliers", data: reportData.topSuppliers },
      ]
    },
    {
      title: "Item/Stock Reports",
      category: "Item",
      icon: <Package className="text-orange-500" size={20} />,
      count: data.items.length,
      items: [
        { name: "Stock Summary", data: reportData.itemWiseData },
        { name: "Stock Detail Report" },
        { name: "Low Stock Summary", data: reportData.lowStockItems },
        { name: "Item Sales and Purchase Summary" },
        { name: "Item Report By Party" },
        { name: "Rate List" },
      ]
    },
    {
      title: "GST Reports",
      category: "GST",
      icon: <FileText className="text-red-500" size={20} />,
      items: [
        { name: "GSTR-1 (Sales)" },
        { name: "GSTR-2 (Purchase)" },
        { name: "GSTR-3B" },
        { name: "GST Sales (With HSN)" },
        { name: "GST Purchase (With HSN)" },
        { name: "HSN Wise Sales Summary" },
      ]
    },
    {
      title: "Payment Reports",
      category: "Transaction",
      icon: <DollarSign className="text-emerald-500" size={20} />,
      count: data.payments.length,
      items: [
        { name: "Cash and Bank Report", value: reportData.totalPayments },
        { name: "Payment In Summary" },
        { name: "Payment Out Summary" },
        { name: "Expense Transaction Report" },
      ]
    },
  ];

  const getFilteredItems = (items) => {
    if (!searchTerm) return items;
    return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const reportRoutes = {
    "Profit And Loss Report": "/reports/profit-loss",
    "Sales Summary": "/sales/invoices",
    "Purchase Summary": "/purchases/bills",
    "Party Statement (Ledger)": "/reports/party-ledger",
    "Balance Sheet": "/reports/balance-sheet",
    "GSTR-1 (Sales)": "/reports/gstr-1",
    "GSTR-2 (Purchase)": "/reports/gstr-2",
    "Stock Summary": "/items/inventory",
    "Low Stock Summary": "/reports/low-stock",
    "Party Wise Outstanding": "/reports/party-outstanding",
    "Cash and Bank Report": "/cash-bank",
    "Sales Invoice List": "/sales/invoices",
    "Purchase Invoice List": "/purchases/bills",
  };

  const handleReportClick = (reportName, reportData) => {
    const route = reportRoutes[reportName];
    if (route) {
      navigate(route, { state: { reportData } });
    } else {
      console.log(`Report: ${reportName}`, reportData);
      // You can show a modal or navigate to a dynamic report page
      navigate('/reports/dynamic', { state: { reportName, reportData } });
    }
  };

  const displayedSections = reportSections.filter(section => {
      if (filter === "All") return true;
      return section.title.includes(filter) || section.category === filter;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Loading Reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      
        {/* Header Stats */}
        <div className="bg-white border-b border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-black text-gray-900 mb-6">Business Reports</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-xs font-semibold text-blue-600 mb-1">Total Sales</div>
              <div className="text-2xl font-black text-blue-900">₹ {reportData.totalSales.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
              <div className="text-xs font-semibold text-indigo-600 mb-1">Total Purchases</div>
              <div className="text-2xl font-black text-indigo-900">₹ {reportData.totalPurchases.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="text-xs font-semibold text-green-600 mb-1">Profit</div>
              <div className="text-2xl font-black text-green-900">₹ {reportData.profit.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="text-xs font-semibold text-purple-600 mb-1">Total Payments</div>
              <div className="text-2xl font-black text-purple-900">₹ {reportData.totalPayments.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center gap-4 overflow-x-auto rounded-xl shadow-sm mb-6 scrollbar-hide">
          <span className="text-gray-500 font-medium whitespace-nowrap">Filter By</span>
          <div className="flex gap-3">
            {filters.map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  filter === f 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {displayedSections.map((section, idx) => (
                <ReportSection 
                    key={idx} 
                    section={section} 
                    handleReportClick={handleReportClick}
                    getFilteredItems={getFilteredItems}
                />
            ))}

            {displayedSections.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>No reports found for this category.</p>
                </div>
            )}

          </div>
        </div>

          {/* Floating Search/Action Bar */}
          <div className="fixed bottom-8 right-8 bg-white shadow-xl rounded-full px-6 py-3 border border-gray-200 flex items-center gap-3 z-10 transition-transform hover:scale-105">
              <span className="text-gray-500 text-sm font-medium">Find Report</span>
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md">
                  <input 
                      type="text" 
                      placeholder="Search..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all"
                  />
                  <span className="text-xs text-gray-400 font-mono border border-gray-300 rounded px-1">Ctrl + F</span>
              </div>
          </div>

      </div>
    </DashboardLayout>
  );
};

export default Reports;
