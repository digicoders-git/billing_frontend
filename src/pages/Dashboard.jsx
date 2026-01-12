import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import InvoiceStatusChart from '../components/dashboard/InvoiceStatusChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { RefreshCw, ArrowDown, ArrowUp, Landmark } from 'lucide-react';
import api from '../lib/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [stats, setStats] = useState({
    toCollect: 0,
    toPay: 0,
    currentBalance: 0
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState({
      income: { categories: [], data: [] },
      status: { paid: 0, pending: 0, overdue: 0 }
  });

  const fetchDashboardData = async () => {
      // setIsLoading(true); // Don't block UI with full loader on every refresh, handle gracefully
      try {
          const response = await api.get('/dashboard');
          const data = response.data;
          
          setStats({
              toCollect: data.toCollect,
              toPay: data.toPay,
              currentBalance: data.currentBalance
          });
          setRecentTransactions(data.recentTransactions);
          setChartData({
              income: data.incomeChart || { categories: [], data: [] },
              status: data.invoiceStatus || { paid: 0, pending: 0, overdue: 0 }
          });
          setLastUpdate(new Date());
      } catch (error) {
          console.error('Error fetching dashboard data:', error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchDashboardData();
  }, []);

  const handleRefresh = () => {
      setIsLoading(true);
      fetchDashboardData();
  };
  
return (
    <DashboardLayout>
        {/* Page Header - Business Overview */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6">
             <div>
                <h2 className="text-lg font-medium text-gray-800">Business Overview</h2>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="bg-gray-100 px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 flex items-center gap-2">
                    {isLoading && <span className="animate-pulse text-purple-600">Syncing...</span>}
                    <span>Last Update: {lastUpdate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    <button 
                        onClick={handleRefresh} 
                        disabled={isLoading}
                        className={`p-1 hover:bg-gray-200 rounded-full transition-all ${isLoading ? 'animate-spin text-purple-600' : 'hover:text-blue-500'}`}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
             </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard 
                title="To Collect" 
                amount={`₹ ${stats.toCollect.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
                icon={ArrowDown} 
                type="collect"
                onClick={() => navigate('/sales/invoices?status=Unpaid')}
            />
            <StatsCard 
                title="To Pay" 
                amount={`₹ ${stats.toPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                icon={ArrowUp} 
                type="pay"
                onClick={() => navigate('/purchase/invoices?status=Unpaid')}
            />
            <StatsCard 
                title="Total Cash + Bank Balance" 
                amount={`₹ ${stats.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
                icon={Landmark} 
                type="balance"
                onClick={() => navigate('/cash-bank')}
            />
        </div>

        {/* Main Content Grid (Transactions + Checklist) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Transactions */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                )}
                <RecentTransactions transactions={recentTransactions} />
            </div>

            {/* Right Column - Checklist */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Today's Checklist</h3>
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <div className="w-32 h-32 mb-6 opacity-80">
                         {/* Placeholder for the cone illustration */}
                        <div className="relative w-full h-full">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-orange-400" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M50 20 L20 80 L80 80 Z" className="fill-orange-100 stroke-orange-500" />
                                <path d="M30 80 L50 20 L70 80" className="stroke-orange-500" />
                                <path d="M35 60 L65 60" className="stroke-orange-500" />
                                <path d="M40 40 L60 40" className="stroke-orange-500" />
                            </svg>
                        </div>
                    </div>
                    <h4 className="text-xl font-medium text-gray-800 mb-2">Coming Soon...</h4>
                    <p className="text-gray-500 max-w-[200px]">Smarter daily checklist for overdue and follow-ups</p>
                </div>
            </div>
        </div>

        {/* Charts Row - Moved to Bottom */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative min-h-[300px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center"></div>
                )}
                <RevenueChart chartData={chartData.income} />
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative min-h-[300px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center"></div>
                )}
                <InvoiceStatusChart data={chartData.status} />
             </div>
        </div>
    </DashboardLayout>
  );
};

export default Dashboard;