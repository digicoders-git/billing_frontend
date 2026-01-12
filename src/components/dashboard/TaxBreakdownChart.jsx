import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Receipt } from 'lucide-react';

const TaxBreakdownChart = () => {
  const options = {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      height: 300,
      style: {
        fontFamily: 'Inter, sans-serif'
      }
    },
    title: {
      text: null
    },
    xAxis: {
      categories: ['CGST', 'SGST', 'IGST', 'CESS'],
      lineWidth: 0,
      tickWidth: 0,
      labels: {
        style: {
          color: '#64748b',
          fontSize: '12px'
        }
      }
    },
    yAxis: {
      title: {
        text: null
      },
      gridLineColor: '#f1f5f9',
      labels: {
        style: {
          color: '#64748b',
          fontSize: '12px'
        },
        formatter: function() {
          return '₹' + (this.value / 1000) + 'k';
        }
      }
    },
    plotOptions: {
      column: {
        borderRadius: 4,
        pointPadding: 0.2,
        groupPadding: 0.1
      }
    },
    series: [{
      name: 'Tax Collected',
      data: [45000, 45000, 78000, 12000],
      color: '#667eea',
      showInLegend: false
    }],
    credits: {
      enabled: false
    },
    tooltip: {
      formatter: function() {
        return '<b>' + this.x + '</b><br/>' +
               'Amount: ₹' + this.y.toLocaleString();
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
          <Receipt className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Tax Breakdown</h3>
          <p className="text-sm text-gray-500">GST collection details</p>
        </div>
      </div>

      <div className="flex-1">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
        />
      </div>
    </div>
  );
};

export default TaxBreakdownChart;