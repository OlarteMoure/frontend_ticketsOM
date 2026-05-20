<template>
  <div class="ticket-detail p-4">
    <div class="flex-between mb-4 border-b">
      <h3 class="ticket-title">
        <span class="id-tag">{{ ticket.codigo || ticket.id }}</span> 
        {{ ticket.title }}
      </h3>
      <button @click="$emit('close')" class="btn-close">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="grid-content">
      <div class="main-column">
        <section class="info-group">
          <label>Descripción</label>
          <div class="description-box shadow-sm">{{ ticket.description }}</div>
        </section>

        <section class="history-group">
          <label>Trazabilidad / Historial</label>
          <div class="timeline">
            <div v-for="(log, idx) in ticket.logs" :key="idx" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="log-status">{{ log.state }}</span>
                <span class="log-info">por {{ log.user }} - {{ formatDate(log.timestamp) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="side-column">
        <div class="status-card glass p-3 bg-light-panel">
          <label>Estado Actual</label>
          <select v-model="localStatus" @change="handleStatusChange" class="form-control mt-2 mb-3 shadow-sm">
            <option value="Creado">Creado</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Pausado">Pausado</option>
            <option value="Cerrado">Cerrado</option>
          </select>

          <div class="data-point">
            <span class="label">Responsable</span>
            <span class="value">{{ ticket.responsible }}</span>
          </div>

          <div class="data-point">
            <span class="label">Creado el</span>
            <span class="value">{{ formatDate(ticket.createdAt) }}</span>
          </div>

          <div class="data-point">
            <span class="label">Tiempo Transcurrido</span>
            <div class="mt-1">
              <Timer :ticket="ticket" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Timer from './Timer.vue';

export default {
  name: 'TicketDetail',
  components: { Timer },
  props: {
    ticket: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localStatus: this.ticket.status,
      updating: false
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleString('es-CO');
    },
    async handleStatusChange() {
      this.updating = true;
      try {
        await this.$store.dispatch('changeTicketStatus', {
          id: this.ticket.id,
          status: this.localStatus
        });
      } catch (e) {
        // Revertir si el backend rechaza la transición
        alert(e.response?.data?.message || 'Error al cambiar estado');
        this.localStatus = this.ticket.status;
      } finally {
        this.updating = false;
      }
    }
  }
}
</script>

<style scoped>
.ticket-detail { background: #fff; border-radius: 0 0 12px 12px; }
.border-b { border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
.ticket-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
.id-tag { color: var(--primary); font-family: monospace; font-size: 1.1rem; margin-right: 10px; }
.grid-content { display: grid; grid-template-columns: 1.8fr 1fr; gap: 25px; margin-top: 20px; }
.info-group label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; font-weight: 700; }
.description-box { background: #f8fafc; border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; line-height: 1.6; color: var(--text-main); font-size: 0.95rem; }
.history-group { margin-top: 25px; }
.history-group label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 15px; font-weight: 700; }
.timeline { margin-top: 15px; border-left: 2px solid #e2e8f0; padding-left: 20px; }
.timeline-item { position: relative; margin-bottom: 20px; }
.timeline-dot { position: absolute; left: -26px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--primary); border: 2px solid #fff; box-shadow: 0 0 0 2px var(--primary); }
.log-status { font-weight: 700; display: block; font-size: 0.85rem; color: var(--text-main); }
.log-info { font-size: 0.75rem; color: var(--text-muted); }
.status-card { border-radius: 12px; border: 1px solid var(--border-color); }
.bg-light-panel { background: #f8fafc !important; }
.data-point { margin-bottom: 15px; }
.data-point .label { display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
.data-point .value { color: var(--text-main); font-weight: 600; font-size: 0.9rem; }
.btn-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; transition: 0.2s; }
.btn-close:hover { color: var(--danger); transform: rotate(90deg); }
.shadow-sm { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
</style>
