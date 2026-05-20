<template>
  <div class="statistics-view">
    <!-- Header Summary Widgets -->
    <div class="kpi-grid mb-4">
      <div class="kpi-card glass animate-fade" style="animation-delay: 0.1s">
        <div class="kpi-header">
          <i class="fas fa-check-circle text-success"></i>
          <span>Cumplimiento ANS</span>
        </div>
        <div class="kpi-value text-success">{{ slaCompliance }}%</div>
        <p class="kpi-aux">Tickets resueltos a tiempo</p>
      </div>
      
      <div class="kpi-card glass animate-fade" style="animation-delay: 0.2s">
        <div class="kpi-header">
          <i class="fas fa-exclamation-triangle text-danger"></i>
          <span>Tickets Vencidos</span>
        </div>
        <div class="kpi-value text-danger">{{ overdueCount }}</div>
        <p class="kpi-aux">Han superado el tiempo de ANS</p>
      </div>

      <div class="kpi-card glass animate-fade" style="animation-delay: 0.3s">
        <div class="kpi-header">
          <i class="fas fa-clock text-primary"></i>
          <span>Tiempo Promedio Cierre</span>
        </div>
        <div class="kpi-value text-primary">{{ avgClosureTime }}h</div>
        <p class="kpi-aux">Desde creación hasta cierre</p>
      </div>

      <div class="kpi-card glass animate-fade" style="animation-delay: 0.4s">
        <div class="kpi-header">
          <i class="fas fa-ticket-alt text-main"></i>
          <span>Total Tickets</span>
        </div>
        <div class="kpi-value text-main">{{ kpis.totalTickets }}</div>
        <p class="kpi-aux">En el sistema actual</p>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-grid mb-4">
      <div class="chart-container glass p-4">
        <h4 class="mb-3">Distribución por Estado</h4>
        <canvas ref="statusChart"></canvas>
      </div>
      <div class="chart-container glass p-4">
        <h4 class="mb-3">Tickets por Área</h4>
        <canvas ref="areaChart"></canvas>
      </div>
    </div>

    <!-- Performance Table -->
    <div class="glass p-4 mb-4">
      <h4 class="mb-3">Rendimiento por Responsable</h4>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Responsable</th>
              <th>Resueltos</th>
              <th>Promedio Cierre</th>
              <th>Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="agent in agentPerformance" :key="agent.name">
              <td class="font-bold">{{ agent.name }}</td>
              <td>{{ agent.resolved }}</td>
              <td>{{ agent.avgTime }}h</td>
              <td>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: agent.sla + '%', background: agent.sla > 80 ? 'var(--success)' : 'var(--warning)' }"></div>
                </div>
                <span class="sla-perc">{{ agent.sla }}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import api from '../services/api';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

export default {
  name: 'Statistics',
  data() {
    return {
      kpis: { slaCompliance: 0, overdueCount: 0, avgClosureTime: 0, totalTickets: 0 },
      agentPerformance: [],
      byStatus: {},
      byArea: [],
      charts: { status: null, area: null },
      loading: true
    }
  },
  computed: {
    slaCompliance() { return this.kpis.slaCompliance; },
    overdueCount() { return this.kpis.overdueCount; },
    avgClosureTime() { return this.kpis.avgClosureTime; }
  },
  async mounted() {
    await this.loadStats();
    this.$nextTick(() => this.initCharts());
  },
  beforeDestroy() {
    // Limpiar instancias de Chart para evitar memory leaks
    if (this.charts.status) this.charts.status.destroy();
    if (this.charts.area) this.charts.area.destroy();
  },
  methods: {
    async loadStats() {
      this.loading = true;
      try {
        const [kpiRes, statusRes, areaRes, agentRes] = await Promise.all([
          api.get('/statistics/kpis'),
          api.get('/statistics/by-status'),
          api.get('/statistics/by-area'),
          api.get('/statistics/by-agent')
        ]);
        this.kpis = (kpiRes.data && kpiRes.data.data !== undefined) ? kpiRes.data.data : kpiRes.data;
        this.byStatus = (statusRes.data && statusRes.data.data !== undefined) ? statusRes.data.data : statusRes.data;
        this.byArea = (areaRes.data && areaRes.data.data !== undefined) ? areaRes.data.data : areaRes.data;
        this.agentPerformance = (agentRes.data && agentRes.data.data !== undefined) ? agentRes.data.data : agentRes.data;
      } catch (e) {
        console.error('Error cargando estadísticas:', e);
      } finally {
        this.loading = false;
      }
    },
    initCharts() {
      // Chart 1: Status (Doughnut)
      const statusLabels = Object.keys(this.byStatus);
      const statusValues = Object.values(this.byStatus);

      if (this.$refs.statusChart) {
        this.charts.status = new Chart(this.$refs.statusChart, {
          type: 'doughnut',
          data: {
            labels: statusLabels,
            datasets: [{
              data: statusValues,
              backgroundColor: ['#2b6cb0', '#2c7a7b', '#9c4221', '#276749'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6 } }
            }
          }
        });
      }

      // Chart 2: Areas (Bar)
      if (this.$refs.areaChart) {
        this.charts.area = new Chart(this.$refs.areaChart, {
          type: 'bar',
          data: {
            labels: this.byArea.map(a => a.areaName),
            datasets: [{
              label: 'Cant. Tickets',
              data: this.byArea.map(a => a.count),
              backgroundColor: '#003162',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { display: false } },
              x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  }
}
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
.kpi-card {
  padding: 25px;
  text-align: left;
}
.kpi-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 5px;
}
.kpi-aux {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}
.chart-container {
  height: 350px;
}

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.data-table th { text-align: left; padding: 15px; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
.data-table td { padding: 15px; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
.data-table tr:hover { background: #f8fafc; }
.progress-bar-bg {
  width: 100px;
  height: 8px;
  background: #edf2f7;
  border-radius: 4px;
  display: inline-block;
  margin-right: 10px;
  vertical-align: middle;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease-out;
}
.sla-perc {
  font-size: 0.8rem;
  font-weight: 700;
}
.font-bold {
  font-weight: 600;
  color: var(--text-main);
}
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }
</style>
