<script setup>
import { categoryStore, profileStore, saldoStore, planStore } from '@/store/finance';
import { onMounted } from 'vue';

onMounted(async () => {
    const profiles = profileStore()
    const category = categoryStore()
    const saldo = saldoStore()
    const plan = planStore()
    await profiles.getList()
    await category.getList()
    await saldo.getSaldo(profiles.list[profiles.selected].id)
    await plan.getPlanNextMonth()
})
</script>

<template>
    <router-view />
</template>

<style scoped></style>
