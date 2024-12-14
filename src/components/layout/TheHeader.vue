// src/components/layout/TheHeader.vue
<template>
  <header class="w-full border-b border-gray-200">
    <div class="container mx-auto px-4 py-4">
      <nav class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="text-xl font-semibold text-gray-800">nameo.dev</div>
        </div>
        <div class="flex items-center space-x-6">
          <button class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
            Reports
          </button>
          <button class="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Login
          </button>
        </div>
      </nav>
    </div>
  </header>
</template>
