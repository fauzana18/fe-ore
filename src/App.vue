<script setup>
// import router from '@/router/index';
import { categoryStore, profileStore, saldoStore, planStore } from '@/store/finance';
import { useEncryptor } from '@/composables/encryptor';
import { onMounted } from 'vue';

const { deriveVaultKey } = useEncryptor()
const profiles = profileStore()
const category = categoryStore()
const saldo = saldoStore()
const plan = planStore()

onMounted(async () => {
    // const main_path = router.options.routes[0].children.map(route => route.path)
    
    // if(main_path.includes(window.location.pathname) || window.location.pathname == '/') {
        
    // }
    // const init = await Promise.all([
    //     profiles.getList(),
    //     category.getList(),
    //     plan.getPlanNextMonth(),
    //     deriveVaultKey(import.meta.env.VITE_PASSWORD, import.meta.env.VITE_SALT)
    // ])
    deriveVaultKey(import.meta.env.VITE_PASSWORD, import.meta.env.VITE_SALT)
    await profiles.getList()
    await category.getList()
    await plan.getPlanNextMonth()
    await saldo.getSaldo(profiles.list[profiles.selected].id)
    // vaultKey.setValue(key)
})
</script>

<template>
    <!-- <div v-if="loading" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm"> -->
        <!-- <div class="rounded-xl p-6 shadow-lg">
        </div> -->
        <!-- <div class="w-60 h-60 border-20 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <span class="text-lg font-medium mt-4">Memuat data</span>
    </div> -->
    <router-view />
</template>

<style scoped></style>
