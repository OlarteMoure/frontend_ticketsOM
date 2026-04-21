<template>
  <div class="reports-page">
    <div class="glass p-4 mb-4">
      <div class="flex-between mb-4">
        <h2><i class="fas fa-tasks mr-2 text-primary"></i> Mis Requerimientos</h2>
        <div class="filters">
          <input 
            v-model="searchQuery" 
            placeholder="Buscar por ID o Título..." 
            class="form-control mr-3 shadow-sm"
            style="width: 280px; display: inline-block;"
          >
          <select v-model="filterStatus" class="form-control shadow-sm" style="width: 160px; display: inline-block;">
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
            <tr v-for="ticket in filteredTickets" :key="ticket.id">
              <td class="id-cell">#{{ ticket.id }}</td>
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
                <button @click="selectedTicket = ticket" class="btn-action">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
            <tr v-if="filteredTickets.length === 0">
              <td colspan="6" class="empty-state">
                No se encontraron registros activos.
              </td>
            </tr>
          </tbody>
        </table>
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
import { mapGetters } from 'vuex';
import Timer from './Timer.vue';
import TicketDetail from './TicketDetail.vue';

export default {
  name: 'Reports',
  components: { Timer, TicketDetail },
  data() {
    return {
      searchQuery: '',
      filterStatus: '',
      selectedTicket: null
    }
  },
  computed: {
    ...mapGetters(['availableTickets']),
    filteredTickets() {
      return this.availableTickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                             t.id.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesStatus = this.filterStatus ? t.status === this.filterStatus : true;
        return matchesSearch && matchesStatus;
      });
    }
  },
  methods: {
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
</style>
