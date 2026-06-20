<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { App } from '@capacitor/app'
import { useEncryptor } from '@/composables/encryptor'
import { vaultKeyStore } from '@/store/crypto'
import DatamgtService from '@/service/DatamgtService'
import TodoNode from '@/components/TodoNode.vue'
import { useDebounceFn } from '@vueuse/core'

const datamgtService = new DatamgtService()
const { encryptVaultItem, decryptVaultItem } = useEncryptor()
const loading = ref(false)
const vaultKey = vaultKeyStore()
const taskDialog = ref(false)
const search = ref('')
const dialogRef = ref()
const contextMenu = ref(null);
const contextMenuItems = ref([
    {label: 'Delete', icon: 'pi pi-trash'}
]);
const todos = ref([])
const selectedTodo = ref(null)
const focusNodeId = ref()
const allow_save = ref(false)
const tasklist_id = ref(null)
const saveStatus = ref('saved')

const key = computed(() => {
  return vaultKey.key
})

watch(key, async () => {
    loading.value = true
    await getTaskList()
    loading.value = false
});

const filteredTodos = computed(() => {
  return todos.value.filter(todo =>
    todo.title.toLowerCase().includes(search.value.toLowerCase()) || todo.children.map(child => child.title.toLowerCase().includes(search.value.toLowerCase())).includes(true)
  )
})

watch(todos, () => {
    if (allow_save.value) debouncedSave()
}, { deep: true })

// watch(() => filteredTodos, (newValue) => {
//     console.log(newValue.value)
// }, { deep: true })

// watch(() => todos, (newValue) => {
//     console.log(newValue.value)
// }, { deep: true })

// watch(() => selectedTodo, (newValue) => {
//     console.log(newValue.value)
// }, { deep: true })

let backHandler
onMounted(async () => {
    loading.value = true
    backHandler = await App.addListener('backButton', ({ canGoBack }) => {
        if(taskDialog.value) {
            taskDialog.value = false
            return
        }

        if (canGoBack) {
            window.history.back()
        }
    })
    if(key.value) {
        await getTaskList()
        loading.value = false
    }
})

onUnmounted(() => {
    backHandler?.remove()
})

const getTaskList = async () => {
    const tasks = await datamgtService.getTaskList(1)
    const tasksRaw = tasks.data.result
    const {nonce, ciphertext} = tasksRaw
    const tasksDecrypted = await decryptVaultItem({nonce, ciphertext}, key.value)
    todos.value = tasksDecrypted.map((task) => task)
    tasklist_id.value = tasksRaw.id
    
    assignOrder(todos.value)
}

const handleEnter = async (node) => {
    if (!node.title?.trim()) return

    const newNode = { id: `${selectedTodo.value.id}-${selectedTodo.value.children.length + 1}`, title: '', checked: false, expanded: false }
    const isRootLevel = node.root

    if (isRootLevel) {
        node.expanded = false
        node.children.unshift(newNode)
    } else {
        const nodeInd = selectedTodo.value.children.findIndex(child => child.id == node.id)
        selectedTodo.value.children.splice(nodeInd + 1, 0, newNode)
    }

    focusNodeId.value = newNode.id
    await nextTick()
}

const openTask = async (params, event) => {
    if(!event || (!event.target.className.includes('p-checkbox') && !event.target.className.includes('p-button'))) {
        if(params) selectedTodo.value = params
        else {
            selectedTodo.value = {
                id: `${(todos.value.length ? Math.max(...todos.value.map(i => parseInt(i.id))) : 0) + 1}`,
                title: '',
                checked: false,
                expanded: false,
                root: true,
                children: [],
                new: true
            }
        }
        focusNodeId.value = selectedTodo.value.id
        taskDialog.value = true
        await nextTick()
        dialogRef.value.closeButton.style = 'display: none;'
    }
}

const save = () => {
    if(selectedTodo.value.new) {
        delete selectedTodo.value.new
        todos.value.unshift(selectedTodo.value)
    }

    todos.value = cleanTodos(todos.value)
    assignOrder(todos.value)
    allow_save.value = true
}

const saveTodos = async () => {
    try {
        saveStatus.value = 'saving'

        const encrypted = await encryptVaultItem(todos.value, key.value)
        const body = {id: tasklist_id.value, user_id: 1, ...encrypted}
        await datamgtService.saveTaskList(body)

        setTimeout(() => { saveStatus.value = 'saved' }, 300)
    } catch (e) {
        saveStatus.value = 'error'
    }
}

const debouncedSave = useDebounceFn(saveTodos, 3000)

const cleanTodos = (nodes) => {
    return nodes
    .filter(node => node.title?.trim())
    .map(node => ({
        ...node,
        children: node.children
        ? cleanTodos(node.children)
        : []
    }))
}

const showDesktopContextMenu = (event, item) => {
    contextMenuItems.value[0].command = () => {deleteTask(item)}
    contextMenu.value.show(event)
}

const showMobileContextMenu = (event, item) => {
    contextMenuItems.value[0].command = () => {deleteTask(item)}
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

const deleteTask = (item) => {
    const taskInd = todos.value.findIndex(t => t.id == item.id)
    todos.value.splice(taskInd, 1)
    allow_save.value = true
}

const toggleExpand = (node) => {
    node.expanded = !node.expanded
    allow_save.value = true
}

const setChildrenChecked = (node, checked) => {
    node.checked = checked

    if (checked) node.expanded = false

    node.children?.forEach(child => {
        setChildrenChecked(child, checked)
    })
}

const updateParentState = (node) => {
    if (!node.children?.length) return node.checked

    const allChecked = node.children.every(updateParentState)

    if (allChecked) node.expanded = false
    node.checked = allChecked

    return allChecked
}

const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
        // unchecked di atas
        if (a.checked !== b.checked) return Number(a.checked) - Number(b.checked)

        // kembali ke urutan awal
        return a.originalOrder - b.originalOrder
    })

    nodes.forEach(node => {
        if (node.children?.length) sortNodes(node.children)
    })
}

const toggleCheck = (node) => {
    const checked = !node.checked
    setChildrenChecked(node, checked)

    if (checked) node.expanded = false

    todos.value.forEach(root => {
        updateParentState(root)
    })

    sortNodes(todos.value)
    allow_save.value = true
}

const assignOrder = (nodes, start = { value: 0 }) => {
    nodes.forEach(node => {
        node.originalOrder = start.value++

        if (node.children?.length) assignOrder(node.children, start)
    })
}

const updateTitle = (node, newTitle) => {
    node.title = newTitle
    allow_save.value = true
}
</script>

<style scoped lang="scss">
.todo-move {
  transition: transform 500ms ease;
}

.todo-enter-active,
.todo-leave-active {
  transition: all 500ms ease;
}
</style>

<template>
    <div class="flex flex-col">
        <div class="card">
            <div class="flex justify-between">
                <div class="font-semibold text-xl">Daftar Tugas</div>

                <div v-if="!loading" class="flex items-center gap-2">
                    <div v-if="saveStatus === 'saving'" class="w-4 h-4 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" />
                    <span v-if="saveStatus === 'saving'" class="text-primary-300"> Autosaving </span>
                    <span v-else-if="saveStatus === 'saved'" class="text-green"> All changes saved </span>
                    <span v-else-if="saveStatus === 'error'" class="text-red-500"> Save failed </span>
                </div>
            </div>

            <div v-if="loading" class="flex flex-col items-center justify-center mt-20">
                <div class="w-60 h-60 border-20 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                <span class="text-lg font-medium mt-4">Memuat data</span>
            </div>

            <div v-else>
                <Button size="large" icon="pi pi-plus" rounded raised severity="success" class="!fixed bottom-24 right-20 z-[10] !w-16 !h-16 shadow-lg md:!hidden" @click="openTask()" />

                <div class="flex w-full mt-4 mb-2 flex-col md:flex-row md:justify-between">
                    <Button size="large" label="Tambah Data Baru" icon="pi pi-plus" severity="success" class="!hidden md:!block mb-4 md:mb-0" @click="openTask()"/>
                    <IconField class="mb-3 md:mb-0">
                        <InputIcon class="pi pi-search" />
                        <InputText size="large" placeholder="Cari tugas" class="w-full md:w-auto" v-model="search" />
                    </IconField>
                </div>

                <DataView :value="filteredTodos" layout="list">
                    <template #empty>
                        <div class="flex flex-col items-center py-10">
                            <h3 class="text-lg font-semibold">Data Kosong</h3>
                            <p class="text-sm text-gray-500">
                                Belum ada data yang tersedia.
                            </p>
                        </div>
                    </template>
                    <template #list="slotProps">
                        <div class="flex flex-col mt-4">
                            <TransitionGroup name="todo" tag="div" >
                                <TodoNode v-for="todo in slotProps.items" :key="todo.id" :node="todo" @toggle-check="toggleCheck" @toggle-expand="toggleExpand" 
                                @click="openTask(todo, $event)" @contextmenu.prevent="showDesktopContextMenu($event, todo)" v-touch:hold="(event) => showMobileContextMenu(event, todo)" />
                            </TransitionGroup>
                            <ContextMenu ref="contextMenu" :model="contextMenuItems" />
                        </div>
                    </template>
                </DataView>
            </div>
        </div>

        <Dialog v-model:visible="taskDialog" modal class="w-screen md:w-[50vw]" ref="dialogRef" :dismissableMask="true" @hide="save">
            <TodoNode :node="selectedTodo" :key="selectedTodo.id" mode="modal" @update-title="updateTitle" :focus-node-id="focusNodeId" @enter-node="handleEnter" />
            <template #footer>
                <Button size="large" label="Selesai" variant="text" @click="taskDialog = false"/>
            </template>
        </Dialog>
    </div>
</template>