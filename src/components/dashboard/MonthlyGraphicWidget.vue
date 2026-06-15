<script setup>
import { useLayout } from '@/composables/layout';
import { saldoStore } from '@/store/finance.js';
import { onMounted, ref, watch } from 'vue';

const { layoutConfig, isDarkTheme, checkMobileView } = useLayout();
const saldo = saldoStore()

const chartData = ref(null);
const chartOptions = ref(null);
const showMonth = 6
const isMobile = ref(false);

function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    let months = [], data = { out: [], in: []}
    
    for(let i = showMonth - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(1)
        date.setMonth(date.getMonth() - i)
        const month = date.getMonth()
        const year = date.getFullYear()
        const selectedDate = `${month}_${year}`
        const selected = saldo.monthly[selectedDate]
        if(selected) {
            data.out.push(selected.pengeluaran)
            data.in.push(selected.pemasukan)
        }
        const monthLabels = `${monthNames[month]} ${year}`
        months.push(monthLabels)
    }

    return {
        labels: months,
        datasets: [
            {
                label: 'Pengeluaran',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                data: data.out,
                barThickness: isMobile.value ? 10 : 32,
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                },
                borderSkipped: true
            },
            {
                label: 'Pemasukan',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                data: data.in,
                barThickness: isMobile.value ? 10 : 32,
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                },
                borderSkipped: true
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: {
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        }
    };
}

watch([() => layoutConfig.primary, () => layoutConfig.surface, isDarkTheme], () => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

watch(saldo, () => {
  chartData.value = setChartData();
})

onMounted(() => {
    isMobile.value = checkMobileView()
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Grafik Bulanan</div>
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
    </div>
</template>
