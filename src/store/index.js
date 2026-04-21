import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: JSON.parse(localStorage.getItem('ticket_user')) || null,
    tickets: JSON.parse(localStorage.getItem('ticket_items')) || [],
    areas: [
      { id: 1, name: 'Patentes' },
      { id: 2, name: 'Marcas' },
      { id: 3, name: 'Derecho de Autor' },
      { id: 4, name: 'Litigios' }
    ],
    subjects: [
      { id: 1, areaId: 1, name: 'Búsqueda de Prioridad', ans: 24, responsible: 'Juan Pérez' },
      { id: 2, areaId: 1, name: 'Redacción de Memoria', ans: 48, responsible: 'Juan Pérez' },
      { id: 3, areaId: 2, name: 'Registro de Marca Nuevo', ans: 12, responsible: 'Maria Garcia' },
      { id: 4, areaId: 4, name: 'Contestación de Demanda', ans: 72, responsible: 'Carlos Ruiz' }
    ],
    users: [
      { email: 'admin@firma.com', role: 'Administrador', name: 'Admin User' },
      { email: 'gestor@firma.com', role: 'Gestionador', name: 'Gestor Tickets' },
      { email: 'user@firma.com', role: 'Básico', name: 'Solicitante' }
    ]
  },
  getters: {
    isAdmin: state => state.user?.role === 'Administrador',
    isGestor: state => state.user?.role === 'Gestionador',
    availableTickets: state => {
      if (!state.user) return [];
      if (state.user.role === 'Administrador' || state.user.role === 'Gestionador') return state.tickets;
      return state.tickets.filter(t => t.createdBy === state.user.email);
    }
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      if (user) localStorage.setItem('ticket_user', JSON.stringify(user));
      else localStorage.removeItem('ticket_user');
    },
    ADD_TICKET(state, ticket) {
      state.tickets.push(ticket);
      localStorage.setItem('ticket_items', JSON.stringify(state.tickets));
    },
    UPDATE_TICKET(state, updatedTicket) {
      const index = state.tickets.findIndex(t => t.id === updatedTicket.id);
      if (index !== -1) {
        Vue.set(state.tickets, index, updatedTicket);
        localStorage.setItem('ticket_items', JSON.stringify(state.tickets));
      }
    }
  },
  actions: {
    login({ commit, state }, email) {
      const found = state.users.find(u => u.email === email) || {
        email: email,
        role: 'Básico',
        name: email.split('@')[0]
      };
      commit('SET_USER', found);
    },
    logout({ commit }) {
      commit('SET_USER', null);
    },
    createTicket({ commit, state }, payload) {
      const subject = state.subjects.find(s => s.id === payload.subjectId);
      const newTicket = {
        id: 'TK-' + Math.floor(Math.random() * 90000 + 10000),
        ...payload,
        subjectName: subject ? subject.name : 'Genérico',
        responsible: subject ? subject.responsible : 'Unassigned',
        status: 'Creado',
        createdAt: new Date().toISOString(),
        createdBy: state.user.email,
        logs: [{
          state: 'Creado',
          timestamp: new Date().toISOString(),
          user: state.user.name
        }],
        timers: {
          'Creado': 0
        }
      };
      commit('ADD_TICKET', newTicket);
      return newTicket;
    }
  }
})
