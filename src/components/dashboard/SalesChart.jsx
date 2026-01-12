import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { TrendingUp } from 'lucide-react';

const SalesChart = () => {
  const options = {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      height: 350,
      style: {
        fontFamily: 'Inter, sans-serif'
      }
    },
    title: {
      text: null
    },
    xAxis: {
      categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
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
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      itemStyle: {
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '500'
      }
    },
    plotOptions: {
      column: {
        borderRadius: 4,
        pointPadding: 0.1,
        groupPadding: 0.15
      }
    },
    series: [{
      name: 'Sales',
      data: [4200, 5000, 2200, 4100, 1900, 3100],
      color: '#667eea'
    }, {
      name: 'Purchases',
      data: [3000, 4000, 1800, 2000, 2400, 3900],
      color: '#764ba2'
    }],
    credits: {
      enabled: false
    },
    tooltip: {
      formatter: function() {
        return '<b>' + this.series.name + '</b><br/>' +
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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <TrendingUp className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Sales & Purchases</h3>
          <p className="text-sm text-gray-500">Monthly comparison</p>
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

export default SalesChart;