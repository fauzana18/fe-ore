<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import FinanceService from '@/service/FinanceService'
import { profileStore, saldoStore } from '@/store/finance'
import { useToast } from "primevue/usetoast";

const toast = useToast();
const emit = defineEmits(['close'])
const financeService = new FinanceService()
const profiles = profileStore()
const saldo = saldoStore()
const profileDialog = ref(false)
const deleteProfileDialog = ref(false)
const profile = ref({})
const submitted = ref(false)
const submitting = ref(false)
const selected = ref(null)
const color = ref('black')
const panelRef = ref(null)

const handleClickOutside = (event) => {
    const addModal = document.getElementById('add-profile')
    const deleteModal = document.getElementById('delete-profile')
    const profileButton = document.getElementById('profile-btn')
    
    if (panelRef.value && !panelRef.value.contains(event.target) && !profileButton?.contains(event.target)) {
        if((!addModal && !deleteModal)) emit('close')
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside, true)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside, true)
})

const selectProfile = (i, e) => {
    const tag = e.target.nodeName
    if(tag == 'BUTTON' || tag == 'SPAN') return
    profiles.select(i)
    saldo.getSaldo(profiles.list[i].id)
    emit('close')
}

const addProfile = () => {
    // emit('close')
    profile.value = {}
    color.value = 'black'
    submitted.value = false
    profileDialog.value = true
}

const editProfile = (i) => {
    profile.value = profiles.list[i]
    color.value = profiles.list[i].color
    selected.value = i
    submitted.value = false
    profileDialog.value = true
}

const confirmDeleteProfile = (i) => {
    selected.value = i
    profile.value = profiles.list[i]
    deleteProfileDialog.value = true
}

const saveProfile = async (e, isDelete = false) => {
    let res, stat, message, summary
    submitted.value = true
    submitting.value = true

    if(!profile.value.name) {
        submitting.value = false
        return
    }

    try {
        if(!profile.value.id) res = await financeService.createProfile({ name: profile.value.name, color: `#${color.value}`})
        else if(!isDelete) res = await financeService.updateProfile({ name: profile.value.name, color: `#${color.value}`}, profile.value.id)
        else res = await financeService.deleteProfile(profile.value.id)

        if(res.status == 200) {
            stat = 'success'
            message = res.data.message
            summary = 'Sukses'
            if(!profile.value.id) profiles.pusher(res.data.result)
            else if(!isDelete) profiles.changer(selected.value, profile.value.name)
            else profiles.splicer(selected.value)
        }
        else {
            stat = 'error'
            message = res.data.message
            summary = 'Gagal'
        }
    }
    catch(err) {
        stat = 'error'
        message = err.response ? err.response.data.message : 'Data gagal disimpan.'
        summary = 'Gagal'
    }

    profileDialog.value = false
    deleteProfileDialog.value = false
    toast.add({severity: stat, summary, detail: message, life: 3000})
    submitting.value = false
}
</script>

<style scoped lang="scss">
:deep(.p-colorpicker-preview){
    width: 100%;
    height: 35px;
}
</style>

<template>
    <div
        ref="panelRef" class="config-panel absolute top-[3.25rem] right-0 w-100 p-4 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top shadow-[0px_3px_5px_rgba(0,0,0,0.02),0px_0px_2px_rgba(0,0,0,0.05),0px_1px_4px_rgba(0,0,0,0.08)]"
    >
	    <Toast/>
        <div class="flex flex-col gap-4">
            <Card v-for="(items, i) of profiles.list" :key="i" style="cursor: pointer;" @click="selectProfile(i, $event)">
				<template #content>
					<div class="flex items-center justify-between">
						<p class="line-height-3 m-0">{{items.name}}</p>
						<i v-if="profiles.selected == i" class="pi pi-check" style="font-size: 2rem"></i>
						<div v-else>
							<ButtonGroup>
								<Button severity="success" icon="pi pi-pencil" @click="editProfile(i)" />
								<Button severity="warn" icon="pi pi-trash" @click="confirmDeleteProfile(i)" />
							</ButtonGroup>
						</div>
					</div>
				</template>
			</Card>
            <Card style="cursor: pointer;" @click="addProfile">
				<template #content>
					<div class="flex items-center justify-center">
						<i class="pi pi-plus mr-3" style="font-size: 2rem"></i>
						<p class="line-height-3 m-0">Tambah Baru</p>
					</div>
				</template>
			</Card>
        </div>
        
        <Dialog id="add-profile" v-model:visible="profileDialog" :style="{width: '450px'}" header="Tambah Profil" :modal="true" class="p-fluid" :dismissableMask="true">
            <div class="mb-4 flex flex-col">
                <label for="name" class="mb-2">Nama</label>
                <InputText size="large" id="name" v-model="profile.name" :required="true" autofocus :class="{'p-invalid': submitted && !profile.name}" autocomplete="off" @keypress.enter="saveProfile" />
                <small class="p-invalid" v-if="submitted && !profile.name">Nama harus diisi.</small>
            </div>
            <div class="mb-4 flex flex-col">
                <label for="color" class="mb-2">Pick Color</label>
                <ColorPicker size="large" class="!w-full" v-model="color"/>
            </div>
            <template #footer>
                <Button size="large" variant="text" label="Simpan" icon="pi pi-check" :loading="submitting" @click="saveProfile" />
            </template>
        </Dialog>

        <Dialog id="delete-profile" v-model:visible="deleteProfileDialog" :style="{width: '450px'}" header="Konfirmasi" :modal="true" class="p-fluid" :dismissableMask="true">
			<div class="flex items-center justify-center">
				<i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
				<span>Apakah anda yakin ingin menghapus <b>{{profile.name}}</b>? Data transaksi dari profil ini juga akan ikut terhapus.</span>
			</div>
			<template #footer>
				<Button size="large" variant="text" label="Tidak" icon="pi pi-times" @click="deleteProfileDialog = false"/>
				<Button size="large" variant="text" label="Ya" icon="pi pi-check" :loading="submitting" @click="saveProfile($event, true)" />
			</template>
		</Dialog>
    </div>
</template>
