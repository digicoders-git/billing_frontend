import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Building2, Wallet, CreditCard, Smartphone, Edit, TrendingUp, TrendingDown, Calendar, MapPin } from 'lucide-react';
import api from '../lib/axios';

const ViewAccount = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
        try {
            const { data } = await api.get(`/accounts/${id}`);
            // Mock transaction stats for now
            const mockStats = {
                totalTransactions: 0,
                totalDebit: 0,
                totalCredit: 0,
                thisMonth: 0
            };

            setAccountData({
                ...data,
                id: data._id,
                currentBalance: data.openingBalance, // This should be calculated w/ transactions later
                createdDate: data.createdAt,
                lastTransaction: data.updatedAt,
                bankDetails: data.type === 'Bank' ? {
                    bankName: data.bankName,
                    accountNumber: data.accountNumber,
                    ifsc: data.ifsc,
                    branch: data.branch
                } : null,
                transactions: mockStats
            });
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch account", error);
            navigate('/cash-bank');
        }
    };
    fetchAccount();
  }, [id, navigate]);

  if (loading || !accountData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading account details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'Cash': return 'bg-green-100 text-green-800';
      case 'Bank': return 'bg-blue-100 text-blue-800';
      case 'UPI': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Cash': return <Wallet className="w-5 h-5" />;
      case 'Bank': return <Building2 className="w-5 h-5" />;
      case 'UPI': return <Smartphone className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/cash-bank')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Account Details</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Complete information about {accountData.name}</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate(`/edit-account/${accountData.id}`)}
          className="bg-[#000000] text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
        >
          <Edit size={18} />
          <span className="hidden sm:inline">Edit Account</span>
        </button>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Basic Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-[#000000] flex items-center justify-center text-white">
              {getTypeIcon(accountData.type)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{accountData.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(accountData.type)}`}>
                  {getTypeIcon(accountData.type)}
                  {accountData.type}
                </span>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(accountData.status)}`}>
                  {accountData.status}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Account ID:</span>
              <span className="font-medium">#{accountData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">{new Date(accountData.createdDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Transaction:</span>
              <span className="font-medium">{new Date(accountData.lastTransaction).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Current Balance</h4>
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ₹{accountData.openingBalance.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mb-4">Available Balance</div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">₹{accountData.openingBalance.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Opening Balance</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold text-gray-600`}>
                  -
                </div>
                <div className="text-xs text-gray-500">Net Change</div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Stats Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Transactions</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{accountData.transactions.totalTransactions}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-100 rounded">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Credit</span>
              </div>
              <span className="text-lg font-bold text-green-600">₹{accountData.transactions.totalCredit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-red-100 rounded">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Debit</span>
              </div>
              <span className="text-lg font-bold text-red-600">₹{accountData.transactions.totalDebit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Basic Details */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                Basic Details
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Account Name</div>
                  <div className="font-medium">{accountData.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Account Type</div>
                  <div className="font-medium">{accountData.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Balance Type</div>
                  <div className="font-medium capitalize">{accountData.balanceType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(accountData.status)}`}>
                    {accountData.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {accountData.bankDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Bank Information</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-green-600" />
                  Bank Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Bank Name</div>
                    <div className="font-medium">{accountData.bankDetails.bankName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Account Number</div>
                    <div className="font-medium font-mono bg-gray-100 rounded px-2 py-1 inline-block">
                      {accountData.bankDetails.accountNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">IFSC Code</div>
                    <div className="font-medium font-mono bg-gray-100 rounded px-2 py-1 inline-block">
                      {accountData.bankDetails.ifsc}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Branch</div>
                    <div className="font-medium">{accountData.bankDetails.branch}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* For Cash/UPI accounts without bank details */}
        {!accountData.bankDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  {getTypeIcon(accountData.type)}
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">{accountData.type} Account</h4>
                <p className="text-gray-600 text-sm">
                  {accountData.type === 'Cash' 
                    ? 'This is a cash account for tracking physical cash transactions.'
                    : 'This is a digital wallet account for UPI transactions.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewAccount;