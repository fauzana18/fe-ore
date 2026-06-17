<script setup>
import { ref, onMounted, nextTick, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router'
import { useToast } from "primevue/usetoast";
import { useLayout } from '@/composables/layout';
import { useEncryptor } from '@/composables/encryptor';
import { useFinance } from '@/composables/finance';
import { vaultKeyStore } from '@/store/crypto.js'
import DatamgtService from '@/service/DatamgtService';
import { FilterMatchMode } from '@primevue/core/api';

const filters = ref(null);
const datamgtService = new DatamgtService()
const { topbarImage } = useLayout();
const { dateHandler } = useFinance();
const { deriveVaultKey, encryptVaultItem, decryptVaultItem } = useEncryptor();
const key = ref(null)
const toast = useToast();
const router = useRouter()
const passwordDialog = ref(true)
const dataDialog = ref(false)
const deleteDialog = ref(false)
const historyDialog = ref(false)
const password = ref('')
const data = ref([])
const loading = ref(false)
const input_data = ref({})
const toDelete = ref({})
const modalHeader = ref('')
const historyHeader = ref('')
const submitted = ref(false)
const submitting = ref(false)
const submitStatus = ref('')
const submitMessage = ref('')
const history_data = ref([])
const inputRef = ref()
const loadingHistory = ref(false)
const vaultKey = vaultKeyStore()
const selectedData = ref({})

onMounted(async () => {
    await nextTick()
    inputRef.value.$el.focus()
})

onBeforeMount(() => {
    initFilters();
});

const initFilters = () => {
    filters.value = {
        webapp: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

const checkPassword = async () => {
    if(password.value === import.meta.env.VITE_PASSWORD) {
        passwordDialog.value = false

        if(vaultKey.key) {
            key.value = vaultKey.key
        } else {
            await new Promise(resolve => setTimeout(resolve, 0))
            key.value = await deriveVaultKey(import.meta.env.VITE_PASSWORD, import.meta.env.VITE_SALT)
            vaultKey.setValue(key.value)
        }
        
        getData()
    } else {
        router.push({name: 'dashboard'})
    }
}

const getData = async () => {
    loading.value = true
    const list = await datamgtService.getVault()
    const dataRaw = list.data.result
    const dataEncrypted = dataRaw.map(d => {
        const {nonce, ciphertext} = d
        return {nonce, ciphertext}
    })
    const dataDecrypted = await Promise.all(dataEncrypted.map(d => decryptVaultItem(d, key.value)))
    data.value = dataRaw.map((d, i) => {
        return {id: d.id, webapp: d.webapp, username: dataDecrypted[i].username, password: dataDecrypted[i].password}
    })
    loading.value = false
}

const openInputDialog = (params) => {
    if(!params) {
        modalHeader.value = 'Tambah Data'
        input_data.value = {webapp: '', username: '', password: ''}
    } else {
        modalHeader.value = 'Ubah Data'
        input_data.value = {...params}
    }
    submitStatus.value = ''
    submitted.value = false
    dataDialog.value = true
}
const saveData = async () => {
    let res
    submitted.value = true
    submitting.value = true

    if(!input_data.value.webapp || !input_data.value.password) {
        submitting.value = false
        return
    }
    
    try {
        const encrypted = await encryptVaultItem({username: input_data.value.username, password: input_data.value.password}, key.value)
        const body = {webapp: input_data.value.webapp, ...encrypted}
        if(!input_data.value.id) res = await datamgtService.createVault(body)
        else res = await datamgtService.updateVault(body, input_data.value.id)

        if(res.status == 200) {
            submitStatus.value = 'success'
            submitMessage.value = res.data.message
            dataDialog.value = false
            toast.add({severity: 'success', summary: 'Sukses', detail: res.data.message, life: 3000})
        }
        else {
            submitStatus.value = 'error'
            submitMessage.value = res.data.message
        }
    }
    catch(err) {
        console.log(err)
        submitStatus.value = 'error'
        submitMessage.value = err.response ? err.response.data.message : 'Data gagal dibuat.'
    }

    submitting.value = false
}

const confirmDeleteData = (params) => {
    toDelete.value = params
    deleteDialog.value = true
}

const deleteData = async () => {
    let stat, message, summary
    submitting.value = true

    try {
        const res = await datamgtService.deleteVault(toDelete.value.id)

        if(res.status == 200) {
            stat = 'success'
            message = res.data.message
            summary = 'Sukses'
        }
        else {
            stat = 'error'
            message = res.data.message
            summary = 'Gagal'
        }
    }
    catch(err) {
        console.log(err)
        stat = 'error'
        message = err.response ? err.response.data.message : 'Data gagal dihapus.'
        summary = 'Gagal'
    }

    deleteDialog.value = false
    toast.add({severity: stat, summary, detail: message, life: 3000})
    submitting.value = false
    if(stat == 'success') await getData()
}

const getHistory = async (params) => {
    selectedData.value = params
    history_data.value = []
    historyHeader.value = `Data ${params.webapp}`
    historyDialog.value = true

    loadingHistory.value = true
    const history = await datamgtService.getVaultHistory(params.id)
    const dataRaw = history.data.result
    const dataEncrypted = dataRaw.map(d => {
        const {nonce, ciphertext} = d
        return {nonce, ciphertext}
    })
    const dataDecrypted = await Promise.all(dataEncrypted.map(d => decryptVaultItem(d, key.value)))
    history_data.value = dataRaw.map((d, i) => {
        return {username: dataDecrypted[i].username, password: dataDecrypted[i].password, date: d.created}
    })
    loadingHistory.value = false
}

const refresh = async () => {
    if(submitStatus.value == 'success') await getData()
}
</script>

<template>
    <div class="flex flex-col">
        <div class="card">
			<div class="font-semibold text-xl">Password Management</div>

            <Toast/>

            <div class="flex w-full mt-4 mb-6 flex-col md:flex-row md:justify-between">
                <Button size="large" label="Tambah Data Baru" icon="pi pi-plus" severity="success" class="float-right w-full md:w-auto mb-4 md:mb-0" @click="openInputDialog()"/>
                <IconField class="mb-3 md:mb-0">
                    <InputIcon class="pi pi-search" />
                    <InputText size="large" placeholder="Cari Web / Aplikasi" class="w-full md:w-auto" v-model="filters['webapp'].value" />
                </IconField>
            </div>

            <DataTable :value="data" :loading="loading" v-model:filters="filters" :filters="filters">
                <template #empty>
                    Data kosong.
                </template>
                <template #loading>
                    Memuat data. Mohon tunggu.
                </template>
                <Column field="webapp" :pt="{headerCell: {class: '!p-0 md:!py-3 md:!px-4'}}">
                    <template #header>
                        <span class="hidden md:inline">Web / Aplikasi</span>
                    </template>
                    <template #body="slotProps">
                        <div class="md:block">
                            <div class="hidden md:block">
                                {{ slotProps.data.webapp }}
                            </div>

                            <div class="md:hidden">
                                <div class="flex justify-between items-center mb-4">
                                    <div class="font-semibold">Web / Aplikasi</div>
                                    <div class="w-[55%] truncate text-right">{{ slotProps.data.webapp }}</div>
                                </div>
                                <div class="flex justify-between items-center mb-4">
                                    <div class="font-semibold">Username</div>
                                    <div>{{ slotProps.data.username.slice(0, 5) }}...</div>
                                </div>
                                <div class="flex justify-between items-center mb-4">
                                    <div class="font-semibold">Password</div>
                                    <div>{{ slotProps.data.password.slice(0, 5) }}...</div>
                                </div>
                                <div class="flex justify-between items-center">
                                    <div></div>
                                    <div>
                                        <Button icon="pi pi-search" severity="info" class="mr-2" rounded @click="getHistory(slotProps.data)" />
                                        <Button icon="pi pi-pencil" severity="success" rounded class="mr-2" @click="openInputDialog(slotProps.data)" />
                                        <Button icon="pi pi-trash" severity="warn" rounded @click="confirmDeleteData(slotProps.data)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="username" header="Username" class="hidden md:table-cell" headerStyle="width:30%;">
                    <template #body="slotProps">
                        <span>{{ slotProps.data.username.slice(0, 5) }}...</span>
                    </template>
                </Column>
                <Column field="password" header="Password" class="hidden md:table-cell" headerStyle="width:25%;">
                    <template #body="slotProps">
                        <span>{{ slotProps.data.password.slice(0, 5) }}...</span>
                    </template>
                </Column>
                <Column class="hidden md:table-cell" headerStyle="width:15%;">
                    <template #body="slotProps">
                        <div>
                            <Button size="large" icon="pi pi-search" severity="info" class="mr-2" rounded @click="getHistory(slotProps.data)" />
                            <Button size="large" icon="pi pi-pencil" severity="success" class="mr-2" rounded @click="openInputDialog(slotProps.data)" />
                            <Button size="large" icon="pi pi-trash" severity="warn" rounded @click="confirmDeleteData(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="passwordDialog" pt:root:class="!border-0 !bg-transparent" pt:mask:class="backdrop-blur-sm">
            <template #container>
                <div class="flex flex-col px-8 py-8 gap-6 rounded-2xl" style="background-image: radial-gradient(circle at left top, var(--p-primary-400), var(--p-primary-700))">
                    <!-- <svg width="35" height="40" viewBox="0 0 35 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="block mx-auto">
                        <path
                            d="M25.87 18.05L23.16 17.45L25.27 20.46V29.78L32.49 23.76V13.53L29.18 14.73L25.87 18.04V18.05ZM25.27 35.49L29.18 31.58V27.67L25.27 30.98V35.49ZM20.16 17.14H20.03H20.17H20.16ZM30.1 5.19L34.89 4.81L33.08 12.33L24.1 15.67L30.08 5.2L30.1 5.19ZM5.72 14.74L2.41 13.54V23.77L9.63 29.79V20.47L11.74 17.46L9.03 18.06L5.72 14.75V14.74ZM9.63 30.98L5.72 27.67V31.58L9.63 35.49V30.98ZM4.8 5.2L10.78 15.67L1.81 12.33L0 4.81L4.79 5.19L4.8 5.2ZM24.37 21.05V34.59L22.56 37.29L20.46 39.4H14.44L12.34 37.29L10.53 34.59V21.05L12.42 18.23L17.45 26.8L22.48 18.23L24.37 21.05ZM22.85 0L22.57 0.69L17.45 13.08L12.33 0.69L12.05 0H22.85Z"
                            fill="var(--p-primary-700)"
                        />
                        <path
                            d="M30.69 4.21L24.37 4.81L22.57 0.69L22.86 0H26.48L30.69 4.21ZM23.75 5.67L22.66 3.08L18.05 14.24V17.14H19.7H20.03H20.16H20.2L24.1 15.7L30.11 5.19L23.75 5.67ZM4.21002 4.21L10.53 4.81L12.33 0.69L12.05 0H8.43002L4.22002 4.21H4.21002ZM21.9 17.4L20.6 18.2H14.3L13 17.4L12.4 18.2L12.42 18.23L17.45 26.8L22.48 18.23L22.5 18.2L21.9 17.4ZM4.79002 5.19L10.8 15.7L14.7 17.14H14.74H15.2H16.85V14.24L12.24 3.09L11.15 5.68L4.79002 5.2V5.19Z"
                            fill="var(--p-primary-200)"
                        />
                    </svg> -->
                    <div class="flex justify-center"><img alt="Logo" :src="`/${topbarImage()}`" width="50" /></div>
                    <div class="inline-flex flex-col gap-2">
                        <label for="password" class="text-primary-50 font-semibold">Masukkan password</label>
                        <InputText v-model="password" id="password" ref="inputRef" class="!bg-white/20 !border-0 !p-4 !text-primary-50 w-80" type="password" @keypress.enter="checkPassword"></InputText>
                    </div>
                    <div class="flex items-center gap-4">
                        <Button label="Ok" variant="text" class="!p-4 w-full !text-primary-50 !border !border-white/30 hover:!bg-white/10" @click="checkPassword"></Button>
                        <Button label="Cancel" variant="text" class="!p-4 w-full !text-primary-50 !border !border-white/30 hover:!bg-white/10" @click="$router.push({ name: 'dashboard' })"></Button>
                    </div>
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="dataDialog" :style="{width: '450px'}" :header="modalHeader" :modal="true" class="p-fluid" @hide="refresh">
            <div class="mb-4 flex flex-col">
                <label for="webapp" class="mb-4">Web / Aplikasi</label>
                <InputText id="webapp" size="large" v-model="input_data.webapp" :required="true" autofocus :class="{'p-invalid': submitted && !input_data.webapp}" autocomplete="off" />
                <small class="p-invalid" v-if="submitted && !input_data.webapp">Web / Aplikasi harus diisi.</small>
            </div>
            <div class="mb-4 flex flex-col">
                <label for="username" class="mb-4">Username</label>
                <InputText id="username" size="large" v-model="input_data.username" autofocus autocomplete="off" />
            </div>
            <div class="mb-4 flex flex-col">
                <label for="password" class="mb-4">Password</label>
                <InputText id="password" size="large" v-model="input_data.password" :required="true" autofocus :class="{'p-invalid': submitted && !input_data.password}" autocomplete="off" />
                <small class="p-invalid" v-if="submitted && !input_data.password">Password harus diisi.</small>
            </div>
            <Message v-if="submitStatus" :severity="submitStatus" :closable="false">{{submitMessage}}</Message>

            <template #footer>
                <Button size="large" label="Batal" icon="pi pi-times" variant="text" @click="dataDialog = false"/>
                <Button size="large" label="Simpan" icon="pi pi-check" variant="text" :loading="submitting" @click="saveData" :disabled="submitStatus == 'success'" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{width: '450px'}" header="Konfirmasi" :modal="true">
            <div class="flex items-center justify-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Apakah anda yakin ingin menghapus data <b>{{toDelete.webapp}}</b>?</span>
            </div>
            <template #footer>
                <Button size="large" label="Tidak" icon="pi pi-times" variant="text" @click="deleteDialog = false"/>
                <Button size="large" label="Ya" icon="pi pi-check" variant="text" :loading="submitting" @click="deleteData" />
            </template>
        </Dialog>
        
        <Dialog v-model:visible="historyDialog" :style="{width: '450px'}" :header="historyHeader" :modal="true" class="p-fluid">
            <div class="flex flex-col p-2 border-b border-surface-200 dark:border-surface-700">
                <div class="flex flex-col">
                    <label class="mb-2">Username</label>
                    <div class="text-lg font-medium break-all mb-4">{{ selectedData.username }}</div>
                </div>
                <div class="flex flex-col">
                    <label class="mb-2">Password</label>
                    <div class="text-lg font-medium break-all mb-4">{{ selectedData.password }}</div>
                </div>
            </div>

            <div class="font-semibold text-xl mt-4 mb-4">History Data</div>
            <div v-if="loadingHistory">Loading history data...</div>
            <div v-if="!loadingHistory && history_data.length < 1">No history found.</div>
            <div v-for="(item, index) in history_data" :key="index">
                <div class="flex flex-col p-2" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
                    <!-- <div class="text-lg font-medium">{{item.username}} - {{ item.password }} ({{ dateHandler(item.date, false) }})</div> -->
                    <div class="flex flex-col">
                        <label class="mb-2">Username</label>
                        <div class="text-lg font-medium break-all mb-4">{{ item.username }}</div>
                    </div>
                    <div class="flex flex-col">
                        <label class="mb-2">Password</label>
                        <div class="text-lg font-medium break-all mb-4">{{ item.password }}</div>
                    </div>
                    <div class="flex flex-col">
                        <label class="mb-2">Tanggal Dibuat</label>
                        <div class="text-lg font-medium break-all mb-4">{{ dateHandler(item.date, false) }}</div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button size="large" label="Close" icon="pi pi-times" variant="text" @click="historyDialog = false"/>
            </template>
        </Dialog>
    </div>
</template>
