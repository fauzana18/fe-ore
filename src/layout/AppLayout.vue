<script setup>
import { useLayout } from '@/composables/layout';
import { computed, onMounted } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
import { categoryStore, profileStore, saldoStore, planStore } from '@/store/finance';
import { useEncryptor } from '@/composables/encryptor';

const { deriveVaultKey } = useEncryptor()
const profiles = profileStore()
const category = categoryStore()
const saldo = saldoStore()
const plan = planStore()
const { layoutConfig, layoutState, openMobileMenu, hideMobileMenu } = useLayout();

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.mobileMenuActive,
        'layout-static-inactive': layoutState.staticMenuInactive
    };
});

onMounted(async () => {
    deriveVaultKey(import.meta.env.VITE_PASSWORD, import.meta.env.VITE_SALT)
    await profiles.getList()
    await category.getList()
    await plan.getPlanNextMonth()
    await saldo.getSaldo(profiles.list[profiles.selected].id)
})
</script>

<template>
    <!-- <div v-if="loading" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm"> -->
        <!-- <div class="rounded-xl p-6 shadow-lg">
        </div> -->
        <!-- <div class="w-60 h-60 border-20 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <span class="text-lg font-medium mt-4">Memuat data</span>
    </div> -->
    <div class="layout-wrapper" :class="containerClass" v-touch:swipe.right="openMobileMenu">
        <AppTopbar />
        <AppSidebar />
        <div class="layout-main-container !px-[5px] md:!px-8">
            <div class="layout-main">
                <router-view />
            </div>
            <AppFooter />
        </div>
        <div class="layout-mask animate-fadein" @click="hideMobileMenu" />
    </div>
    <Toast />
</template>
