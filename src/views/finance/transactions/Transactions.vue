<!-- <script setup>
</script> -->

<script src="./index.js"></script>

<template>
    <div class="flex flex-col">
        <div class="card">
            <div class="font-semibold text-xl">Catatan Keuangan</div>

            <Toast/>

            <Toolbar class="mb-4 mt-8" style="padding: 1rem 1rem 1rem 1.5rem">
                <template v-slot:start>
                    <div class="my-2">
                        <Button label="Tambah" size="large" severity="success" icon="pi pi-plus" class="mr-2" @click="openNew" />
                        <Button label="Hapus" size="large" severity="danger" icon="pi pi-trash" @click="confirmDeleteSelected" :disabled="!selectedTransactions || !selectedTransactions.length" />
                    </div>
                </template>

                <template v-slot:end>
                    <Button label="Import" size="large" icon="pi pi-plus" class="mr-2 inline-block" @click="openDialog('Import')" />
                    <Button label="Export" size="large" severity="help" icon="pi pi-upload" class="mr-2" @click="openDialog('Export')"  />
                </template>
            </Toolbar>

            <Toolbar class="mb-4" style="border: 0;">
                <template v-slot:start>
                    <div class="my-2">
                        <Button label="Atur Kategori" size="large" severity="info" class="mr-2" @click="manageCategory" />
                    </div>
                    <SelectButton style="height: 3rem;" v-model="selectedMode" :options="modes" optionLabel="name" @change="changeView">
                        <template #option="slotProps">
                            <div>
                                <i class="pi" :class="slotProps.option.icon"></i>
                            </div>
                        </template>
                    </SelectButton>
                </template>

                <template v-slot:end>
                    <div class="my-2 mr-5 flex flex-col">
                        <span>Total Pengeluaran</span>
                        <span>Total Pemasukan</span>
                        <span>Saldo</span>
                    </div>
                    <div class="my-2 flex flex-col">
                        <span>{{formatCurrency(saldo.out)}}</span>
                        <span style="color: green;">{{formatCurrency(saldo.in)}}</span>
                        <span :style="amountNegative ? 'color: red;' : 'color: green;'">{{formatCurrency(saldo.in - saldo.out)}}</span>
                    </div>
                </template>
            </Toolbar>
            
            <DataTable v-if="selectedMode && selectedMode.code == 2" ref="dt" :value="transactions" :lazy="true" v-model:selection="selectedTransactions" dataKey="id" :paginator="true" :rows="10" :loading="loading" @sort="onSort($event)"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[5,10,25]" :pageLinkSize="3"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} transactions" responsiveLayout="stack" :totalRecords="totalRecords" @page="onPage($event)" :key="rerender">
                <template #header>
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div class="flex items-center">
                            <Button size="large" label="Refresh" icon="pi pi-refresh" severity="info" class="ml-2" @click="reload"/>
                        </div>
                        <div class="flex">
                            <Select size="large" v-model="filters.c_type" :options="category.type" optionLabel="name" placeholder="Tipe" class="mr-2 filter-width" @change="onFilter"/>
                            <Select size="large" v-if="filters.c_type" v-model="filters.category_id" :options="categoryOptionsFilter" optionLabel="name" placeholder="Kategori" class="mr-2 mt-2 md:mt-0 filter-width" @change="onFilter"/>
                            <Select size="large" v-model="filters.created" :options="range" optionLabel="label" placeholder="Tanggal" class="mr-2 mt-2 md:mt-0 filter-width" @change="onFilter"/>
                            <IconField>
                                <InputIcon class="pi pi-search" />
                                <InputText size="large" v-model="filters.name" placeholder="Pencarian..." @change="onFilter" />
                            </IconField>
                        </div>
                    </div>
                </template>
                <template #empty>
                    Data kosong.
                </template>
                <template #loading>
                    Memuat data. Mohon tunggu.
                </template>

                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column field="created" header="Tanggal" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                    <template #body="slotProps">
                        {{dateHandler(slotProps.data.created)}}
                    </template>
                </Column>
                <Column field="name" header="Judul" :sortable="true" headerStyle="width:30%; min-width:10rem;">
                    <template #body="slotProps">
                        {{slotProps.data.name}}
                    </template>
                </Column>
                <Column field="amount" header="Jumlah" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                    <template #body="slotProps">
                        {{formatCurrency(slotProps.data.amount)}}
                    </template>
                </Column>
                <Column field="category.type" header="Tipe" headerStyle="width:14%; min-width:8rem;">
                    <template #body="slotProps">
                        {{slotProps.data.category.type}}
                    </template>
                </Column>
                <Column field="category_id" header="Kategori" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                    <template #body="slotProps">
                        {{slotProps.data.category.name}}
                    </template>
                </Column>
                <Column headerStyle="min-width:10rem;">
                    <template #body="slotProps">
                        <div>
                            <Button size="large" icon="pi pi-pencil" severity="success" class="mr-2" rounded @click="editTransaction(slotProps.data)" />
                            <Button size="large" icon="pi pi-trash" severity="warn" class="mt-2" rounded @click="confirmDeleteTransaction(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>

            <DataTable v-else :value="transactions" rowGroupMode="subheader" groupRowsBy="created" dataKey="id" :key="'table2'+rerender"
                sortMode="single" sortField="created" :sortOrder="-1" responsiveLayout="stack" :loading="loading"
                :expandableRowGroups="true" v-model:expandedRowGroups="expandedRowGroups" @rowgroupExpand="onRowGroupExpand">
                <template #header>
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div class="flex items-center">
                            <Button size="large" label="Refresh" icon="pi pi-refresh" severity="info" class="ml-2" @click="reload"/>
                        </div>
                        <div class="flex">
                            <Select size="large" v-model="filters.c_type" :options="category.type" optionLabel="name" placeholder="Tipe" class="mr-2 filter-width" @change="onFilter"/>
                            <Select size="large" v-if="filters.c_type" v-model="filters.category_id" :options="categoryOptionsFilter" optionLabel="name" placeholder="Kategori" class="mr-2 mt-2 md:mt-0 filter-width" @change="onFilter"/>
                            <Select size="large" v-model="filters.created" :options="range" optionLabel="label" placeholder="Tanggal" class="mr-2 mt-2 md:mt-0 filter-width" @change="onFilter"/>
                            <IconField>
                                <InputIcon class="pi pi-search" />
                                <InputText size="large" v-model="filters.name" placeholder="Pencarian..." @change="onFilter" />
                            </IconField>
                        </div>
                    </div>
                </template>
                <template #empty>
                    Data kosong.
                </template>
                <template #loading>
                    Memuat data. Mohon tunggu.
                </template>
                <Column field="created" header="Representative"></Column>
                <Column field="name" header="Judul"></Column>
                <Column field="amount" header="Jumlah">
                    <template #body="slotProps">
                        {{formatCurrency(slotProps.data.amount)}}
                    </template>
                </Column>
                <Column field="category.type" header="Tipe"></Column>
                <Column field="category_id" header="Kategori">
                    <template #body="slotProps">
                        {{slotProps.data.category.name}}
                    </template>
                </Column>
                <Column headerStyle="min-width:10rem;">
                    <template #body="slotProps">
                        <div>
                            <Button size="large" icon="pi pi-pencil" severity="success" class="mr-2" rounded @click="editTransaction(slotProps.data)" />
                            <Button size="large" icon="pi pi-trash" severity="warn" class="mt-2" rounded @click="confirmDeleteTransaction(slotProps.data)" />
                        </div>
                    </template>
                </Column>
                <template #groupheader="slotProps">
                    <span>{{dateHandler(slotProps.data.created)}}</span>
                </template>
                <template #groupfooter="slotProps">
                    <div class="flex flex-row justify-end" style="width: 80%;">
                        <div class="my-1 mr-5 flex flex-col">
                            <span>Pengeluaran</span>
                            <span>Pemasukan</span>
                        </div>
                        <div class="my-1 flex flex-col">
                            <span>{{calculateAmount(slotProps.data.created, 'Pengeluaran')}}</span>
                            <span style="color: green;">{{calculateAmount(slotProps.data.created, 'Pemasukan')}}</span>
                        </div>
                    </div>
                </template>
            </DataTable>

            <Dialog :header="header2" v-model:visible="importDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :dismissableMask="true">
                <Button v-if="header2 == 'Import'" style="width: 100%;" label="Download Template" size="large" severity="success" icon="pi pi-download" class="mt-2" @click="downloadTemplate" />
                <FileUpload v-if="header2 == 'Import'" style="width: 100%;" mode="basic" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" :disabled="submitting"
                    :maxFileSize="1000000" label="Import" chooseLabel="Import" class="mt-2" :customUpload="true" @uploader="fileHandler" />
                <div v-else>
                    <Select size="large" style="width: 100%; text-align: center;" v-model="exportRange"  :options="range2" optionLabel="label" placeholder="Tanggal" class="mr-2 mt-2 md:mt-0"/>
                    <div v-if="exportRange.code == 6" class="field mt-4" style="display: block;">
                        <label for="name">Dari Tanggal</label><br>
                        <Calendar style="width: 100%;" :showIcon="true" :showButtonBar="true" v-model="dateStart" dateFormat="dd MM yy"></Calendar>
                    </div>
                    <div v-if="exportRange.code == 6" class="field">
                        <label for="name">Sampai Tanggal</label><br>
                        <Calendar style="width: 100%;" :showIcon="true" :showButtonBar="true" v-model="dateEnd" dateFormat="dd MM yy"></Calendar>
                    </div>
                    <Button :loading="exporting" style="width: 100%;" label="Export" size="large" severity="help" icon="pi pi-upload" class="mt-2" @click="exportExcel" :disabled="exportRange.code == 6 && !dateStart && !dateEnd" />
                </div>
            </Dialog>

            <Dialog header="Atur Tanggal" v-model:visible="dateDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :dismissableMask="true" @hide="reselect">
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-4">Dari Tanggal</label>
                    <DatePicker size="large" showIcon showButtonBar fluid v-model="dateStart" dateFormat="dd MM yy"></DatePicker>
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-4">Sampai Tanggal</label>
                    <DatePicker size="large" showIcon showButtonBar fluid v-model="dateEnd" dateFormat="dd MM yy"></DatePicker>
                </div>
                <template #footer>
                    <Button size="large" label="Cari" icon="pi pi-search" variant="text" @click="searchDate" />
                </template>
            </Dialog>

            <Dialog v-model:visible="transactionDialog" :style="{width: '450px'}" :header="modalHeader" :modal="true" class="p-fluid" @hide="refresh">
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-4">Tanggal</label>
                    <DatePicker size="large" showIcon showButtonBar fluid v-model="transaction.created" dateFormat="dd MM yy"></DatePicker>
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-4">Tipe</label>
                    <Select size="large" v-model="transaction.type" :options="category.type" optionLabel="name" placeholder="Pilih Tipe" />
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-4">Kategori</label>
                    <Select size="large" v-model="transaction.category" :options="categoryOptions" optionLabel="name" placeholder="Pilih Kategori" />
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="inventoryStatus" class="mb-4">Judul</label>
                    <InputText id="name" size="large" v-model="transaction.name" required="true" autofocus :class="{'p-invalid': submitted && !transaction.name}" autocomplete="off" />
                    <small class="p-invalid" v-if="submitted && !transaction.name">Judul harus diisi.</small>
                </div>
                <div class="mb-4 flex flex-col">
                    <label for="price" class="mb-4">Jumlah</label>
                    <InputNumber autocomplete="off" id="price" size="large" v-model="transaction.amount" mode="currency" currency="IDR" locale="id-ID" required="true" autofocus :class="{'p-invalid': submitted && !transaction.amount}" />
                    <small class="p-invalid" v-if="submitted && !transaction.amount">Jumlah harus diisi.</small>
                </div>
                <Message v-if="submitStatus" :severity="submitStatus" :closable="false">{{submitMessage}}</Message>

                <template #footer>
                    <Button size="large" label="Batal" icon="pi pi-times" variant="text" @click="hideDialog"/>
                    <Button size="large" label="Simpan" icon="pi pi-check" variant="text" :loading="submitting" @click="saveTransaction" :disabled="submitStatus == 'success'" />
                </template>
            </Dialog>

            <Dialog v-model:visible="deleteTransactionDialog" :style="{width: '450px'}" header="Konfirmasi" :modal="true">
                <div class="flex items-center justify-center">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span>Apakah anda yakin ingin menghapus <b>{{toDelete.name}}</b>?</span>
                </div>
                <template #footer>
                    <Button size="large" label="Tidak" icon="pi pi-times" variant="text" @click="deleteTransactionDialog = false"/>
                    <Button size="large" label="Ya" icon="pi pi-check" :loading="submitting" variant="text" @click="deleteTransaction" />
                </template>
            </Dialog>

            <Dialog v-model:visible="deleteTransactionsDialog" :style="{width: '450px'}" header="Konfirmasi" :modal="true">
                <div class="flex items-center justify-center">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span>Apakah anda yakin ingin menghapus transaksi yang dipilih?</span>
                </div>
                <template #footer>
                    <Button size="large" label="Tidak" icon="pi pi-times" variant="text" @click="deleteTransactionsDialog = false"/>
                    <Button size="large" label="Ya" icon="pi pi-check" :loading="submitting" variant="text" @click="deleteSelectedTransactions" />
                </template>
            </Dialog>

            <Dialog v-model:visible="categoryDialog" :style="{width: '450px'}" header="Atur Kategori" :modal="true" class="p-fluid" :dismissableMask="true" :key="'dialog'+rerender">
                <div class="mb-4 flex flex-col">
                    <label for="name" class="mb-4">Tipe</label>
                    <Select size="large" v-model="cat.type" :options="category.type" optionLabel="name" placeholder="Pilih Tipe" />
                </div>
                <div class="field">
                    <label for="description" class="mb-4">Kategori</label>
                    <Card v-for="(items, i) of categoryOptions" :key="i">
                        <template v-slot:content>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <p v-if="!editCategoryField[i]" class="line-height-3 m-0">{{items.name}}</p>
                                <InputText v-else style="width: 70%;" v-model="cat.name" required="true" :class="{'p-invalid': submitted && !cat.name}" autocomplete="off" />
                                <div>
                                    <Button size="large" :severity="editCategoryField[i] ? 'secondary' : 'success'" :icon="editCategoryField[i] ? 'pi pi-times' : 'pi pi-pencil'" class="mr-2" rounded @click="toggleEditCategory(i)" />
                                    <ConfirmPopup style="white-space: pre-line"></ConfirmPopup>
                                    <Button size="large" severity="warn" v-if="!editCategoryField[i]" icon="pi pi-trash" :loading="deletingCategory" rounded @click="confirmDeleteCategory($event, i)"/>
                                    <Button size="large" severity="primary" v-else icon="pi pi-check" :loading="submittingCategory" rounded @click="saveCategory(i)"/>
                                </div>
                            </div>
                        </template>
                    </Card>
                    <Card >
                        <template v-slot:content>
                            <div>
                                <Button v-if="!newCategoryField" style="width: 100%;" icon="pi pi-plus" label="Tambah Baru" size="large" severity="success" @click="toggleAddCategory()"/>
                                <div v-else class="flex items-center justify-between">
                                    <InputText class="input-cat" v-model="cat.name" required="true" :class="{'p-invalid': submitted && !cat.name}" autocomplete="off" />
                                    <div>
                                        <Button icon="pi pi-times" size="large" severity="secondary" class="mr-2" rounded @click="toggleAddCategory()" />
                                        <Button icon="pi pi-check" size="large" severity="primary" :loading="submittingCategory" rounded @click="saveCategory()"/>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </Dialog>
        </div>
    </div>
</template>
