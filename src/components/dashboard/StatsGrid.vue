// src/components/dashboard/StatsGrid.vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div v-for="stat in stats" :key="stat.title" class="bg-white p-6 rounded-lg border border-gray-200">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-gray-600 mb-1">{{ stat.title }}</p>
          <p class="text-2xl font-semibold text-gray-800">{{ stat.value }}</p>
        </div>
      </div>
      <p class="text-green-600 text-sm mt-2">{{ stat.trend }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const stats = [
  {
    title: 'Total Domains Tracked',
    value: '124,853',
    trend: '+12.3% this month'
  },
  {
    title: 'Average Registration Age',
    value: '5.2 years',
    trend: '+0.8 years from 2023'
  },
  {
    title: 'Market Value Index',
    value: '789.4',
    trend: '+23.5 points'
  }
]
</script>