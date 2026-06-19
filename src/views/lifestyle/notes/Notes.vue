<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useToast } from "primevue/usetoast"
import { useEncryptor } from '@/composables/encryptor'
import { useFinance } from '@/composables/finance'
import { vaultKeyStore } from '@/store/crypto'
import DatamgtService from '@/service/DatamgtService'

const datamgtService = new DatamgtService()
const { dateHandler } = useFinance()
const { encryptVaultItem, decryptVaultItem } = useEncryptor()
const toast = useToast()
const loading = ref(false)
const toDelete = ref({})
const vaultKey = vaultKeyStore()
const noteDialog = ref(false)
const deleteDialog = ref(false)
const notes = ref([])
const note = ref(null)
const search = ref('')
const changed = ref(false)
const readmode = ref(false)
const contextMenu = ref(null);
const contextMenuItems = ref([
    {label: 'Read Mode', icon: 'pi pi-book'},
    {label: 'Delete', icon: 'pi pi-trash'}
]);

const key = computed(() => {
  return vaultKey.key
})

watch(key, async () => {
    loading.value = true
    await getNotes()
    loading.value = false
});

const filteredNotes = computed(() => {
  return notes.value.filter(note =>
    note.title.toLowerCase().includes(search.value.toLowerCase()) || note.note.toLowerCase().includes(search.value.toLowerCase())
  )
})

onMounted(async () => {
    loading.value = true
    if(key.value) {
        await getNotes()
        loading.value = false
    }
})

const getNotes = async () => {
    const list = await datamgtService.getNotes()
    const notesRaw = list.data.result
    const notesEncrypted = notesRaw.map(n => {
        const {nonce, ciphertext} = n
        return {nonce, ciphertext}
    })
    const notesDecrypted = await Promise.all(notesEncrypted.map(n => decryptVaultItem(n, key.value)))
    notes.value = notesRaw.map((n, i) => {
        return {id: n.id, title: n.title, note: notesDecrypted[i].note, date: n.created}
    })
}

const openNotes = (params) => {
    changed.value = false
    if(params) note.value = params
    else note.value = {title: '', note: '', date: new Date()}
    noteDialog.value = true
}

const save = async () => {
    readmode.value = false
    if((note.value.title != '' || note.value.note != '') && changed.value) {
        try {
            let res
            const encrypted = await encryptVaultItem({note: note.value.note}, key.value)
            const body = {title: note.value.title, ...encrypted}
            if(!note.value.id) {
                notes.value.unshift({...note.value, id: notes.value.length > 1 ? notes.value[notes.value.length - 1].id + 1 : 1})
                res = await datamgtService.createNotes(body)
            }
            else {
                const noteInd = notes.value.findIndex(n => n.id == note.value.id)
                notes.value[noteInd] = note.value
                res = await datamgtService.updateNotes({...body, created: new Date()}, note.value.id)
            }

            if(res.status == 200) {
                toast.add({severity: 'success', summary: 'Sukses', detail: 'Data berhasil disimpan.', life: 3000})
            }
            else {
                throw res
            }
        }
        catch(err) {
            console.log(err.response?.data?.message || err.message || err)
            toast.add({severity: 'error', summary: 'Gagal', detail: 'Data gagal disimpan.', life: 3000})
        }
        
        await getNotes()
    }
}

const onchange = () => {
    changed.value = true
}

const confirmDelete = (item) => {
    toDelete.value = item
    deleteDialog.value = true
}

const showDesktopContextMenu = (event, item) => {
    contextMenuItems.value[1].command = () => {confirmDelete(item)}
    contextMenuItems.value[0].command = () => {
        readmode.value = true
        openNotes(item)
    }
    contextMenu.value.show(event)
}

const showMobileContextMenu = (event, item) => {
    contextMenuItems.value[1].command = () => {confirmDelete(item)}
    contextMenuItems.value[0].command = () => {
        readmode.value = true
        openNotes(item)
    }
    const touch = event.changedTouches?.[0] ?? event.touches?.[0]
    contextMenu.value.show({
        pageX: touch.pageX,
        pageY: touch.pageY,
        stopPropagation: () => {},
        preventDefault: () => {},
        target: event.target,
        currentTarget: event.target
    })
}

const deleteData = async () => {
    let stat, message, summary
    const noteInd = notes.value.findIndex(n => n.id == toDelete.value.id)
    notes.value.splice(noteInd, 1)
    deleteDialog.value = false

    try {
        const res = await datamgtService.deleteNotes(toDelete.value.id)

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

    toast.add({severity: stat, summary, detail: message, life: 3000})
    if(stat == 'success') await getNotes()
}
</script>

<template>
    <div class="flex flex-col">
        <div class="card">
            <div class="font-semibold text-xl">Catatan</div>

            <Toast/>

            <div v-if="loading" class="flex flex-col items-center justify-center mt-20">
                <div class="w-60 h-60 border-20 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                <span class="text-lg font-medium mt-4">Memuat data</span>
            </div>

            <div v-else>
                <Button size="large" icon="pi pi-plus" rounded raised severity="success" class="!fixed bottom-24 right-20 z-[10] !w-16 !h-16 shadow-lg md:!hidden" @click="openNotes()" />

                <div class="flex w-full mt-4 mb-2 flex-col md:flex-row md:justify-between">
                    <Button size="large" label="Tambah Data Baru" icon="pi pi-plus" severity="success" class="!hidden md:!block mb-4 md:mb-0" @click="openNotes()"/>
                    <IconField class="mb-3 md:mb-0">
                        <InputIcon class="pi pi-search" />
                        <InputText size="large" placeholder="Cari catatan" class="w-full md:w-auto" v-model="search" />
                    </IconField>
                </div>

                <DataView :value="filteredNotes" layout="grid">
                    <template #empty>
                        <div class="flex flex-col items-center py-10">
                            <h3 class="text-lg font-semibold">Data Kosong</h3>
                            <p class="text-sm text-gray-500">
                                Belum ada data yang tersedia.
                            </p>
                        </div>
                    </template>
                    <template #grid="slotProps">
                        <div class="grid grid-cols-12">
                            <div v-for="(item) in slotProps.items" :key="item.id" class="col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2 p-1 md:p-2">
                                <div class="p-4 border border-surface-200 dark:border-surface-700 bg-surface-200 dark:bg-surface-800 rounded flex flex-col h-60 rounded-lg cursor-pointer"
                                    @click="openNotes(item)" @contextmenu.prevent="showDesktopContextMenu($event, item)" v-touch:hold="(event) => showMobileContextMenu(event, item)">
                                    <div class="flex flex-col items-start h-full">
                                        <div class="text-lg font-medium truncate w-full pb-4">{{ item.title }}</div>
                                        <div class="font-medium text-surface-500 dark:text-surface-400 text-sm text-wrap truncate w-full h-[80%] mb-2">{{ item.note }}</div>
                                        <div class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ dateHandler(item.date, false, true) }}</div>
                                    </div>
                                </div>
                            </div>
                            <ContextMenu ref="contextMenu" :model="contextMenuItems" />
                        </div>
                    </template>
                </DataView>
            </div>
        </div>

        <Dialog v-model:visible="noteDialog" modal pt:content:class="!h-full" :style="{ width: '100%', height: '100%' }" @hide="save">
            <template #header>
                <div class="flex flex-col w-full">
                    <InputText size="large" fluid type="text" v-model="note.title" placeholder="Judul" class="!bg-inherit !border-0 disabled:!text-[var(--p-inputtext-color)]" @input="onchange" :disabled="readmode" />
                    <div class="font-medium text-surface-500 dark:text-surface-400 text-sm pl-4">{{ dateHandler(note.date, false) }}</div>
                </div>
            </template>
            <Textarea v-model="note.note" placeholder="Mulai mengetik" autofocus class="h-[95%] !bg-inherit !border-0 disabled:!text-[var(--p-textarea-color)]" fluid @input="onchange" :disabled="readmode" />
        </Dialog>

        <Dialog v-model:visible="deleteDialog" :style="{width: '450px'}" header="Konfirmasi" :modal="true">
            <div class="flex items-center justify-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Apakah anda yakin ingin menghapus data <b>{{toDelete.title}}</b>?</span>
            </div>
            <template #footer>
                <Button size="large" label="Tidak" icon="pi pi-times" variant="text" @click="deleteDialog = false"/>
                <Button size="large" label="Ya" icon="pi pi-check" variant="text" @click="deleteData" />
            </template>
        </Dialog>
    </div>
</template>
