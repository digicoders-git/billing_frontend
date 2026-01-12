import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { FileText } from 'lucide-react';

const InvoiceStatusChart = ({ data }) => {
  const chartSeriesData = [
    { name: 'Paid', y: data?.paid || 0, color: '#48bb78' },
    { name: 'Pending', y: data?.pending || 0, color: '#ed8936' },
    { name: 'Overdue', y: data?.overdue || 0, color: '#f56565' }
  ];

  const totalInvoices = (data?.paid || 0) + (data?.pending || 0) + (data?.overdue || 0);

  const options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 350,
      style: {
        fontFamily: 'Inter, sans-serif'
      }
    },
    title: {
      text: null
    },
    plotOptions: {
      pie: {
        innerSize: '60%',
        dataLabels: {
          enabled: true,
          format: '{point.percentage:.1f}%',
          style: {
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151'
          }
        },
        showInLegend: true
      }
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: {
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '500'
      }
    },
    series: [{
      name: 'Invoices',
      data: chartSeriesData
    }],
    credits: {
      enabled: false
    },
    tooltip: {
      formatter: function() {
        return '<b>' + this.point.name + '</b><br/>' +
               'Count: ' + this.y + ' (' + this.percentage.toFixed(1) + '%)';
      },
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      borderRadius: 8,
      shadow: true
    }
  };

  return (
    <div className="chart-container h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Invoice Status</h3>
          <p className="text-sm text-gray-500">Paid vs Pending vs Overdue</p>
        </div>
      </div>

      <div className="flex-1">
        {totalInvoices === 0 ? (
             <div className="h-full flex items-center justify-center text-gray-400">
                No invoice data available.
             </div>
        ) : (
            <HighchartsReact
            highcharts={Highcharts}
            options={options}
            />
        )}
      </div>
    </div>
  );
};

export default InvoiceStatusChart;