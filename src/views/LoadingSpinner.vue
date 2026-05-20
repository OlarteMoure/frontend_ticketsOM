<template>
    <div class="loading-overlay">
      <div class="spinner"></div>
    </div>
</template>

  
<script>
  
  export default {
    name: 'LoadingSpinner',
    data() {
      return {
        
      };
    },  
  };
</script>

<style>
/* Estilos del spinner */
.spinner {
  border: 12px solid #f3f3f3;
  /* Color claro del spinner */
  border-top: 12px solid #033364;
  /* Color de la parte que gira */
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: spin 1.5s linear infinite;
  /* Animación del giro */
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

</style>