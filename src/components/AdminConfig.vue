<template>
  <div class="admin-config">
    <div class="glass p-5">
      <h2 class="mb-4"><i class="fas fa-cogs mr-2 text-primary"></i> Configuración del Sistema</h2>
      
      <div class="tabs mb-4">
        <button 
          :class="['tab-btn', { active: activeTab === 'areas' }]" 
          @click="activeTab = 'areas'"
        >Áreas</button>
        <button 
          :class="['tab-btn', { active: activeTab === 'subjects' }]" 
          @click="activeTab = 'subjects'"
        >Asuntos (ANS)</button>
      </div>

      <div v-if="activeTab === 'areas'" class="tab-content animate-fade">
        <div class="add-box mb-4">
          <input v-model="newArea" placeholder="Nombre de nueva área" class="form-control mr-2 shadow-sm" style="display:inline-block; width:auto;">
          <button @click="addArea" class="btn-primary"><i class="fas fa-plus"></i></button>
        </div>
        
        <table class="data-table shadow-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Área</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="area in areas" :key="area.id">
              <td>#{{ area.id }}</td>
              <td class="font-bold">{{ area.name }}</td>
              <td><button class="btn-icon text-danger"><i class="fas fa-trash"></i></button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'subjects'" class="tab-content animate-fade">
         <div class="add-form glass p-4 mb-4 bg-light-panel">
            <h4 class="mb-3 text-primary">Nuevo Asunto</h4>
            <div class="grid-form">
              <div class="form-group">
                <label>Área</label>
                <select v-model="newSub.areaId" class="form-control shadow-sm">
                  <option value="">Seleccione Área</option>
                  <option v-for="a in areas" :key="a.id" :value="a.id">{{a.name}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Asunto</label>
                <input v-model="newSub.name" placeholder="Nombre del Asunto" class="form-control shadow-sm">
              </div>
              <div class="form-group">
                <label>SLA (Horas)</label>
                <input v-model.number="newSub.ans" type="number" placeholder="ANS" class="form-control shadow-sm">
              </div>
              <div class="form-group">
                <label>Responsable</label>
                <input v-model="newSub.responsible" placeholder="Email" class="form-control shadow-sm">
              </div>
              <div class="form-group">
                <button @click="addSubject" class="btn-primary full-width">Registrar</button>
              </div>
            </div>
         </div>

         <table class="data-table shadow-sm">
          <thead>
            <tr>
              <th>Asunto</th>
              <th>Área</th>
              <th>ANS (h)</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in subjects" :key="sub.id">
              <td class="font-bold">{{ sub.name }}</td>
              <td>{{ getAreaName(sub.areaId) }}</td>
              <td>{{ sub.ans }}h</td>
              <td>{{ sub.responsible }}</td>
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
  name: 'AdminConfig',
  data() {
    return {
      activeTab: 'areas',
      newArea: '',
      newSub: { areaId: '', name: '', ans: 24, responsible: '' }
    }
  },
  computed: {
    ...mapState(['areas', 'subjects'])
  },
  methods: {
    getAreaName(id) {
      const area = this.areas.find(a => a.id === id);
      return area ? area.name : 'N/A';
    },
    addArea() {
      if (!this.newArea) return;
      this.areas.push({ id: Date.now(), name: this.newArea });
      this.newArea = '';
    },
    addSubject() {
      if (!this.newSub.name || !this.newSub.areaId) return;
      this.subjects.push({ id: Date.now(), ...this.newSub });
      this.newSub = { areaId: '', name: '', ans: 24, responsible: '' };
    }
  }
}
</script>

<style scoped>
.tabs { border-bottom: 2px solid var(--border-color); display: flex; gap: 30px; }
.tab-btn { background: none; border: none; color: var(--text-muted); padding: 12px 5px; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.3s; font-weight: 600; font-size: 0.9rem; }
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fff; border-radius: 8px; overflow: hidden; }
.data-table th { text-align: left; padding: 15px; border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }
.data-table td { padding: 15px; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
.data-table tr:hover { background: #f8fafc; }
.add-form { border-radius: 12px; }
.bg-light-panel { background: #f8fafc !important; }
.grid-form { display: grid; grid-template-columns: 1fr 2fr 0.5fr 1fr auto; gap: 15px; align-items: flex-end; }
.grid-form label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px; font-weight: 700; text-transform: uppercase; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }
.font-bold { font-weight: 600; color: #1a202c; }
.full-width { width: 100%; justify-content: center; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.mb-3 { margin-bottom: 1rem; }
</style>
