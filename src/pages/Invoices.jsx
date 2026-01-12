import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Plus, Eye, Edit, FileText, CreditCard, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../lib/axios';
import useUserPermissions from '../hooks/useUserPermissions';

const Invoices = () => {
    const navigate = useNavigate();
    const { canCreate, canEdit, canView } = useUserPermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
  
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/invoices');
            const data = response.data.map(inv => ({
                ...inv,
                id: inv._id,
                partyName: inv.partyName || (inv.party ? inv.party.name : 'Unknown'),
                paidAmount: inv.amountReceived || 0,
                dueAmount: inv.balanceAmount || 0,
            }));
            setInvoices(data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            // Swal.fire('Error', 'Failed to fetch invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchInvoices();
    }, []);
  
    const getStatusBadge = (status) => {
      // Normalize status to lowercase for matching
      const s = (status || '').toLowerCase();
      
      const statusConfig = {
        draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
        partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial' },
        paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
        unpaid: { bg: 'bg-red-100', text: 'text-red-800', label: 'Unpaid' },
        overdue: { bg: 'bg-red-200', text: 'text-red-900', label: 'Overdue' }
      };
      
      const config = statusConfig[s] || statusConfig.draft;
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      );
    };

  const handleView = (id) => {
    navigate(`/view-invoice/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/edit-invoice/${id}`);
  };

  const handlePDF = (invoice) => {
    navigate(`/invoice-pdf/${invoice.id}`);
  };

  const handlePayment = (invoice) => {
    navigate(`/invoice-payment/${invoice.id}`);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Manage your sales invoices</p>
          </div>
          {canCreate && (
            <button
                onClick={() => navigate('/add-invoice')}
                className="w-full sm:w-auto bg-[#000000] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 font-medium cursor-pointer"
            >
                <Plus size={20} />
                Create Invoice
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by invoice number or party name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentInvoices.map((invoice, index) => (
                  <tr key={invoice.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{invoice.invoiceNo}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {new Date(invoice.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{invoice.partyName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      ₹{invoice.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                      ₹{invoice.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-red-600 font-medium">
                      ₹{invoice.dueAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canView && (
                            <button
                            onClick={() => handleView(invoice.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Invoice"
                            >
                            <Eye size={16} />
                            </button>
                        )}
                        {canEdit && (
                            <button
                            onClick={() => handleEdit(invoice.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Invoice"
                            >
                            <Edit size={16} />
                            </button>
                        )}
                        {canView && (
                            <button
                            onClick={() => handlePDF(invoice)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Download PDF"
                            >
                            <FileText size={16} />
                            </button>
                        )}
                        {canEdit && (
                            <button
                            onClick={() => handlePayment(invoice)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Record Payment"
                            >
                            <CreditCard size={16} />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first invoice.</p>
              {canCreate && (
                <button
                    onClick={() => navigate('/add-invoice')}
                    className="bg-[#000000] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                    <Plus size={20} />
                    Create Invoice
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredInvoices.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                          currentPage === page
                            ? 'bg-[#000000] text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;