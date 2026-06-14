<script setup>
import { useFinance } from '@/composables/finance';
import FinanceService from '@/service/FinanceService';
import { saldoStore } from '@/store/finance.js';
import { onMounted, ref } from 'vue';

const { formatCurrency } = useFinance();
const financeService = new FinanceService()
const saldo = saldoStore()
const saldoAll = ref({})

onMounted(async () => {
  const response = await financeService.getSaldoAll()
  saldoAll.value = response.data
  saldoAll.value.amount = saldoAll.value.pemasukan - saldoAll.value.pengeluaran
  saldoAll.value.negative = saldoAll.value.pemasukan - saldoAll.value.pengeluaran < 0
})
</script>

<style scoped lang="scss">
@media screen and (max-width: 575px) {
    .blm {
        display: none;
    }
}
</style>

<template>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Saldo</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl" :class="saldo.in - saldo.out < 0 ? 'text-red' : 'text-green'">{{formatCurrency(saldo.in - saldo.out)}}</div>
                </div>
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-money-bill text-blue-500 text-xl!"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Saldo Total</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl" :class="saldoAll.negative ? 'text-red' : 'text-green'">{{formatCurrency(saldoAll.amount)}}</div>
                </div>
                <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-dollar text-orange-500 text-xl!"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3 blm">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Customers</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">28441</div>
                </div>
                <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-users text-cyan-500 text-xl!"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3 blm">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Comments</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">152 Unread</div>
                </div>
                <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-comment text-purple-500 text-xl!"></i>
                </div>
            </div>
            <!-- <span class="text-primary font-medium">85 </span>
            <span class="text-muted-color">responded</span> -->
        </div>
    </div>
</template>
