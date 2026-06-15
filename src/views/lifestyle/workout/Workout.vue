<script src="./index.js"></script>

<template>
	<div class="flex flex-col">
        <div class="card">
			<div class="font-semibold text-xl">Catatan Olahraga</div>
			<Toast/>
			
			<DataTable :value="workouts" rowGroupMode="subheader" groupRowsBy="date" dataKey="id" :key="'table'+rerender"
				sortMode="single" sortField="date" :sortOrder="-1" responsiveLayout="scroll" :loading="loading"
				:expandableRowGroups="true" v-model:expandedRowGroups="expandedRowGroups" @rowgroupExpand="onRowGroupExpand">
				<template #header>
					<div class="flex flex-row md:flex-row justify-between md:items-center">
						<div>
							<Button size="large" severity="success" rounded icon="pi pi-plus" class="ml-2" @click="openCreateDialog" :disabled="createDisabled"/>
						</div>
						<div>
							<Button size="large" severity="info" rounded icon="pi pi-refresh" class="ml-2" @click="reload"/>
						</div>
					</div>
				</template>
				<template #empty>
					Data kosong.
				</template>
				<template #loading>
					Memuat data. Mohon tunggu.
				</template>
				<Column field="date" header="Representative"></Column>
				<Column field="movement.name" :pt="{headerCell: {class: 'hidden md:block'}}">
					<template #header>
						<span class="hidden md:inline">Gerakan</span>
					</template>
					<template #body="slotProps">
						<div class="md:block">
							<div class="hidden md:block">
								{{ slotProps.data.movement.name }}
							</div>

							<div class="md:hidden">
								<div class="flex justify-between items-center mb-6">
									<div class="font-semibold">Gerakan</div>
									<div>{{ slotProps.data.movement.name }}</div>
								</div>
								<div class="flex justify-between items-center mb-6">
									<div class="font-semibold">Set 1</div>
									<Button size="large" rounded :label="slotProps.data.set1.toString()" @click="editReps(slotProps.data.id, slotProps.data.set1, 'set1')" />
								</div>
								<div class="flex justify-between items-center mb-6">
									<div class="font-semibold">Set 2</div>
									<Button size="large"  rounded :label="slotProps.data.set2.toString()" @click="editReps(slotProps.data.id, slotProps.data.set2, 'set2')" />
								</div>
								<div class="flex justify-between items-center mb-6">
									<div class="font-semibold">Set 3</div>
									<Button size="large"  rounded :label="slotProps.data.set3.toString()" @click="editReps(slotProps.data.id, slotProps.data.set3, 'set3')" />
								</div>
								<div class="flex justify-between items-center">
									<div class="font-semibold">Keterangan</div>
									<Button size="large" :label="slotProps.data.note ? slotProps.data.note : 'Edit Note'" @click="editNote(slotProps.data.id, slotProps.data.note)" />
								</div>
							</div>
						</div>
					</template>
				</Column>
				<Column field="set1" header="Set 1" class="hidden md:table-cell">
					<template #body="slotProps">
						<div>
							<Button size="large" rounded :label="slotProps.data.set1.toString()" class="mr-2" @click="editReps(slotProps.data.id, slotProps.data.set1, 'set1')" />
						</div>
					</template>
				</Column>
				<Column field="set2" header="Set 2" class="hidden md:table-cell">
					<template #body="slotProps">
						<div>
							<Button size="large" rounded :label="slotProps.data.set2.toString()" class="mr-2" @click="editReps(slotProps.data.id, slotProps.data.set2, 'set2')" />
						</div>
					</template>
				</Column>
				<Column field="set3" header="Set 3" class="hidden md:table-cell">
					<template #body="slotProps">
						<div>
							<Button size="large" rounded :label="slotProps.data.set3.toString()" class="mr-2" @click="editReps(slotProps.data.id, slotProps.data.set3, 'set3')" />
						</div>
					</template>
				</Column>
				<Column field="note" header="Keterangan" class="hidden md:table-cell">
					<template #body="slotProps">
						<div class="flex justify-between items-center">
							{{slotProps.data.note || '-'}}
							<Button size="large" rounded icon="pi pi-pencil" class="mr-2" @click="editNote(slotProps.data.id, slotProps.data.note)" />
						</div>
					</template>
				</Column>
				<template #groupheader="slotProps">
					<span class="float-right md:float-none">{{dateHandler(slotProps.data.date)}}</span>
				</template>
				<template #groupfooter="slotProps">
					<div class="flex justify-end">
						<ConfirmPopup></ConfirmPopup>
						<Button size="large" severity="danger" label="Hapus" icon="pi pi-trash" @click="confirmDelete($event, slotProps.data.date)" :loading="submitting" />
					</div>
				</template>
			</DataTable>

			<Dialog v-model:visible="editDialog" header="Update Repetisi" :modal="true" class="p-fluid">
				<div class="field">
					<InputNumber size="large" autocomplete="off" v-model="reps" :required="true" showButtons buttonLayout="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" autofocus />
				</div>

				<template #footer>
					<Button size="large" variant="text" label="Simpan" icon="pi pi-check" :loading="submitting" @click="updateData" />
				</template>
			</Dialog>

			<Dialog v-model:visible="editDialog2" header="Keterangan" :modal="true" class="p-fluid">
				<div class="field">
					<InputText size="large" autocomplete="off" v-model="note" :required="true" autofocus />
				</div>

				<template #footer>
					<Button size="large" variant="text" label="Simpan" icon="pi pi-check" :loading="submitting" @click="updateData" />
				</template>
			</Dialog>

			<Dialog v-model:visible="createDialog" header="Tambah Catatan" :modal="true" class="p-fluid">
				<div class="field">
					<Dropdown size="large" v-model="workset" :options="worksets" optionLabel="label" placeholder="Pilih Set Gerakan" />
				</div>

				<template #footer>
					<Button size="large" variant="text" label="Simpan" icon="pi pi-check" :loading="submitting" @click="createNew" />
				</template>
			</Dialog>
		</div>
	</div>
</template>