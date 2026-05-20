<template>
  <div class="reports-page">
    <div class="glass p-4 mb-4">
      <div class="flex-between mb-4">
        <h2><i class="fas fa-tasks mr-2 text-primary"></i> Mis Requerimientos</h2>
        <div class="filters">
          <input 
            v-model="searchQuery" 
            placeholder="Buscar por ID o Título..." 
            class="form-control shadow-sm search-input"
            @input="onSearchDebounced"
          >
          <select v-model="filterStatus" class="form-control shadow-sm status-select" @change="onFilterChange">
            <option value="">Todos los Estados</option>
            <option value="Creado">Creado</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Pausado">Pausado</option>
            <option value="Cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título / Descripción</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th>SLA / Timer</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in tickets" :key="ticket.id">
              <td class="id-cell">#{{ ticket.codigo || ticket.id }}</td>
              <td>
                <div class="title-cell">{{ ticket.title }}</div>
                <div class="sub-cell">{{ ticket.subjectName }}</div>
              </td>
              <td>{{ ticket.responsible }}</td>
              <td>
                <span :class="['badge', getStatusClass(ticket.status)]">
                  {{ ticket.status }}
                </span>
              </td>
              <td>
                <Timer :ticket="ticket" />
              </td>
              <td class="actions-cell">
                <button @click="openDetail(ticket)" class="btn-action">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
            <tr v-if="tickets.length === 0 && !loading">
              <td colspan="6" class="empty-state">
                No se encontraron registros activos.
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="6" class="empty-state">
                <i class="fas fa-spinner fa-spin"></i> Cargando...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="pagination.totalPages > 1" class="pagination-bar">
        <div class="pagination-info">
          Mostrando {{ paginationStart }}-{{ paginationEnd }} de {{ pagination.totalElements }}
        </div>
        <div class="pagination-controls">
          <button 
            class="page-btn" 
            :disabled="pagination.page === 0"
            @click="goToPage(0)"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button 
            class="page-btn" 
            :disabled="pagination.page === 0"
            @click="goToPage(pagination.page - 1)"
          >
            <i class="fas fa-angle-left"></i>
          </button>
          <button
            v-for="p in visiblePages"
            :key="p"
            :class="['page-btn', { active: p === pagination.page }]"
            @click="goToPage(p)"
          >
            {{ p + 1 }}
          </button>
          <button 
            class="page-btn" 
            :disabled="pagination.page >= pagination.totalPages - 1"
            @click="goToPage(pagination.page + 1)"
          >
            <i class="fas fa-angle-right"></i>
          </button>
          <button 
            class="page-btn" 
            :disabled="pagination.page >= pagination.totalPages - 1"
            @click="goToPage(pagination.totalPages - 1)"
          >
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle -->
    <transition name="fade">
      <div v-if="selectedTicket" class="modal-backdrop" @click.self="selectedTicket = null">
        <div class="modal-box glass animate-scale">
          <TicketDetail :ticket="selectedTicket" @close="selectedTicket = null" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Timer from './Timer.vue';
import TicketDetail from './TicketDetail.vue';

export default {
  name: 'Reports',
  components: { Timer, TicketDetail },
  data() {
    return {
      searchQuery: '',
      filterStatus: '',
      selectedTicket: null,
      searchTimer: null
    }
  },
  mounted() {
    this.loadTickets();
  },
  computed: {
    ...mapState(['tickets', 'loading']),
    pagination() {
      return this.$store.state.ticketsPagination;
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
  methods: {
    loadTickets() {
      this.$store.dispatch('fetchTickets', {
        status: this.filterStatus || undefined,
        search: this.searchQuery || undefined,
        page: 0
      });
    },
    goToPage(page) {
      this.$store.dispatch('fetchTickets', {
        status: this.filterStatus || undefined,
        search: this.searchQuery || undefined,
        page
      });
    },
    onFilterChange() {
      this.loadTickets();
    },
    onSearchDebounced() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.loadTickets();
      }, 400);
    },
    async openDetail(ticket) {
      try {
        // Obtener detalle fresco del backend
        const detail = await this.$store.dispatch('fetchTicketDetail', ticket.id);
        this.selectedTicket = detail;
      } catch (e) {
        // Fallback: usar datos del listado
        this.selectedTicket = ticket;
      }
    },
    getStatusClass(status) {
      switch(status) {
        case 'Creado': return 'badge-created';
        case 'En Proceso': return 'badge-received';
        case 'Pausado': return 'badge-paused';
        case 'Cerrado': return 'badge-success';
        default: return '';
      }
    }
  }
}
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; }
.search-input { width: 280px; }
.status-select { width: 160px; }

@media (max-width: 600px) {
  .search-input { width: 100%; }
  .status-select { width: 100%; }
  .filters { width: 100%; }
}

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.data-table th { text-align: left; padding: 15px 10px; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
.data-table td { padding: 15px 10px; border-bottom: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem; }
.data-table tr:hover { background: #f8fafc; }
.id-cell { font-family: monospace; font-weight: 700; color: var(--primary); }
.title-cell { font-weight: 600; color: #1a202c; }
.sub-cell { font-size: 0.75rem; color: var(--text-muted); }
.btn-action { background: none; border: none; color: var(--primary); font-size: 1.1rem; cursor: pointer; transition: 0.2s; padding: 5px; border-radius: 5px; }
.btn-action:hover { background: rgba(0, 49, 98, 0.05); color: var(--primary-hover); }
.empty-state { text-align: center; padding: 60px !important; color: var(--text-muted); font-style: italic; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-box { width: 90%; max-width: 900px; max-height: 90vh; overflow: hidden; border: none; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
.text-primary { color: var(--primary); }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter, .fade-leave-to { opacity: 0; }
.animate-scale { animation: scaleIn 0.3s ease-out; }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

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
