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
        <button 
          :class="['tab-btn', { active: activeTab === 'users' }]" 
          @click="activeTab = 'users'; loadUsers()"
        >Usuarios y Roles</button>
      </div>

      <!-- TAB: ÁREAS -->
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
              <td><button @click="deleteArea(area.id)" class="btn-icon text-danger"><i class="fas fa-trash"></i></button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB: ASUNTOS -->
      <div v-if="activeTab === 'subjects'" class="tab-content animate-fade">
         <div class="add-form glass p-4 mb-4 bg-light-panel">
            <h4 class="mb-3 text-primary">Nuevo Asunto</h4>
            <div class="grid-form-subjects">
              <div class="form-group">
                <label>Área</label>
                <select v-model="newSub.areaId" class="form-control shadow-sm">
                  <option value="">Seleccione Área</option>
                  <option v-for="a in areas" :key="a.id" :value="a.id">{{a.name}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Asunto</label>
                <input v-model="newSub.nombre" placeholder="Nombre del Asunto" class="form-control shadow-sm">
              </div>
              <div class="form-group">
                <label>SLA (Horas)</label>
                <input v-model.number="newSub.ansHoras" type="number" placeholder="ANS" class="form-control shadow-sm">
              </div>
              <div class="form-group">
                <label>Tipo ANS</label>
                <select v-model="newSub.tipoAns" class="form-control shadow-sm">
                  <option value="CALENDARIO">Calendario (24/7)</option>
                  <option value="HABIL">Hábil (Lun-Vie 8-18)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Responsable</label>
                <select v-model="newSub.responsableId" class="form-control shadow-sm">
                  <option value="">Sin asignar</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                </select>
              </div>
              <div class="form-group flex-end-btn">
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
              <th>Tipo</th>
              <th>Responsable</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in subjects" :key="sub.id">
              <td class="font-bold">{{ sub.name }}</td>
              <td>{{ getAreaName(sub.areaId) }}</td>
              <td>{{ sub.ans }}h</td>
              <td>
                <span :class="['badge', sub.tipoAns === 'HABIL' ? 'badge-paused' : 'badge-created']">
                  {{ sub.tipoAns === 'HABIL' ? 'Hábil' : 'Calendario' }}
                </span>
              </td>
              <td>{{ sub.responsible || 'Sin asignar' }}</td>
              <td><button @click="deleteSubject(sub.id)" class="btn-icon text-danger"><i class="fas fa-trash"></i></button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB: USUARIOS Y ROLES -->
      <div v-if="activeTab === 'users'" class="tab-content animate-fade">
        <table class="data-table shadow-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol Actual</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>#{{ u.id }}</td>
              <td class="font-bold">
                <div class="user-cell">
                  <div v-if="u.fotoUrl" class="user-photo">
                    <img :src="u.fotoUrl" :alt="u.name" />
                  </div>
                  <div v-else class="user-initials">{{ getInitials(u.name) }}</div>
                  <span>{{ u.name }}</span>
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>
                <span :class="['badge', getRoleBadge(u.role)]">{{ u.role }}</span>
              </td>
              <td>
                <span :class="['badge', u.activo ? 'badge-success' : 'badge-paused']">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="openEditUser(u)" class="btn-icon text-primary" title="Editar"><i class="fas fa-edit"></i></button>
                  <button @click="deleteUser(u.id)" class="btn-icon text-danger" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>

    <!-- User Edit Modal -->
    <div v-if="showUserModal" class="modal-backdrop">
      <div class="modal-content glass p-4" style="max-width: 400px; width: 100%;">
        <h3 class="mb-4 text-primary">Editar Usuario</h3>
        <div class="form-group mb-3">
          <label>Nombre</label>
          <input v-model="editingUser.name" class="form-control shadow-sm">
        </div>
        <div class="form-group mb-3">
          <label>Email</label>
          <input v-model="editingUser.email" class="form-control shadow-sm" type="email">
        </div>
        <div class="form-group mb-3">
          <label>Rol</label>
          <select v-model="editingUser.role" class="form-control shadow-sm">
            <option value="Administrador">Administrador</option>
            <option value="Gestionador">Gestionador</option>
            <option value="Básico">Básico</option>
          </select>
        </div>
        <div class="form-group mb-4">
          <label>Estado</label>
          <select v-model="editingUser.activo" class="form-control shadow-sm">
            <option :value="true">Activo</option>
            <option :value="false">Inactivo</option>
          </select>
        </div>
        <div class="d-flex gap-2" style="justify-content: flex-end;">
          <button @click="showUserModal = false" class="btn-secondary">Cancelar</button>
          <button @click="saveUser" class="btn-primary" :disabled="savingUser">
             <i class="fas fa-save" v-if="!savingUser"></i> <i class="fas fa-spinner fa-spin" v-else></i> Guardar
          </button>
        </div>
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
      newSub: { areaId: '', nombre: '', ansHoras: 24, tipoAns: 'CALENDARIO', responsableId: '' },
      gestores: [],
      showUserModal: false,
      editingUser: {},
      savingUser: false
    }
  },
  computed: {
    ...mapState(['areas', 'subjects', 'users'])
  },
  async mounted() {
    await this.loadUsers();
  },
  methods: {
    getAreaName(id) {
      const area = this.areas.find(a => a.id === id);
      return area ? area.name : 'N/A';
    },
    getInitials(name) {
      return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
    },
    getRoleBadge(role) {
      switch (role) {
        case 'Administrador': return 'badge-received';
        case 'Gestionador': return 'badge-created';
        case 'Básico': return 'badge-paused';
        default: return '';
      }
    },
    async loadUsers() {
      await this.$store.dispatch('fetchUsers');
    },
    async addArea() {
      if (!this.newArea) return;
      await this.$store.dispatch('createArea', this.newArea);
      this.newArea = '';
    },
    async deleteArea(id) {
      await this.$store.dispatch('deleteArea', id);
    },
    async addSubject() {
      if (!this.newSub.nombre || !this.newSub.areaId) return;
      const data = {
        areaId: this.newSub.areaId,
        nombre: this.newSub.nombre,
        ansHoras: this.newSub.ansHoras,
        tipoAns: this.newSub.tipoAns,
        responsableId: this.newSub.responsableId || null
      };
      await this.$store.dispatch('createSubject', data);
      this.newSub = { areaId: '', nombre: '', ansHoras: 24, tipoAns: 'CALENDARIO', responsableId: '' };
    },
    async deleteSubject(id) {
      await this.$store.dispatch('deleteSubject', id);
    },
    async changeRole(userId, newRole) {
      try {
        await this.$store.dispatch('updateUserRole', { userId, role: newRole });
      } catch (e) {
        alert(e.response?.data?.message || 'Error al cambiar el rol');
      }
    },
    openEditUser(user) {
      this.editingUser = { ...user };
      this.showUserModal = true;
    },
    async saveUser() {
      this.savingUser = true;
      try {
        await this.$store.dispatch('updateUser', this.editingUser);
        this.showUserModal = false;
      } catch (e) {
        alert(e.response?.data?.message || 'Error al actualizar usuario');
      } finally {
        this.savingUser = false;
      }
    },
    async deleteUser(userId) {
      if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
      try {
        await this.$store.dispatch('deleteUser', userId);
      } catch (e) {
        alert(e.response?.data?.message || 'Error al eliminar usuario. Puede que tenga tickets asociados.');
      }
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
.grid-form-subjects { display: grid; grid-template-columns: 1fr 2fr 0.7fr 1fr 1.2fr auto; gap: 15px; align-items: flex-end; }
.grid-form-subjects label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px; font-weight: 700; text-transform: uppercase; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }
.font-bold { font-weight: 600; color: #1a202c; }
.full-width { width: 100%; justify-content: center; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.mb-3 { margin-bottom: 1rem; }
.flex-end-btn { display: flex; align-items: flex-end; }

.role-select { width: 140px; padding: 6px 10px; font-size: 0.8rem; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.user-photo { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; }
.user-photo img { width: 100%; height: 100%; object-fit: cover; }
.user-initials { width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-content { background: #fff; border-radius: 12px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.action-buttons { display: flex; gap: 15px; align-items: center; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 5px; }

@media (max-width: 900px) {
  .grid-form-subjects { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 500px) {
  .grid-form-subjects { grid-template-columns: 1fr; }
}
</style>
