<script setup>
import { categoryStore, profileStore, saldoStore, planStore } from '@/store/finance';
import { vaultKeyStore } from '@/store/crypto.js';
import { useEncryptor } from '@/composables/encryptor';
import { ref, onMounted } from 'vue';

const { deriveVaultKey } = useEncryptor();
const loading = ref(true)
const profiles = profileStore()
const category = categoryStore()
const saldo = saldoStore()
const plan = planStore()
const vaultKey = vaultKeyStore()

onMounted(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
    const init = await Promise.all([
        profiles.getList(),
        category.getList(),
        plan.getPlanNextMonth(),
        deriveVaultKey(import.meta.env.VITE_PASSWORD, import.meta.env.VITE_SALT)
    ])
    vaultKey.setValue(init[3])
    await saldo.getSaldo(profiles.list[profiles.selected].id)
    loading.value = false
})
</script>

<template>
    <div v-if="loading" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
        <!-- <div class="rounded-xl p-6 shadow-lg">
        </div> -->
        <div class="w-60 h-60 border-20 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <span class="text-lg font-medium mt-4">Memuat data</span>
    </div>
    <router-view />
</template>

<style scoped></style>
