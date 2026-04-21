<template>
  <div class="advanced-reports">
    <div class="glass p-5">
      <div class="flex-between mb-4">
        <h2><i class="fas fa-file-invoice-dollar mr-2 text-primary"></i> Reportes Avanzados</h2>
        <button @click="exportToCSV" class="btn-primary" :disabled="filteredTickets.length === 0">
          <i class="fas fa-file-excel mr-2"></i> Exportar a Excel
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters-grid glass p-4 mb-4 bg-light-panel">
        <div class="filter-item">
          <label>Desde</label>
          <input type="date" v-model="filters.from" class="form-control shadow-sm">
        </div>
        <div class="filter-item">
          <label>Hasta</label>
          <input type="date" v-model="filters.to" class="form-control shadow-sm">
        </div>
        <div class="filter-item">
          <label>Área</label>
          <select v-model="filters.areaId" class="form-control shadow-sm" @change="filters.subjectId = ''">
            <option value="">Todas</option>
            <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Asunto / Tipo</label>
          <select v-model="filters.subjectId" class="form-control shadow-sm" :disabled="!filters.areaId">
            <option value="">Todos</option>
            <option v-for="sub in filteredSubjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
          </select>
        </div>
        <div class="filter-item flex-end">
          <button @click="resetFilters" class="btn-secondary">Limpiar Filtros</button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Título</th>
              <th>Área</th>
              <th>Tipo</th>
              <th>Responsable</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in filteredTickets" :key="ticket.id">
              <td class="id-cell">{{ ticket.id }}</td>
              <td>{{ formatDate(ticket.createdAt) }}</td>
              <td class="title-cell">{{ ticket.title }}</td>
              <td>{{ getAreaName(ticket.areaId) }}</td>
              <td>{{ ticket.subjectName }}</td>
              <td>{{ ticket.responsible }}</td>
              <td>
                <span :class="['badge', getStatusClass(ticket.status)]">
                  {{ ticket.status }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredTickets.length === 0">
              <td colspan="7" class="empty-state">No hay resultados para los criterios seleccionados.</td>
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
  name: 'AdvancedReports',
  data() {
    return {
      filters: {
        from: '',
        to: '',
        areaId: '',
        subjectId: ''
      }
    }
  },
  computed: {
    ...mapState(['tickets', 'areas', 'subjects']),
    filteredSubjects() {
      if (!this.filters.areaId) return [];
      return this.subjects.filter(s => s.areaId === this.filters.areaId);
    },
    filteredTickets() {
      return this.tickets.filter(t => {
        let match = true;
        const ticketDate = new Date(t.createdAt).toISOString().split('T')[0];
        
        if (this.filters.from && ticketDate < this.filters.from) match = false;
        if (this.filters.to && ticketDate > this.filters.to) match = false;
        if (this.filters.areaId && t.areaId !== this.filters.areaId) match = false;
        if (this.filters.subjectId && t.subjectId !== this.filters.subjectId) match = false;
        
        return match;
      });
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString('es-CO');
    },
    getAreaName(id) {
      const area = this.areas.find(a => a.id === id);
      return area ? area.name : 'N/A';
    },
    getStatusClass(status) {
      switch(status) {
        case 'Creado': return 'badge-created';
        case 'En Proceso': return 'badge-received';
        case 'Pausado': return 'badge-paused';
        case 'Cerrado': return 'badge-success';
        default: return '';
      }
    },
    resetFilters() {
      this.filters = { from: '', to: '', areaId: '', subjectId: '' };
    },
    exportToCSV() {
      const rows = [
        ['ID', 'Fecha', 'Titulo', 'Area', 'Tipo', 'Responsable', 'Estado']
      ];

      this.filteredTickets.forEach(t => {
        rows.push([
          t.id,
          this.formatDate(t.createdAt),
          t.title.replace(/,/g, ''),
          this.getAreaName(t.areaId),
          t.subjectName,
          t.responsible,
          t.status
        ]);
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_tickets_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
</script>

<style scoped>
.bg-light-panel { background: #f8fafc !important; }
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  border: 1px solid var(--border-color);
}
.filter-item label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}
.flex-end {
  display: flex;
  align-items: flex-end;
}
.table-wrapper { overflow-x: auto; margin-top: 20px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 12px; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.data-table td { padding: 12px; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
.data-table tr:hover { background: #f8fafc; }
.id-cell { font-family: monospace; color: var(--primary); font-weight: bold; }
.title-cell { font-weight: 500; color: var(--text-main); }
.empty-state { text-align: center; padding: 40px !important; color: var(--text-muted); }
.btn-secondary { background: #fff; border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 15px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.btn-secondary:hover { background: #f1f5f9; border-color: var(--text-muted); }
.text-primary { color: var(--primary); }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
</style>
