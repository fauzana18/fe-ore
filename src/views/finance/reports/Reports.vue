<script src="./index.js"></script>

<template>
    <div class="flex flex-col">
        <div class="card">
            <div class="flex flex-row justify-between">
                <div class="font-semibold text-xl">Laporan Keuangan</div>

                <SelectButton style="height: 3rem;" v-model="selectedMode" :options="modes" optionLabel="name">
                    <template #option="slotProps">
                        <div>
                            <i class="pi" :class="slotProps.option.icon"></i>
                        </div>
                    </template>
                </SelectButton>
            </div>
            <div class="w-full items-center justify-center mt-10 md:mt-2">
                <div class="flex justify-between md:justify-start">
                    <p class="!m-0">Total Pengeluaran</p>
                    <p class="md:pl-6">{{formatCurrency(out)}}</p>
                </div>
                <Divider></Divider>
                <div class="flex justify-between md:justify-start">
                    <p class="!m-0 text-green-500">Total Pemasukan</p>
                    <p class="!m-0 text-green-500 md:pl-6">{{formatCurrency(income)}}</p>
                </div>
                <Divider></Divider>
                <div class="flex justify-between md:justify-start">
                    <p class="!m-0">Saldo</p>
                    <p class="!m-0 md:pl-6" :class="amountNegative ? 'text-red' : 'text-green-500'">{{formatCurrency(income - out)}}</p>
                </div>
                <Divider></Divider>
            </div>

            <Select size="large" v-model="range" :options="ranges" optionLabel="label" placeholder="Periode" class="w-full text-center mr-2 mt-2 mb-3 md:mt-0" @change="selectRange"/>
            
            <Dialog header="Atur Periode" v-model:visible="dateDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :dismissableMask="true" @hide="reselect">
                <div class="mb-4 flex flex-col">
                    <label for="name">Dari Tanggal</label><br>
                    <DatePicker size="large" fluid showIcon showButtonBar v-model="dateStart" dateFormat="dd MM yy"></DatePicker>
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="name">Sampai Tanggal</label><br>
                    <DatePicker size="large" showIcon showButtonBar fluid  v-model="dateEnd" dateFormat="dd MM yy"></DatePicker>
                </div>
                <template #footer>
                    <Button size="large" label="Cari" icon="pi pi-search" variant="text" @click="searchDate" />
                </template>
            </Dialog>
            
            <div v-if="selectedMode && selectedMode.code == 1" class="flex flex-col md:flex-row">
                <div class="w-full md:pr-2">
                    <DataTable :value="pengeluaran" :loading="loading">
                        <template #header>
                            <div class="font-semibold">Top Kategori Pengeluaran</div>
                        </template>
                        <template #empty>
                            Data kosong.
                        </template>
                        <template #loading>
                            Memuat data. Mohon tunggu.
                        </template>
                        <Column field="name" header="Kategori"></Column>
                        <Column field="amount" header="Jumlah" style="width:20%">
                            <template #body="slotProps">
                                <span>{{formatCurrency(slotProps.data.amount)}}</span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
                <div class="w-full mt-6 md:mt-0 md:pl-2">
                    <DataTable :value="pemasukan" :loading="loading">
                        <template #header>
                            <div class="font-semibold">Top Kategori Pemasukan</div>
                        </template>
                        <template #empty>
                            Data kosong.
                        </template>
                        <template #loading>
                            Memuat data. Mohon tunggu.
                        </template>
                        <Column field="name" header="Kategori"></Column>
                        <Column field="amount" header="Jumlah" style="width:20%">
                            <template #body="slotProps">
                                <span>{{formatCurrency(slotProps.data.amount)}}</span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <div v-else class="flex flex-col md:flex-row mt-3">
                <div class="mb-6 md:mb-0 md:w-1/2 md:pr-2">
                    <div class="flex flex-row justify-between items-center mb-3">
                        <h5 class="align-self-start !m-0">Grafik Kategori Pengeluaran</h5>
                        <i class="pi md:!hidden" :class="showLegend ? 'pi-filter' : 'pi-filter-slash'" style="cursor: pointer;" @click="toggleLegend"></i>
                    </div>
                    <Chart v-if="pengeluaran.length" type="pie" :data="pieData" :options="pieOptions" :key="'pie1' + rerender" />
                </div>
                <div class="md:w-1/2 md:pl-2">
                    <div class="flex justify-between items-center mb-3">
                        <h5 class="align-self-start !m-0">Grafik Kategori Pemasukan</h5>
                        <i class="pi !hidden md:!block" :class="showLegend ? 'pi-filter' : 'pi-filter-slash'" style="cursor: pointer;" @click="toggleLegend"></i>
                    </div>
                    <Chart v-if="pemasukan.length" type="pie" :data="pieData2" :options="pieOptions" :key="'pie2' + rerender" />
                </div>
            </div>

            <div v-if="selectedMode && selectedMode.code == 1" class="w-full items-center justify-center mt-10">
                <DataTable :value="monthly" :loading="loading" responsiveLayout="scroll">
                    <template #header>
                        <div class="font-semibold">Laporan Bulanan</div>
                    </template>
                    <template #empty>
                        Data kosong.
                    </template>
                    <template #loading>
                        Memuat data. Mohon tunggu.
                    </template>
                    <Column field="name" header="Bulan" headerClass="!p-2 md:!py-4 md:!px-3" bodyClass="!p-2 md:!py-4 md:!px-3">
                        <template #body="slotProps">
                            <span class="hidden md:block">{{slotProps.data.name}}</span>
                            <span class="block whitespace-nowrap md:hidden">{{slotProps.data.month}}-{{slotProps.data.year}}</span>
                        </template>
                    </Column>
                    <Column field="in" header="Pengeluaran" headerClass="!p-2 md:!py-4 md:!px-3" bodyClass="!p-2 md:!py-4 md:!px-3">
                        <template #body="slotProps">
                            <span>{{formatCurrency(slotProps.data.out)}}</span>
                        </template>
                    </Column>
                    <Column field="out" header="Pemasukan" headerClass="!p-2 md:!py-4 md:!px-3" bodyClass="!p-2 md:!py-4 md:!px-3">
                        <template #body="slotProps">
                            <span>{{formatCurrency(slotProps.data.in)}}</span>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <div v-else class="mt-6">
                <h5>Grafik Bulanan</h5>
                <Chart v-if="pemasukan.length" type="line" :data="lineData" :options="lineOptions" :height="lineHeight" />
            </div>
        </div>
    </div>
</template>
