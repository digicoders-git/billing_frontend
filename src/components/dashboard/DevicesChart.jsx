import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Smartphone } from 'lucide-react';

const DevicesChart = () => {
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
      name: 'Devices',
      data: [
        { name: 'iOS', y: 30, color: '#667eea' },
        { name: 'MacBook', y: 10, color: '#764ba2' },
        { name: 'Smart TV', y: 8, color: '#48bb78' },
        { name: 'Tesla Model S', y: 12, color: '#ed8936' },
        { name: 'Google Pixel', y: 40, color: '#f56565' }
      ]
    }],
    credits: {
      enabled: false
    },
    tooltip: {
      formatter: function() {
        return '<b>' + this.point.name + '</b><br/>' +
               'Usage: ' + this.y + '%';
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
          <Smartphone className="text-primary" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Devices</h3>
          <p className="text-sm text-gray-500">Usage distribution</p>
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

export default DevicesChart;