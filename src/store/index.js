import Vue from 'vue';
import Vuex from 'vuex';
import CryptoJS from 'crypto-js';
import api from '../services/api';

Vue.use(Vuex);

const SECRET_KEY = "PatMan_Secure_Key_2026!"; // Llave secreta única para PatMan
const STORE_KEY = "_patman_session";

function encryptState(state) {
  try {
    const jsonState = JSON.stringify(state);
    return CryptoJS.AES.encrypt(jsonState, SECRET_KEY).toString();
  } catch (error) {
    console.error("Error encrypting PatMan state", error);
    return null;
  }
}

function decryptState() {
  try {
    const encrypted = localStorage.getItem(STORE_KEY);
    if (!encrypted) return null;
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const jsonState = decrypted.toString(CryptoJS.enc.Utf8);
    if (!jsonState) return null;
    return JSON.parse(jsonState);
  } catch (error) {
    console.error("Error decrypting PatMan state", error);
    localStorage.removeItem(STORE_KEY);
    return null;
  }
}

const initialState = {
  jwt_access_token: null,
  jwt_refresh_token: null,
  userData: null,
  userDisplayName: '',
  userEmail: '',
  userPhoto: '',
  delegated: 0,
  tickets: [],
  ticketsPagination: { page: 0, size: 10, totalElements: 0, totalPages: 0 },
  areas: [],
  subjects: [],
  users: [],
  loading: false
};

const persistedState = decryptState();
const state = persistedState ? Object.assign({}, initialState, persistedState) : initialState;

const store = new Vuex.Store({
  state,
  mutations: {
    SET_LOGIN_SUCCESS(state, payload) {
      state.jwt_access_token = payload.jwt_access_token;
      state.jwt_refresh_token = payload.jwt_refresh_token;
      state.userData = payload.userData;
      state.userDisplayName = payload.userDisplayName;
      state.userEmail = payload.userEmail;
      state.userPhoto = payload.userPhoto;
      if (payload.jwt_access_token) {
        localStorage.setItem('jwt_token', payload.jwt_access_token);
      }
    },
    SET_LOGOUT(state) {
      Object.keys(initialState).forEach(key => {
        state[key] = Array.isArray(initialState[key]) ? [] :
          (typeof initialState[key] === 'object' && initialState[key] !== null) ? { ...initialState[key] } : null;
      });
      localStorage.removeItem('jwt_token');
    },
    SET_USER_DATA(state, userData) {
      state.userData = userData;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_TICKETS(state, payload) {
      state.tickets = payload.content || payload || [];
      if (payload && payload.pageable !== undefined) {
        state.ticketsPagination = {
          page: payload.number,
          size: payload.size,
          totalElements: payload.totalElements,
          totalPages: payload.totalPages
        };
      }
    },
    SET_TICKET_DETAIL(state, ticket) {
      const idx = state.tickets.findIndex(t => t.id === ticket.id || t.codigo === ticket.codigo);
      if (idx !== -1) {
        Vue.set(state.tickets, idx, ticket);
      }
    },
    SET_AREAS(state, areas) {
      state.areas = areas;
    },
    SET_SUBJECTS(state, subjects) {
      state.subjects = subjects;
    },
    SET_USERS(state, users) {
      state.users = users;
    }
  },
  actions: {
    loginSuccess({ commit }, payload) {
      commit('SET_LOGIN_SUCCESS', payload);
    },
    logout({ commit }) {
      commit('SET_LOGOUT');
      localStorage.removeItem(STORE_KEY);
    },
    async fetchTickets({ commit }, params) {
      commit('SET_LOADING', true);
      try {
        const res = await api.get('/tickets', { params });
        const data = (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
        commit('SET_TICKETS', data);
      } catch (e) {
        console.error('Error fetching tickets', e);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async fetchTicketDetail({ commit }, id) {
      const res = await api.get(`/tickets/${id}`);
      const data = (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
      commit('SET_TICKET_DETAIL', data);
      return data;
    },
    async createTicket({ dispatch }, payload) {
      const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const res = await api.post('/tickets', payload, config);
      dispatch('fetchTickets');
      return (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
    },
    async fetchTicketMessages(_, ticketId) {
      const res = await api.get(`/tickets/${ticketId}/messages`);
      return (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
    },
    async sendTicketMessage(_, { id, formData }) {
      const res = await api.post(`/tickets/${id}/messages`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
    },
    async changeTicketStatus({ dispatch }, { id, status, observacion }) {
      const res = await api.patch(`/tickets/${id}/status`, { status, observacion });
      dispatch('fetchTickets');
      return (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
    },
    async assignTicket({ dispatch }, { id, responsableId }) {
      const res = await api.patch(`/tickets/${id}/assign`, { responsableId });
      dispatch('fetchTickets');
      return (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
    },
    async fetchAreas({ commit }) {
      try {
        const res = await api.get('/areas');
        const data = (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
        commit('SET_AREAS', data);
      } catch (e) {
        console.error('Error fetching areas', e);
      }
    },
    async createArea({ dispatch }, name) {
      await api.post('/areas', { nombre: name });
      dispatch('fetchAreas');
    },
    async deleteArea({ dispatch }, id) {
      await api.delete(`/areas/${id}`);
      dispatch('fetchAreas');
    },
    async fetchSubjects({ commit }) {
      try {
        const res = await api.get('/subjects');
        const data = (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
        commit('SET_SUBJECTS', data);
      } catch (e) {
        console.error('Error fetching subjects', e);
      }
    },
    async createSubject({ dispatch }, data) {
      await api.post('/subjects', data);
      dispatch('fetchSubjects');
    },
    async deleteSubject({ dispatch }, id) {
      await api.delete(`/subjects/${id}`);
      dispatch('fetchSubjects');
    },
    async fetchUsers({ commit }) {
      try {
        const res = await api.get('/users');
        const data = (res.data && res.data.data !== undefined) ? res.data.data : (res.data || res);
        commit('SET_USERS', data);
      } catch (e) {
        console.error('Error fetching users', e);
      }
    },
    async updateUserRole({ dispatch }, { userId, role }) {
      await api.patch(`/users/${userId}/role`, null, { params: { role } });
      dispatch('fetchUsers');
    },
    async updateUser({ dispatch }, user) {
      await api.put(`/users/${user.id}`, user);
      dispatch('fetchUsers');
    },
    async deleteUser({ dispatch }, userId) {
      await api.delete(`/users/${userId}`);
      dispatch('fetchUsers');
    }
  },
  getters: {
    isAuthenticated: state => !!state.jwt_access_token,
    isTokenExpired: state => {
      if (!state.jwt_access_token) return true;
      try {
        const payload = JSON.parse(atob(state.jwt_access_token.split('.')[1]));
        return Date.now() >= payload.exp * 1000;
      } catch (e) {
        return true;
      }
    },
    isAdmin: state => state.userData?.role === 'Administrador',
    isGestor: state => state.userData?.role === 'Gestionador',
    availableTickets: state => state.tickets
  }
});

store.subscribe((mutation, state) => {
  if (mutation.type === 'SET_LOGOUT') return;
  const encrypted = encryptState(state);
  if (encrypted) {
    localStorage.setItem(STORE_KEY, encrypted);
  }
  // Sincronizar siempre el jwt_token para el interceptor de api.js
  if (state.jwt_access_token) {
    localStorage.setItem('jwt_token', state.jwt_access_token);
  }
});

export default store;
