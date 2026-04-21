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
        <div class="kpi-value text-main">{{ tickets.length }}</div>
        <p class="kpi-aux">En el sistema actual</p>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-grid mb-4">
      <div class="chart-container glass p-4">
        <h4 class="mb-3">Distribución por Estado</h4>
        <canvas id="statusChart"></canvas>
      </div>
      <div class="chart-container glass p-4">
        <h4 class="mb-3">Tickets por Área</h4>
        <canvas id="areaChart"></canvas>
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
import { mapState } from 'vuex';

export default {
  name: 'Statistics',
  data() {
    return {
      charts: {
        status: null,
        area: null
      }
    }
  },
  computed: {
    ...mapState(['tickets', 'areas']),
    slaCompliance() {
      const closed = this.tickets.filter(t => t.status === 'Cerrado');
      if (closed.length === 0) return 100;
      const onTime = closed.filter(t => !this.isTicketOverdue(t));
      return Math.round((onTime.length / closed.length) * 100);
    },
    overdueCount() {
      return this.tickets.filter(t => t.status !== 'Cerrado' && this.isTicketOverdue(t)).length;
    },
    avgClosureTime() {
      const closed = this.tickets.filter(t => t.status === 'Cerrado');
      if (closed.length === 0) return 0;
      const totalHours = closed.reduce((acc, t) => {
        const start = new Date(t.createdAt);
        const end = new Date(t.logs.find(l => l.state === 'Cerrado').timestamp);
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);
      return Math.round(totalHours / closed.length);
    },
    agentPerformance() {
      const agentsMap = {};
      this.tickets.forEach(t => {
        if (!agentsMap[t.responsible]) {
          agentsMap[t.responsible] = { name: t.responsible, resolved: 0, totalTime: 0, onTime: 0, closedCount: 0 };
        }
        const agent = agentsMap[t.responsible];
        if (t.status === 'Cerrado') {
          agent.resolved++;
          agent.closedCount++;
          const start = new Date(t.createdAt);
          const end = new Date(t.logs.find(l => l.state === 'Cerrado').timestamp);
          agent.totalTime += (end - start) / (1000 * 60 * 60);
          if (!this.isTicketOverdue(t)) agent.onTime++;
        }
      });

      return Object.values(agentsMap).map(a => ({
        name: a.name,
        resolved: a.resolved,
        avgTime: a.closedCount > 0 ? Math.round(a.totalTime / a.closedCount) : 0,
        sla: a.closedCount > 0 ? Math.round((a.onTime / a.closedCount) * 100) : 100
      }));
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts();
    });
  },
  methods: {
    isTicketOverdue(ticket) {
      const start = new Date(ticket.createdAt).getTime();
      const elapsedHours = (Date.now() - start) / (1000 * 60 * 60);
      return elapsedHours > (ticket.ans || 24);
    },
    initCharts() {
      if (!window.Chart) return;

      // Chart 1: Status (Pie)
      const statusCounts = {
        'Creado': this.tickets.filter(t => t.status === 'Creado').length,
        'En Proceso': this.tickets.filter(t => t.status === 'En Proceso').length,
        'Pausado': this.tickets.filter(t => t.status === 'Pausado').length,
        'Cerrado': this.tickets.filter(t => t.status === 'Cerrado').length,
      };

      this.charts.status = new window.Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
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

      // Chart 2: Areas (Bar)
      const areaStats = this.areas.map(a => ({
        name: a.name,
        count: this.tickets.filter(t => t.areaId === a.id).length
      }));

      this.charts.area = new window.Chart(document.getElementById('areaChart'), {
        type: 'bar',
        data: {
          labels: areaStats.map(a => a.name),
          datasets: [{
            label: 'Cant. Tickets',
            data: areaStats.map(a => a.count),
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
