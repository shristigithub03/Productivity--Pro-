// chart.js - Custom Chart Implementation for Productivity Pro

class ProductivityChart {
  constructor(canvasId, config) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }
    this.ctx = this.canvas.getContext('2d');
    this.config = this.validateConfig(config);
    this.chart = null;
  }

  validateConfig(config) {
    const defaults = {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Productivity Chart'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    return { ...defaults, ...config };
  }

  init() {
    if (this.chart) {
      this.destroy();
    }

    this.chart = {
      // Simplified chart object that mimics basic Chart.js functionality
      canvas: this.canvas,
      config: this.config,
      data: this.config.data,
      
      update: () => {
        this.render();
      },
      
      destroy: () => {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    this.render();
    return this.chart;
  }

  render() {
    const { data, options } = this.config;
    const { labels, datasets } = data;
    
    // Set canvas dimensions
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate dimensions
    const padding = 40;
    const chartWidth = this.canvas.width - padding * 2;
    const chartHeight = this.canvas.height - padding * 2;
    
    // Draw chart area
    this.ctx.save();
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--light-gray') || '#EFF0F3';
    this.ctx.fillRect(padding, padding, chartWidth, chartHeight);
    this.ctx.restore();
    
    // Draw axes
    this.drawAxes(padding, chartWidth, chartHeight);
    
    // Draw data
    if (this.config.type === 'bar') {
      this.drawBarChart(padding, chartWidth, chartHeight, labels, datasets);
    } else if (this.config.type === 'line') {
      this.drawLineChart(padding, chartWidth, chartHeight, labels, datasets);
    }
    
    // Draw title
    if (options.plugins?.title?.display) {
      this.drawTitle(options.plugins.title.text);
    }
    
    // Draw legend
    if (options.plugins?.legend?.display !== false) {
      this.drawLegend(datasets, padding, chartWidth);
    }
  }

  drawAxes(padding, chartWidth, chartHeight) {
    this.ctx.save();
    this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--gray') || '#94A1B2';
    this.ctx.lineWidth = 1;
    
    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding + chartHeight);
    this.ctx.lineTo(padding + chartWidth, padding + chartHeight);
    this.ctx.stroke();
    
    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, padding + chartHeight);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawBarChart(padding, chartWidth, chartHeight, labels, datasets) {
    if (!labels.length || !datasets.length) return;
    
    const barWidth = (chartWidth * 0.8) / labels.length;
    const groupWidth = barWidth / datasets.length;
    const maxValue = Math.max(...datasets.flatMap(d => d.data));
    const scale = chartHeight / (maxValue || 1);
    
    datasets.forEach((dataset, datasetIndex) => {
      this.ctx.save();
      this.ctx.fillStyle = dataset.backgroundColor || this.getDefaultColor(datasetIndex);
      
      labels.forEach((label, labelIndex) => {
        const value = dataset.data[labelIndex] || 0;
        const barHeight = value * scale;
        const x = padding + (labelIndex * barWidth) + (datasetIndex * groupWidth);
        const y = padding + chartHeight - barHeight;
        
        this.ctx.fillRect(x, y, groupWidth * 0.9, barHeight);
      });
      
      this.ctx.restore();
    });
  }

  drawLineChart(padding, chartWidth, chartHeight, labels, datasets) {
    if (!labels.length || !datasets.length) return;
    
    const maxValue = Math.max(...datasets.flatMap(d => d.data));
    const scale = chartHeight / (maxValue || 1);
    const segmentWidth = chartWidth / (labels.length - 1);
    
    datasets.forEach((dataset, datasetIndex) => {
      this.ctx.save();
      this.ctx.strokeStyle = dataset.borderColor || this.getDefaultColor(datasetIndex);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      labels.forEach((label, labelIndex) => {
        const value = dataset.data[labelIndex] || 0;
        const x = padding + (labelIndex * segmentWidth);
        const y = padding + chartHeight - (value * scale);
        
        if (labelIndex === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
        
        // Draw point
        this.ctx.save();
        this.ctx.fillStyle = dataset.backgroundColor || this.getDefaultColor(datasetIndex);
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
      
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  drawTitle(titleText) {
    this.ctx.save();
    this.ctx.font = '16px Poppins, sans-serif';
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark') || '#16161A';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(titleText, this.canvas.width / 2, 30);
    this.ctx.restore();
  }

  drawLegend(datasets, padding, chartWidth) {
    const legendX = padding + chartWidth - 20;
    let legendY = padding + 20;
    const legendItemHeight = 20;
    const legendTextOffset = 20;
    const legendSquareSize = 15;
    
    datasets.forEach((dataset, index) => {
      this.ctx.save();
      
      // Draw color square
      this.ctx.fillStyle = dataset.backgroundColor || this.getDefaultColor(index);
      this.ctx.fillRect(legendX - legendSquareSize - 5, legendY, legendSquareSize, legendSquareSize);
      
      // Draw label
      this.ctx.font = '12px Poppins, sans-serif';
      this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark') || '#16161A';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(dataset.label || `Dataset ${index + 1}`, legendX, legendY + legendTextOffset);
      
      this.ctx.restore();
      legendY += legendItemHeight;
    });
  }

  getDefaultColor(index) {
    const colors = [
      'rgba(127, 90, 240, 0.7)',  // Purple
      'rgba(44, 182, 125, 0.7)',  // Green
      'rgba(255, 126, 107, 0.7)', // Orange
      'rgba(148, 161, 178, 0.7)', // Gray
      'rgba(234, 179, 8, 0.7)'    // Yellow
    ];
    return colors[index % colors.length];
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update() {
    this.render();
  }
}

// Simplified factory function for creating charts
function createChart(canvasId, config) {
  const chart = new ProductivityChart(canvasId, config);
  return chart.init();
}