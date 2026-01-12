import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Edit, User, Briefcase, Phone, Mail, MapPin, Calendar, Clock } from 'lucide-react';

const ViewEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Sample employee data
  const employee = {
    id: 1,
    name: 'John Doe',
    employeeId: 'EMP001',
    role: 'Admin',
    department: 'Management',
    mobile: '+91 9876543210',
    email: 'john@company.com',
    address: '123 Main Street, City, State - 123456',
    joiningDate: '2023-01-15',
    status: 'active',
    lastLogin: '2024-01-15 10:30 AM',
    avatar: 'JD'
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'Admin': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'Billing Executive': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Accountant': { bg: 'bg-green-100', text: 'text-green-800' },
      'Viewer': { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    
    const config = roleConfig[role] || roleConfig.Viewer;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {role}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Details</h1>
              <p className="text-gray-600 mt-1">{employee.employeeId}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/edit-employee/${id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit size={18} />
                Edit
              </button>
            </div>
          </div>

          {/* Employee Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                {employee.avatar}
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{employee.name}</h2>
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  {getRoleBadge(employee.role)}
                  {getStatusBadge(employee.status)}
                </div>
                <div className="text-gray-600">
                  <p className="flex items-center gap-2 mb-1">
                    <Briefcase size={16} />
                    {employee.department}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={16} />
                    Last Login: {employee.lastLogin}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-medium">{employee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee ID</label>
                  <p className="text-gray-900 font-medium">{employee.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Phone size={16} />
                    {employee.mobile}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Mail size={16} />
                    {employee.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900 font-medium flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5" />
                    {employee.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-green-600" />
                Job Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <div className="mt-1">
                    {getRoleBadge(employee.role)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-gray-900 font-medium">{employee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Joining Date</label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(employee.joiningDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(employee.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Login</label>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Clock size={16} />
                    {employee.lastLogin}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Role Permissions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-purple-600" />
              Role Permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.role === 'Admin' && (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Full system access
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    User management
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    All reports access
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    System configuration
                  </div>
                </>
              )}
              {employee.role === 'Billing Executive' && (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Invoice creation
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Party management
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Billing reports
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    No user management
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewEmployee;