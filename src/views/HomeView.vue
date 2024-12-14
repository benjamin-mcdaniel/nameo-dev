// src/views/HomeView.vue
<template>
  <main>
    <div class="container mx-auto px-4 py-8">
      <SearchSection />
      <StatsGrid />
      <ChartsGrid />
    </div>
  </main>
</template>

<script setup lang="ts">
import SearchSection from '../components/dashboard/SearchSection.vue'
import StatsGrid from '../components/dashboard/StatsGrid.vue'
import ChartsGrid from '../components/dashboard/ChartsGrid.vue'
</script>