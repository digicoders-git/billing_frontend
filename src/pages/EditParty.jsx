import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, User, Phone, Building, CreditCard, MapPin, Mail, Save, FileText } from 'lucide-react';
import api from '../lib/axios';
import Swal from 'sweetalert2';

const EditParty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Customer',
    mobile: '',
    email: '',
    gstin: '',
    pan: '',
    companyName: '',
    category: '',
    billingAddress: '',
    placeOfSupply: '',
    openingBalance: 0,
    creditLimit: 0,
    balanceType: 'To Collect'
  });

  // Fetch data
  useEffect(() => {
    const fetchParty = async () => {
      try {
        const response = await api.get(`/parties/${id}`);
        // Map backend data to form state
        // Ensure fields exist to avoid uncontrolled input warnings
        const data = response.data;
        setFormData({
            name: data.name || '',
            type: data.type || 'Customer',
            mobile: data.mobile || '',
            email: data.email || '',
            gstin: data.gstin || '',
            pan: data.pan || '',
            companyName: data.companyName || '',
            category: data.category || '',
            billingAddress: data.billingAddress || data.address || '',
            placeOfSupply: data.placeOfSupply || '',
            openingBalance: data.openingBalance || data.balance || 0,
            creditLimit: data.creditLimit || 0,
            balanceType: data.balanceType || 'To Collect'
        });
      } catch (error) {
        console.error('Error fetching party details:', error);
        Swal.fire('Error', 'Failed to fetch party details', 'error');
        navigate('/parties');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
        fetchParty();
    }
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.put(`/parties/${id}`, formData);
        Swal.fire({
            title: 'Success!',
            text: 'Party updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        navigate('/parties');
    } catch (error) {
        console.error('Error updating party:', error);
        Swal.fire('Error', 'Failed to update party. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/parties')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Edit Party</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Update party information</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Party Information</h3>
          <p className="text-sm text-gray-600 mt-1">Update the details below to modify party information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6 sm:space-y-8">
            {/* Basic Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-blue-600 flex-shrink-0" />
                <span className="truncate">Basic Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter party name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                  >
                    <option value="">Select Category</option>
                    <option value="Pharma">Pharma</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone size={18} className="text-green-600 flex-shrink-0" />
                <span className="truncate">Contact Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="party@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Business Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building size={18} className="text-purple-600 flex-shrink-0" />
                <span className="truncate">Business Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="27AABCU9603R1ZX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="ABCDE1234F"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Balance
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="number"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({...formData, openingBalance: parseFloat(e.target.value) || 0})}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="0"
                    />
                    <select
                      value={formData.balanceType}
                      onChange={(e) => setFormData({...formData, balanceType: e.target.value})}
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                    >
                      <option value="To Collect">To Collect</option>
                      <option value="To Pay">To Pay</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-red-600 flex-shrink-0" />
                <span className="truncate">Address Information</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address
                  </label>
                  <textarea
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter billing address with city, state, and pincode"
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                    Place of Supply (State)
                  </label>
                  <select
                     value={formData.placeOfSupply}
                     onChange={(e) => setFormData({...formData, placeOfSupply: e.target.value})}
                     className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                  >
                        <option value="">Select State</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/parties')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-[#000000] text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save size={18} />
              Update Party
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditParty;