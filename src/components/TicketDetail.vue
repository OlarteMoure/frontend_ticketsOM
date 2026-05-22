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
          <label>Descripción Original</label>
          <div class="description-box shadow-sm">{{ ticket.description }}</div>
        </section>

        <section class="history-group">
          <label>Línea de Tiempo y Comentarios</label>
          <div class="timeline">
            <div v-for="(item, idx) in unifiedTimeline" :key="idx" :class="['timeline-item', item.type]">
              <div class="timeline-dot" v-if="item.type === 'log'"></div>
              <div class="timeline-avatar" v-if="item.type === 'message'">
                <i class="fas fa-user-circle"></i>
              </div>
              
              <div class="timeline-content" :class="{'chat-bubble': item.type === 'message'}">
                <template v-if="item.type === 'log'">
                  <span class="log-status">{{ item.state }}</span>
                  <span class="log-info">cambiado por {{ item.user }} el {{ formatDate(item.originalDate) }}</span>
                  <div v-if="item.observacion" class="log-observation mt-1 p-2 shadow-sm">
                    "{{ item.observacion }}"
                  </div>
                </template>

                <template v-else>
                  <div class="chat-header">
                    <strong>{{ item.usuarioNombre }}</strong>
                    <span class="chat-time">{{ formatDate(item.originalDate) }}</span>
                  </div>
                  <div class="chat-body mt-2">
                    {{ item.contenido }}
                  </div>
                  <div class="chat-attachments mt-2" v-if="item.adjuntos && item.adjuntos.length > 0">
                    <button v-for="file in item.adjuntos" :key="file.id" @click="downloadFile(file)" class="attachment-chip">
                      <i class="fas fa-paperclip"></i> {{ file.nombreOriginal }}
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </section>

        <!-- Caja de Chat Permanente -->
        <section class="chat-input-box mt-4 p-3 shadow-sm" v-if="ticket.status !== 'Cerrado' || isAdmin">
          <label>Añadir un comentario</label>
          <textarea v-model="chatText" class="form-control mb-2" rows="2" placeholder="Escribe tu mensaje aquí..."></textarea>
          
          <div class="selected-files mb-2" v-if="chatFiles.length > 0">
            <div v-for="(file, index) in chatFiles" :key="index" class="file-chip">
              <span><i class="fas fa-file-alt"></i> {{ file.name }}</span>
              <button @click="removeChatFile(index)" class="btn-remove-file"><i class="fas fa-times"></i></button>
            </div>
          </div>

          <div class="chat-actions">
            <div class="file-upload-wrapper">
              <input type="file" multiple @change="onChatFilesSelected" class="file-input-hidden" id="chatFileInput">
              <label for="chatFileInput" class="btn-secondary">
                <i class="fas fa-paperclip"></i> Adjuntar
              </label>
            </div>
            <button @click="sendMessage" class="btn-primary" :disabled="!chatText.trim() && chatFiles.length === 0 || sendingMessage">
              <i class="fas fa-paper-plane" v-if="!sendingMessage"></i> <i class="fas fa-spinner fa-spin" v-else></i> Enviar
            </button>
          </div>
        </section>
      </div>

      <div class="side-column">
        <div class="status-card glass p-3 bg-light-panel">
          <label>Estado Actual</label>
          <select v-model="localStatus" class="form-control mt-2 mb-3 shadow-sm">
            <option value="Creado">Creado</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Pausado">Pausado</option>
            <option value="Cerrado">Cerrado</option>
          </select>

          <div v-if="localStatus !== ticket.status" class="mt-3 animate-fade">
            <label>Observación Interna del Estado</label>
            <textarea v-model="observacion" class="form-control shadow-sm mb-2" rows="2" placeholder="Justificación del cambio..."></textarea>
            <button @click="handleStatusChange" class="btn-primary full-width" :disabled="updating || (localStatus === 'Cerrado' && !observacion.trim())">
              <i class="fas fa-save" v-if="!updating"></i> <i class="fas fa-spinner fa-spin" v-else></i> Guardar Estado
            </button>
          </div>

          <hr class="my-3" />

          <div class="data-point">
            <span class="label">Responsable</span>
            <div v-if="isAdmin && viewType === 'global'" class="mt-1 d-flex gap-2">
              <select v-model="localResponsableId" class="form-control shadow-sm" style="flex: 1;">
                <option :value="ticket.responsibleId">{{ ticket.responsible }}</option>
                <option v-for="user in activeUsers" :key="user.id" :value="user.id" v-show="user.id !== ticket.responsibleId">
                  {{ user.name }}
                </option>
              </select>
              <button @click="handleAssignChange" class="btn-secondary" v-if="localResponsableId !== ticket.responsibleId" :disabled="updating">
                <i class="fas fa-save" v-if="!updating"></i> <i class="fas fa-spinner fa-spin" v-else></i>
              </button>
            </div>
            <span class="value" v-else>{{ ticket.responsible }}</span>
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
          <div class="data-point" v-if="ticket.status === 'Cerrado' && ticket.closedAt">
            <span class="label">Fecha Cierre</span>
            <span class="value">{{ formatDate(ticket.closedAt) }}</span>
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
    },
    viewType: {
      type: String,
      default: 'solicitante'
    }
  },
  data() {
    return {
      localStatus: this.ticket.status,
      localResponsableId: this.ticket.responsibleId,
      observacion: '',
      updating: false,
      messages: [],
      chatText: '',
      chatFiles: [],
      sendingMessage: false
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.isAdmin;
    },
    activeUsers() {
      return this.$store.state.users.filter(u => u.activo && (u.role === 'Gestionador' || u.role === 'Administrador'));
    },
    unifiedTimeline() {
      const parseDate = (val) => {
        if (!val) return 0;
        if (Array.isArray(val)) {
          return new Date(val[0], val[1] - 1, val[2], val[3] || 0, val[4] || 0, val[5] || 0).getTime();
        }
        return new Date(val).getTime();
      };

      const logs = (this.ticket.logs || []).map(log => ({
        ...log,
        type: 'log',
        parsedTime: parseDate(log.timestamp),
        originalDate: log.timestamp
      }));

      const msgs = this.messages.map(msg => ({
        ...msg,
        type: 'message',
        parsedTime: parseDate(msg.fechaCreacion),
        originalDate: msg.fechaCreacion
      }));

      const combined = [...logs, ...msgs];
      combined.sort((a, b) => a.parsedTime - b.parsedTime);
      return combined;
    }
  },
  mounted() {
    if (this.isAdmin && this.$store.state.users.length === 0) {
      this.$store.dispatch('fetchUsers');
    }
    this.loadMessages();
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleString('es-CO');
    },
    async loadMessages() {
      try {
        this.messages = await this.$store.dispatch('fetchTicketMessages', this.ticket.id);
      } catch (e) {
        console.error("Error al cargar mensajes", e);
      }
    },
    onChatFilesSelected(event) {
      const selected = Array.from(event.target.files);
      this.chatFiles = [...this.chatFiles, ...selected];
    },
    removeChatFile(index) {
      this.chatFiles.splice(index, 1);
    },
    async sendMessage() {
      if (!this.chatText.trim() && this.chatFiles.length === 0) return;
      
      this.sendingMessage = true;
      try {
        const formData = new FormData();
        formData.append('contenido', this.chatText);
        this.chatFiles.forEach(file => formData.append('files', file));

        await this.$store.dispatch('sendTicketMessage', {
          id: this.ticket.id,
          formData
        });

        this.chatText = '';
        this.chatFiles = [];
        await this.loadMessages(); // Refrescar línea de tiempo
      } catch (e) {
        alert("Error al enviar el mensaje.");
      } finally {
        this.sendingMessage = false;
      }
    },
    downloadFile(file) {
      const token = localStorage.getItem('jwt_token');
      fetch(file.urlDescarga, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = file.nombreOriginal;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
        alert('No se pudo descargar el archivo.');
      });
    },
    async handleStatusChange() {
      this.updating = true;
      try {
        await this.$store.dispatch('changeTicketStatus', {
          id: this.ticket.id,
          status: this.localStatus,
          observacion: this.observacion
        });
        this.observacion = '';
        this.$emit('updated');
      } catch (e) {
        alert(e.response?.data?.message || 'Error al cambiar estado');
        this.localStatus = this.ticket.status;
      } finally {
        this.updating = false;
      }
    },
    async handleAssignChange() {
      this.updating = true;
      try {
        await this.$store.dispatch('assignTicket', {
          id: this.ticket.id,
          responsableId: this.localResponsableId
        });
        this.$emit('updated');
      } catch (e) {
        alert(e.response?.data?.message || 'Error al reasignar el ticket');
        this.localResponsableId = this.ticket.responsibleId;
      } finally {
        this.updating = false;
      }
    }
  }
}
</script>

<style scoped>
.ticket-detail { background: #fff; border-radius: 0 0 12px 12px; }
.border-b { border-bottom: 1px solid var(--border-color); padding-bottom: 20px; }
.ticket-title { font-size: 1.4rem; font-weight: 700; color: var(--text-main); }
.id-tag { color: var(--primary); font-family: monospace; font-size: 1.2rem; margin-right: 12px; }

/* Grilla Responsiva */
.grid-content { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; margin-top: 25px; }
@media (max-width: 900px) {
  .grid-content { grid-template-columns: 1fr; gap: 30px; }
}

.info-group label { display: block; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; font-weight: 700; letter-spacing: 0.5px; }
.description-box { background: #f8fafc; border: 1px solid var(--border-color); padding: 20px; border-radius: 10px; line-height: 1.6; color: var(--text-main); font-size: 1rem; }

.history-group { margin-top: 35px; }
.history-group label { display: block; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 20px; font-weight: 700; letter-spacing: 0.5px; }

.timeline { margin-top: 20px; border-left: 2px solid #e2e8f0; padding-left: 35px; margin-left: 15px; }
.timeline-item { position: relative; margin-bottom: 35px; }
.timeline-dot { position: absolute; left: -42px; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: var(--text-muted); border: 3px solid #fff; box-shadow: 0 0 0 2px #e2e8f0; }
.timeline-avatar { position: absolute; left: -46px; top: 0px; background: #fff; color: var(--primary); font-size: 1.8rem; }

/* Estilos de Log */
.log-status { font-weight: 700; display: block; font-size: 0.95rem; color: var(--text-main); margin-bottom: 3px; }
.log-info { font-size: 0.8rem; color: var(--text-muted); }
.log-observation { border-radius: 6px; font-size: 0.85rem; font-style: italic; border-left: 3px solid var(--primary); background: #fff; padding: 12px 15px; margin-top: 10px; color: var(--text-main); }

/* Estilos de Chat Bubble */
.chat-bubble { background: #f0f7ff; padding: 15px 20px; border-radius: 0 12px 12px 12px; border: 1px solid #dbeafe; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.chat-header { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--primary); margin-bottom: 8px; }
.chat-time { color: var(--text-muted); font-size: 0.75rem; }
.chat-body { font-size: 0.95rem; color: var(--text-main); line-height: 1.5; white-space: pre-wrap; }
.chat-attachments { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
.attachment-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #fff; border: 1px solid var(--border-color); border-radius: 20px; font-size: 0.8rem; color: var(--primary); transition: 0.2s; cursor: pointer; }
.attachment-chip:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

/* Caja de Chat Input */
.chat-input-box { background: #fff; border-radius: 10px; border: 1px solid var(--border-color); padding: 20px !important; margin-top: 30px; }
.chat-input-box label { font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; display: block; letter-spacing: 0.5px; }
.chat-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
.file-upload-wrapper { position: relative; }
.file-input-hidden { position: absolute; left: -9999px; }
.btn-secondary { cursor: pointer; padding: 10px 18px; border: 1px solid var(--border-color); border-radius: 8px; background: #fff; color: var(--text-main); transition: 0.2s; font-size: 0.9rem; font-weight: 600; }
.btn-secondary:hover { background: #f8fafc; border-color: var(--text-muted); }
.selected-files { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
.file-chip { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.8rem; }
.btn-remove-file { background: none; border: none; color: var(--danger); cursor: pointer; margin-left: 10px; font-size: 0.9rem; }

/* Side Column */
.status-card { border-radius: 12px; border: 1px solid var(--border-color); padding: 25px !important; }
.bg-light-panel { background: #f8fafc !important; }
.data-point { margin-bottom: 20px; }
.data-point .label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 5px; letter-spacing: 0.5px; }
.data-point .value { color: var(--text-main); font-weight: 600; font-size: 0.95rem; }
.btn-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.4rem; transition: 0.2s; padding: 5px; }
.btn-close:hover { color: var(--danger); transform: rotate(90deg); }
.shadow-sm { box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.05); }
</style>
