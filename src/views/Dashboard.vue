<script setup>
import { onMounted, onUnmounted } from 'vue'
import MonthlyGraphicWidget from '@/components/dashboard/MonthlyGraphicWidget.vue';
import RecentTransactionsListWidget from '@/components/dashboard/RecentTransactionsListWidget.vue';
import RecentTransactionsWidget from '@/components/dashboard/RecentTransactionsWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { useLayout } from '@/composables/layout';
import { App } from '@capacitor/app'

const { checkMobileView } = useLayout();

let backHandler
onMounted(async () => {
    backHandler = await App.addListener('backButton', () => {
        App.exitApp()
    })
})

onUnmounted(() => {
    backHandler?.remove()
})
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

        <div class="flex md:hidden col-span-12 justify-between">
            <div class="p-2 w-full"><Button size="large" fluid label="Catatan" icon="pi pi-arrow-right" iconPos="right" severity="primary" as="router-link" to="/lifestyle/notes" /></div>
            <div class="p-2 w-full"><Button size="large" fluid label="Daftar Tugas" icon="pi pi-arrow-right" iconPos="right" severity="primary" as="router-link" to="/lifestyle/tasklist" /></div>
        </div>

        <div class="col-span-12 xl:col-span-6">
            <RecentTransactionsWidget v-if="!checkMobileView()" />
            <RecentTransactionsListWidget v-else />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <MonthlyGraphicWidget />
        </div>
    </div>
</template>
