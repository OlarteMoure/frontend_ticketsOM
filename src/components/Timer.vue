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
    'ticket.status': {
      handler() {
        this.checkTimer();
      }
    }
  },
  mounted() {
    const start = new Date(this.ticket.createdAt).getTime();
    this.elapsedSeconds = Math.floor((Date.now() - start) / 1000);
    this.checkTimer();
  },
  beforeDestroy() {
    clearInterval(this.timerId);
  },
  methods: {
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
