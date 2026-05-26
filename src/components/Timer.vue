<template>
  <div :class="['timer-display', { 'overdue': isOverdue }]">
    <i class="far fa-clock"></i>
    <span>{{ displayTime }}</span>
  </div>
</template>

<script>
export default {
  name: 'Timer',
  props: {
    ticket: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      elapsedSeconds: 0,
      timerId: null
    }
  },
  computed: {
    displayTime() {
      const h = Math.floor(this.elapsedSeconds / 3600);
      const m = Math.floor((this.elapsedSeconds % 3600) / 60);
      const s = this.elapsedSeconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },
    isOverdue() {
      const ansHours = this.ticket.ans || 24;
      const ansSeconds = ansHours * 3600;
      return this.elapsedSeconds > ansSeconds;
    }
  },
  watch: {
    ticket: {
      immediate: true,
      deep: true,
      handler() {
        this.calculateElapsed();
        this.checkTimer();
      }
    }
  },
  beforeDestroy() {
    clearInterval(this.timerId);
  },
  methods: {
    calculateElapsed() {
      const parseDate = (val) => {
        if (!val) return 0;
        if (Array.isArray(val)) {
          return new Date(val[0], val[1] - 1, val[2], val[3] || 0, val[4] || 0, val[5] || 0).getTime();
        }
        return new Date(val).getTime();
      };

      const start = parseDate(this.ticket.createdAt);
      if (start <= 0) {
        this.elapsedSeconds = 0;
        return;
      }

      // Construir la línea de tiempo de estados
      const events = [];
      events.push({ state: 'Creado', time: start });

      for (const log of this.ticket.logs || []) {
        const logTime = parseDate(log.timestamp);
        if (logTime > 0) {
          events.push({ state: log.state, time: logTime });
        }
      }

      // Ordenar eventos por fecha ascendente
      events.sort((a, b) => a.time - b.time);

      // Añadir evento final (momento actual o cierre)
      const endTime = (this.ticket.status === 'Cerrado')
        ? (parseDate(this.ticket.closedAt) || Date.now())
        : Date.now();
      events.push({ state: this.ticket.status, time: endTime });

      // Calcular el tiempo activo acumulado (excluyendo Pausado y Cerrado)
      let totalActiveSeconds = 0;
      for (let i = 0; i < events.length - 1; i++) {
        const duration = Math.max(0, events[i + 1].time - events[i].time) / 1000;
        const state = events[i].state;
        if (state === 'Creado' || state === 'En Proceso') {
          totalActiveSeconds += duration;
        }
      }

      this.elapsedSeconds = Math.floor(totalActiveSeconds);
    },
    checkTimer() {
      clearInterval(this.timerId);
      if (this.ticket.status !== 'Pausado' && this.ticket.status !== 'Cerrado') {
        this.timerId = setInterval(() => {
          this.elapsedSeconds++;
        }, 1000);
      }
    }
  }
}
</script>

<style scoped>
.timer-display {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #edf2f7;
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
  border: 1px solid #e2e8f0;
  font-weight: 600;
}
.overdue {
  color: #c53030;
  background: #fff5f5;
  border-color: #feb2b2;
}
</style>
