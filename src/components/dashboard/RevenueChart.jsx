import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { TrendingUp, ChevronDown } from 'lucide-react';

const RevenueChart = ({ chartData }) => {
  const options = {
    chart: {
      type: 'area',
      backgroundColor: 'transparent',
      height: 350,
      style: {
        fontFamily: 'Inter, sans-serif'
      }
    },
    accessibility: {
      enabled: false
    },
    title: {
      text: null
    },
    xAxis: {
      categories: chartData.categories || [],
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
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, 'rgba(102, 126, 234, 0.3)'],
            [1, 'rgba(102, 126, 234, 0.05)']
          ]
        },
        marker: {
          radius: 4,
          fillColor: '#667eea',
          lineWidth: 2,
          lineColor: '#ffffff'
        },
        lineWidth: 3,
        lineColor: '#667eea'
      }
    },
    series: [{
      name: 'Revenue',
      data: chartData.data || [],
      showInLegend: false
    }],
    credits: {
      enabled: false
    },
    tooltip: {
      formatter: function() {
        return '<b>Revenue</b><br/>' +
               this.x + ': ₹' + this.y.toLocaleString();
      },
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      borderRadius: 8,
      shadow: true
    }
  };

  return (
    <div className="chart-container h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Monthly Revenue</h3>
            <p className="text-sm text-gray-500">Revenue trends over last 6 months</p>
          </div>
        </div>
        
        {/* <button className="btn-secondary flex items-center gap-2 text-sm">
          Export <ChevronDown size={16} />
        </button> */}
      </div>

      <div className="flex-1">
        {(!chartData.categories || chartData.categories.length === 0) ? (
            <div className="h-full flex items-center justify-center text-gray-400">
                No revenue data available for chart.
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

export default RevenueChart;