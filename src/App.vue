// src/App.vue
<template>
  <div class="min-h-screen bg-gray-50">
    <TheHeader />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheHeader from './components/layout/TheHeader.vue'
</script>