<script src="./index.js"></script>

<template>
    <div class="flex flex-col">
        <div class="card">
            <div class="font-semibold text-xl">Rencana Keuangan</div>
            
            <Toast/>

            <Toolbar class="mb-4 mt-8 !p-4" :pt="{start: {class: '!w-full md:!w-auto'}, center: {class: '!w-full md:!w-auto'}, end: {class: '!w-full md:!w-auto'}}">
                <template #start>
                    <Button size="large" fluid label="Tambah" icon="pi pi-plus" class="p-button-success md:mr-2" @click="openNew" />
                </template>

                <template #center>
                    <DatePicker size="large" fluid class="w-full" showIcon view="month" :showIcon="true" v-model="month" dateFormat="MM yy"></DatePicker>
                </template>

                <template #end>
                    <Button size="large" fluid label="Export" icon="pi pi-upload" class="p-button-help md:mr-2" @click="openExport()"  />
                </template>
            </Toolbar>

            <div class="flex items-center justify-between font-semibold md:mt-6 md:mb-6">
                <Button size="large" severity="info" icon="pi pi-arrow-left"  class="mr-2" @click="changeMonth('prev')" />
                <div>{{ monthTitle }}</div>
                <Button size="large" severity="info" icon="pi pi-arrow-right" class="mr-2" @click="changeMonth('next')" />
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
            
            <div class="flex flex-col md:flex-row">
                <div class="w-full md:pr-2">
                    <DataTable :value="pengeluaran" responsiveLayout="scroll" :loading="loading">
                        <template #header>
                            <div class="font-semibold">Pengeluaran</div>
                        </template>
                        <template #empty>
                            Data kosong.
                        </template>
                        <template #loading>
                            Memuat data. Mohon tunggu.
                        </template>
                        <Column field="name" header="Judul"></Column>
                        <Column field="amount" header="Jumlah" style="width:25%">
                            <template #body="slotProps">
                                <span>{{formatCurrency(slotProps.data.amount)}}</span>
                            </template>
                        </Column>
                        <Column style="width:15%">
                            <template #body="slotProps">
                                <div>
                                    <Button icon="pi pi-pencil" severity="success" rounded class="mr-2" @click="editPlan(slotProps.data)" />
                                    <Button icon="pi pi-trash" severity="warn" rounded class="mt-2" @click="confirmDeletePlan(slotProps.data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
                <div class="w-full mt-6 md:mt-0 md:pl-2">
                    <DataTable :value="pemasukan" responsiveLayout="scroll" :loading="loading">
                        <template #header>
                            <div class="font-semibold">Pemasukan</div>
                        </template>
                        <template #empty>
                            Data kosong.
                        </template>
                        <template #loading>
                            Memuat data. Mohon tunggu.
                        </template>
                        <Column field="name" header="Judul"></Column>
                        <Column field="amount" header="Jumlah" style="width:25%">
                            <template #body="slotProps">
                                <span>{{formatCurrency(slotProps.data.amount)}}</span>
                            </template>
                        </Column>
                        <Column style="width:15%">
                            <template #body="slotProps">
                                <div>
                                    <Button icon="pi pi-pencil" severity="success" rounded class="mr-2" @click="editPlan(slotProps.data)" />
                                    <Button icon="pi pi-trash" severity="warn" rounded class="mt-2" @click="confirmDeletePlan(slotProps.data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <Dialog v-model:visible="planDialog" :style="{width: '450px'}" :header="modalHeader" :modal="true" class="p-fluid" @hide="refresh">
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-2">Tipe</label>
                    <Select size="large" v-model="plan.type" :options="type" optionLabel="label" placeholder="Pilih Tipe" />
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="inventoryStatus" class="mb-2">Judul</label>
                    <InputText size="large" id="name" v-model="plan.name" :required="true" autofocus :class="{'p-invalid': submitted && !plan.name}" autocomplete="off" />
                    <small class="p-invalid" v-if="submitted && !plan.name">Judul harus diisi.</small>
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-2">Jumlah</label>
                    <InputNumber size="large" autocomplete="off" id="price" v-model="plan.amount" mode="currency" currency="IDR" locale="id-ID" :required="true" autofocus :class="{'p-invalid': submitted && !plan.amount}" />
                    <small class="p-invalid" v-if="submitted && !plan.amount">Jumlah harus diisi.</small>
                </div>
                <Message v-if="submitStatus" :severity="submitStatus" :closable="false">{{submitMessage}}</Message>

                <template #footer>
                    <Button size="large" variant="text" label="Batal" icon="pi pi-times" @click="hideDialog"/>
                    <Button size="large" variant="text" label="Simpan" icon="pi pi-check" :loading="submitting" @click="savePlan" :disabled="submitStatus == 'success'" />
                </template>
            </Dialog>

            <Dialog v-model:visible="deletePlanDialog" :style="{width: '450px'}" header="Konfirmasi" :modal="true">
                <div class="flex items-center justify-center">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span>Apakah anda yakin ingin menghapus <b>{{toDelete.name}}</b>?</span>
                </div>
                <template #footer>
                    <Button size="large" variant="text" label="Tidak" icon="pi pi-times" @click="deletePlanDialog = false"/>
                    <Button size="large" variant="text" label="Ya" icon="pi pi-check" :loading="submitting" @click="deletePlan" />
                </template>
            </Dialog>

            <Dialog header="Export" v-model:visible="exportDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :dismissableMask="true">
                <div class="mt-2 md:mt-0"><Select size="large" style="text-align: center;" v-model="exportRange" class="w-full" :options="range" optionLabel="label" placeholder="Tanggal" /></div>
                <div v-if="exportRange.code == 3" class="mt-4 mb-4 flex flex-col">
                    <label for="name" class="mb-2">Range Bulan</label>
                    <DatePicker size="large" fluid showIcon view="month" v-model="monthRange" selectionMode="range" dateFormat="MM yy"></DatePicker>
                </div>
                <Button fluid size="large" severity="help" :loading="exporting" label="Export" icon="pi pi-upload" class="mt-2" @click="exportExcel" :disabled="exportRange.code == 3 && !monthRange" />
            </Dialog>
        </div>
    </div>
</template>
