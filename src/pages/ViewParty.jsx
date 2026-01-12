import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, User, Phone, Building, CreditCard, MapPin, Mail, Edit, FileText } from 'lucide-react';
import api from '../lib/axios';

const ViewParty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [partyData, setPartyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParty = async () => {
      try {
        const response = await api.get(`/parties/${id}`);
        setPartyData(response.data);
      } catch (error) {
        console.error('Error fetching party details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
        fetchParty();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading party details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!partyData) {
      return (
        <DashboardLayout>
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-700">Party Not Found</h2>
                <button onClick={() => navigate('/parties')} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        </DashboardLayout>
      );
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'Customer': return 'bg-blue-100 text-blue-800';
      case 'Supplier': return 'bg-purple-100 text-purple-800';
      case 'Both': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    // Defaulting to Active if status field is missing, or use logic if backend provides it
    return 'bg-green-100 text-green-800'; 
  };
  
  // Helper to ensure balance matches UI expectations
  const balanceAmount = partyData.openingBalance || partyData.balance || 0;
  const balanceType = (partyData.balanceType || 'Collect').toLowerCase();

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/parties')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Party Details</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Complete information about {partyData.name}</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate(`/edit-party/${id}`)}
          className="bg-[#000000] text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
        >
          <Edit size={18} />
          <span className="hidden sm:inline">Edit Party</span>
        </button>
      </div>

      {/* Party Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Basic Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-[#000000] flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {partyData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{partyData.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(partyData.type)}`}>
                  {partyData.type}
                </span>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor('Active')}`}>
                  Active
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Party ID:</span>
              <span className="font-medium">#{partyData._id?.substring(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">{new Date(partyData.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category:</span>
              <span className="font-medium">{partyData.category || '-'}</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Current Balance</h4>
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              balanceType.includes('collect') ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{balanceAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 capitalize">
              {balanceType.includes('pay') ? 'Payable' : 'Receivable'}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Balance Type</div>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                balanceType.includes('collect') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {balanceType === 'to collect' ? 'To Collect' : 'To Pay'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Invoices</span>
              </div>
              <span className="text-lg font-bold text-blue-600">-</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-100 rounded">
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Credit Limit</span>
              </div>
              <span className="text-lg font-bold text-green-600">₹{partyData.creditLimit?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Business Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Contact & Business Information</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone size={16} className="text-green-600" />
                Contact Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Mobile Number</div>
                    <div className="font-medium">{partyData.mobile || '-'}</div>
                  </div>
                </div>
                {partyData.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Email Address</div>
                      <div className="font-medium">{partyData.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building size={16} className="text-purple-600" />
                Business Details
              </h4>
              <div className="space-y-3">
                {partyData.companyName && (
                  <div>
                    <div className="text-sm text-gray-500">Company Name</div>
                    <div className="font-medium">{partyData.companyName}</div>
                  </div>
                )}
                {partyData.gstin && (
                  <div>
                    <div className="text-sm text-gray-500">GSTIN</div>
                    <div className="font-medium font-mono bg-gray-100 rounded px-2 py-1 inline-block">{partyData.gstin}</div>
                  </div>
                )}
                {partyData.pan && (
                  <div>
                    <div className="text-sm text-gray-500">PAN Number</div>
                    <div className="font-medium font-mono bg-gray-100 rounded px-2 py-1 inline-block">{partyData.pan}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Billing Address */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-red-600" />
                Billing Address
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">{partyData.billingAddress || partyData.address || '-'}</p>
              </div>
            </div>

            {/* Place of Supply */}
             <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                Place of Supply
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">{partyData.placeOfSupply || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewParty;