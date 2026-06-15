<script setup>
import { useFinance } from '@/composables/finance';
import FinanceService from '@/service/FinanceService';
import { profileStore } from '@/store/finance';
import { onMounted, ref, watch } from 'vue';

const { formatCurrency, dateHandler } = useFinance();
const financeService = new FinanceService()
const profiles = profileStore();
const transactions = ref(null);
const loading = ref(false);

const getList = async () => {
    loading.value = true
    const params = {
        limit: 5,
        offset: 0,
        order: ['created', 'DESC'],
        profile_id: profiles.list[profiles.selected] ? profiles.list[profiles.selected].id : 1
    }

    const list = await financeService.getTransactionList(params)
    transactions.value = list.data.result
    loading.value = false
}

watch(() => profiles.selected, async () => {
    await getList()
})

onMounted(async () => {
    await getList();
});
</script>

<template>
    <div class="card">
        <div class="flex-center-between">
            <div class="font-semibold text-xl">Transaksi Terbaru</div>
            <Button icon="pi pi-search" type="button" class="p-button-text" @click="$router.push({ name: 'transactions' })"></Button>
        </div>
        <DataTable :value="transactions" responsiveLayout="scroll" :loading="loading">
            <template #empty>
                Data kosong.
            </template>
            <template #loading>
                Memuat data. Mohon tunggu.
            </template>

            <Column header="Tanggal" style="padding: 1rem 1rem;">
                <template #body="slotProps">
                    {{dateHandler(slotProps.data.created, false)}}
                </template>
            </Column>
            <Column field="name" header="Judul" style="width:25%;"></Column>
            <Column field="amount" header="Jumlah" style="width:20%">
                <template #body="slotProps">
                    <span :class="slotProps.data.category.type == 'Pengeluaran' ? 'text-red' : 'text-green'">{{formatCurrency(slotProps.data.amount)}}</span>
                </template>
            </Column>
            <Column field="category" header="Kategori" style="width:25%">
                <template #body="slotProps">
                    {{slotProps.data.category.name}}
                </template>
            </Column>
        </DataTable>
    </div>
</template>
