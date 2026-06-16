<script setup>
import MonthlyGraphicWidget from '@/components/dashboard/MonthlyGraphicWidget.vue';
import RecentTransactionsListWidget from '@/components/dashboard/RecentTransactionsListWidget.vue';
import RecentTransactionsWidget from '@/components/dashboard/RecentTransactionsWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { useLayout } from '@/composables/layout';

const { checkMobileView } = useLayout();
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

        <div class="col-span-12 xl:col-span-6">
            <RecentTransactionsWidget v-if="!checkMobileView()" />
            <RecentTransactionsListWidget v-else />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <MonthlyGraphicWidget />
        </div>
    </div>
</template>
