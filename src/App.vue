<script setup>
import { categoryStore, profileStore, saldoStore } from '@/store/finance';
import { onMounted } from 'vue';

onMounted(async () => {
    const profiles = profileStore()
    const category = categoryStore()
    const saldo = saldoStore()
    await profiles.getList()
    await category.getList()
    await saldo.getSaldo(profiles.list[profiles.selected].id)
})
</script>

<template>
    <router-view />
</template>

<style scoped></style>
