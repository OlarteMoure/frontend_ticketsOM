<template>
  <div class="ticket-create">
    <div class="row">
      <div class="col-main">
        <div class="glass p-4 card">
          <h3 class="section-title">Información del Requerimiento</h3>
          
          <div class="form-group">
            <label>Título *</label>
            <input type="text" v-model="form.title" class="form-control" placeholder="Resumen corto de la solicitud">
          </div>

          <!-- Selector de Solicitante (solo para Admin o Gestor) -->
          <div class="form-group" v-if="isAdmin || isGestor">
            <label>Solicitante (Opcional - Crear a nombre de otro usuario)</label>
            <select v-model="form.solicitanteId" class="form-control">
              <option value="">Yo</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.email }}) - {{ user.role }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Área de Destino *</label>
              <select v-model="form.areaId" class="form-control" @change="onAreaChange">
                <option value="">Seleccione una opción</option>
                <option v-for="area in areas" :key="area.id" :value="area.id">
                  {{ area.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Asunto Específico *</label>
              <select v-model="form.subjectId" class="form-control" :disabled="!form.areaId">
                <option value="">Seleccione un asunto</option>
                <option v-for="sub in filteredSubjects" :key="sub.id" :value="sub.id">
                  {{ sub.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Descripción *</label>
            <textarea v-model="form.description" class="form-control" rows="6" placeholder="Detalle su solicitud aquí..."></textarea>
          </div>

          <div class="actions">
            <button class="btn-primary" @click="save" :disabled="!isValid">
              <i class="fas fa-save"></i> Crear Ticket
            </button>
          </div>
        </div>
      </div>

      <div class="col-side" v-if="selectedSubject">
        <div class="glass p-4 card info-card">
          <h4>Detalles de Gestión</h4>
          <div class="info-item">
            <label>Responsable</label>
            <p>{{ selectedSubject.responsible }}</p>
          </div>
          <div class="info-item">
            <label>Acuerdo de Servicio (ANS)</label>
            <p>{{ selectedSubject.ans }} horas hábiles</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccess" class="success-overlay">
      <div class="success-box glass animate-fade">
        <div class="icon-check">
          <i class="fas fa-check"></i>
        </div>
        <h2>¡Éxito!</h2>
        <p>El ticket <strong>{{ lastId }}</strong> ha sido creado.</p>
        <button class="btn-primary mt-3" @click="$router.push({name: 'reports'})">Ir a mis tickets</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'TicketCreate',
  data() {
    return {
      form: {
        title: '',
        areaId: '',
        subjectId: '',
        description: '',
        solicitanteId: ''
      },
      showSuccess: false,
      lastId: null
    }
  },
  computed: {
    ...mapState(['areas', 'subjects', 'users']),
    ...mapGetters(['isAdmin', 'isGestor']),
    filteredSubjects() {
      return this.subjects.filter(s => s.areaId === this.form.areaId);
    },
    selectedSubject() {
      return this.subjects.find(s => s.id === this.form.subjectId);
    },
    isValid() {
      return this.form.title && this.form.subjectId && this.form.description;
    }
  },
  async mounted() {
    if (this.isAdmin || this.isGestor) {
      await this.$store.dispatch('fetchUsers');
    }
  },
  methods: {
    onAreaChange() {
      this.form.subjectId = '';
    },
    async save() {
      const payload = {
        title: this.form.title,
        areaId: this.form.areaId,
        subjectId: this.form.subjectId,
        description: this.form.description
      };
      
      if ((this.isAdmin || this.isGestor) && this.form.solicitanteId) {
        payload.solicitanteId = this.form.solicitanteId;
      }

      const res = await this.$store.dispatch('createTicket', payload);
      this.lastId = res.codigo || res.id;
      this.showSuccess = true;
    }
  }
}
</script>

<style scoped>
.row { display: flex; gap: 20px; flex-wrap: wrap; }
.col-main { flex: 1; min-width: 300px; }
.col-side { width: 300px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem; font-weight: 500; }
.form-row { display: flex; gap: 15px; }
.form-row .form-group { flex: 1; }
.section-title { margin-bottom: 20px; color: var(--primary); font-weight: 700; }
.success-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.success-box { width: 350px; padding: 40px; text-align: center; border: none; }
.icon-check { width: 60px; height: 60px; background: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.5rem; color: #fff; }
.info-card h4 { color: var(--primary); margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
.info-item { margin-bottom: 15px; }
.info-item label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); }
.info-item p { font-weight: 600; color: var(--text-main); }

@media (max-width: 600px) {
  .form-row { flex-direction: column; gap: 0; }
  .col-side { width: 100%; }
}
</style>
