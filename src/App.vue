<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary: #003162;
  --primary-hover: #004a94;
  --bg-light: #f4f7fa;
  --card-bg: #ffffff;
  --border-color: #d1d9e6;
  --text-main: #2d3748;
  --text-muted: #718096;
  --success: #2f855a;
  --warning: #c05621;
  --danger: #c53030;
  --sidebar-width: 260px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-light);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar Customization */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Glassmorphism Re-imagined for Light Mode (Clean shadows) */
.glass {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade {
  animation: fadeIn 0.4s ease-out forwards;
}

/* Global Button Styles */
.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 49, 98, 0.2);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Inputs */
.form-control {
  width: 100%;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-main);
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 49, 98, 0.1);
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-created { background: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
.badge-received { background: #e6fffa; color: #2c7a7b; border: 1px solid #b2f5ea; }
.badge-paused { background: #fffaf0; color: #9c4221; border: 1px solid #feebc8; }
.badge-success { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }

/* Layout Utilities */
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.text-muted { color: var(--text-muted); }
.p-4 { padding: 1.5rem; }
.p-5 { padding: 2rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-3 { margin-right: 1rem; }
.mt-3 { margin-top: 1rem; }
</style>
