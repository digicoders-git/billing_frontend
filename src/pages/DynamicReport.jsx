import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react';

const DynamicReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportName, reportData } = location.state || {};

  if (!reportName) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Report Selected</h2>
            <p className="text-gray-500 mb-6">Please select a report from the reports page.</p>
            <button
              onClick={() => navigate('/reports')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
            >
              Go to Reports
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement CSV/PDF download logic
    console.log('Downloading report:', reportName);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 no-print">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{reportName}</h1>
                <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {reportData && Array.isArray(reportData) ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">S.No</th>
                      {reportData.length > 0 && Object.keys(reportData[0]).map((key) => (
                        <th key={key} className="text-left py-3 px-4 font-semibold text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                        {Object.values(row).map((value, vIdx) => (
                          <td key={vIdx} className="py-3 px-4 text-gray-800">
                            {typeof value === 'object' && value !== null
                              ? value.name || JSON.stringify(value)
                              : typeof value === 'number'
                              ? value.toLocaleString()
                              : value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : reportData && typeof reportData === 'object' ? (
              <div className="space-y-4">
                {Object.entries(reportData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-gray-900 font-bold">
                      {typeof value === 'number' ? `₹ ${value.toLocaleString()}` : value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Report Data Not Available</h3>
                <p className="text-gray-500">This report is currently being prepared.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DynamicReport;
