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
          <button @click="loadReport(0)" class="btn-primary mr-2"><i class="fas fa-search mr-2"></i> Buscar</button>
          <button @click="resetFilters" class="btn-secondary">Limpiar</button>
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
              <th>Solicitante</th>
              <th>Responsable</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in filteredTickets" :key="ticket.id">
              <td class="id-cell">{{ ticket.codigo || ticket.id }}</td>
              <td>{{ formatDate(ticket.createdAt) }}</td>
              <td class="title-cell">{{ ticket.title }}</td>
              <td>{{ ticket.areaName || getAreaName(ticket.areaId) }}</td>
              <td>{{ ticket.subjectName }}</td>
              <td>{{ ticket.createdBy }}</td>
              <td>{{ ticket.responsible }}</td>
              <td>
                <span :class="['badge', getStatusClass(ticket.status)]">
                  {{ ticket.status }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredTickets.length === 0 && !loading">
              <td colspan="8" class="empty-state">No hay resultados para los criterios seleccionados.</td>
            </tr>
            <tr v-if="loading">
              <td colspan="8" class="empty-state">
                <i class="fas fa-spinner fa-spin"></i> Cargando...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="pagination.totalElements > 0" class="pagination-bar">
        <div class="pagination-info d-flex align-items-center gap-3">
          <span>Mostrando {{ paginationStart }}-{{ paginationEnd }} de {{ pagination.totalElements }}</span>
          <select v-model="pageSize" @change="onPageSizeChange" class="form-control shadow-sm" style="width: 80px; padding: 4px 8px; font-size: 0.85rem; height: 32px;">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="pagination-controls">
          <button class="page-btn" :disabled="pagination.page === 0" @click="goToPage(0)">
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button class="page-btn" :disabled="pagination.page === 0" @click="goToPage(pagination.page - 1)">
            <i class="fas fa-angle-left"></i>
          </button>
          <button v-for="p in visiblePages" :key="p" :class="['page-btn', { active: p === pagination.page }]" @click="goToPage(p)">
            {{ p + 1 }}
          </button>
          <button class="page-btn" :disabled="pagination.page >= pagination.totalPages - 1 || pagination.totalPages === 0" @click="goToPage(pagination.page + 1)">
            <i class="fas fa-angle-right"></i>
          </button>
          <button class="page-btn" :disabled="pagination.page >= pagination.totalPages - 1 || pagination.totalPages === 0" @click="goToPage(pagination.totalPages > 0 ? pagination.totalPages - 1 : 0)">
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import api from '../services/api';

export default {
  name: 'AdvancedReports',
  data() {
    return {
      filters: {
        from: '',
        to: '',
        areaId: '',
        subjectId: ''
      },
      reportTickets: [],
      loading: false,
      pageSize: 10,
      pagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0
      }
    }
  },
  computed: {
    ...mapState(['areas', 'subjects']),
    filteredSubjects() {
      if (!this.filters.areaId) return [];
      return this.subjects.filter(s => s.areaId === this.filters.areaId);
    },
    filteredTickets() {
      return this.reportTickets;
    },
    paginationStart() {
      return this.pagination.page * this.pagination.size + 1;
    },
    paginationEnd() {
      const end = (this.pagination.page + 1) * this.pagination.size;
      return Math.min(end, this.pagination.totalElements);
    },
    visiblePages() {
      const total = this.pagination.totalPages;
      const current = this.pagination.page;
      const pages = [];
      const range = 2;
      for (let i = Math.max(0, current - range); i <= Math.min(total - 1, current + range); i++) {
        pages.push(i);
      }
      return pages;
    }
  },
  async mounted() {
    await this.loadReport(0);
  },
  methods: {
    async loadReport(page = 0) {
      this.loading = true;
      try {
        const params = {
          page: page,
          size: this.pageSize
        };
        if (this.filters.from) params.from = this.filters.from;
        if (this.filters.to) params.to = this.filters.to;
        if (this.filters.areaId) params.areaId = this.filters.areaId;
        if (this.filters.subjectId) params.subjectId = this.filters.subjectId;

        const res = await api.get('/reports/tickets', { params });
        const data = (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
        
        this.reportTickets = data.content || data || [];
        if (data.pageable !== undefined) {
          this.pagination = {
            page: data.number,
            size: data.size,
            totalElements: data.totalElements,
            totalPages: data.totalPages
          };
        }
      } catch (e) {
        console.error('Error cargando reporte:', e);
      } finally {
        this.loading = false;
      }
    },
    goToPage(page) {
      this.loadReport(page);
    },
    onPageSizeChange() {
      this.loadReport(0);
    },
    formatDate(date) {
      if (!date) return '';
      let d;
      if (Array.isArray(date)) {
        d = new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
      } else {
        d = new Date(date);
      }
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-CO');
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
      this.loadReport(0);
    },
    exportToCSV() {
      const params = new URLSearchParams();
      if (this.filters.from) params.append('from', this.filters.from);
      if (this.filters.to) params.append('to', this.filters.to);
      if (this.filters.areaId) params.append('areaId', this.filters.areaId);
      if (this.filters.subjectId) params.append('subjectId', this.filters.subjectId);

      const token = localStorage.getItem('jwt_token');
      const baseUrl = process.env.VUE_APP_API_URL || '/api';
      const url = `${baseUrl}/reports/export/csv?${params.toString()}`;

      // Descargar con JWT en header usando fetch
      fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(resp => resp.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_tickets_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(e => console.error('Error exportando CSV:', e));
    }
  },
  watch: {
    'filters.from'() { this.loadReport(); },
    'filters.to'() { this.loadReport(); },
    'filters.areaId'() { this.filters.subjectId = ''; this.loadReport(); },
    'filters.subjectId'() { this.loadReport(); }
  }
}
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
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

/* Pagination */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0 5px;
  border-top: 1px solid var(--border-color);
  margin-top: 15px;
}
.pagination-info {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.pagination-controls {
  display: flex;
  gap: 4px;
}
.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-main);
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: var(--primary);
  color: var(--primary);
}
.page-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
