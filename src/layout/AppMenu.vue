<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/'
            }
        ]
    },
    {
        label: 'Keuangan',
        path: '/finance',
        items: [
            {
                label: 'Catatan Keuangan',
                icon: 'pi pi-fw pi-money-bill',
                to: '/finance/transactions'
            },
            {
                label: 'Laporan Keuangan',
                icon: 'pi pi-fw pi-chart-line',
                to: '/finance/reports'
            },
            {
                label: 'Rencana Keuangan',
                icon: 'pi pi-fw pi-book',
                to: '/finance/plans'
            },
        ]
    },
    {
        label: 'Lifestyle',
        path: '/lifestyle',
        items: [
            {
                label: 'Catatan Olahraga',
                icon: 'pi pi-fw pi-bolt',
                to: '/lifestyle/workout'
            },
            {
                label: 'Manajemen Password',
                icon: 'pi pi-fw pi-lock',
                to: '/lifestyle/passwordmanagement'
            },
            {
                label: 'Catatan',
                icon: 'pi pi-fw pi-book',
                to: '/lifestyle/notes'
            },
        ]
    },
    
    
    {
        label: 'Pages',
        icon: 'pi pi-fw pi-briefcase',
        path: '/pages',
        items: [
            {
                label: 'Landing',
                icon: 'pi pi-fw pi-globe',
                to: '/landing'
            },
            {
                label: 'Empty',
                icon: 'pi pi-fw pi-circle-off',
                to: '/pages/empty'
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
