<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'normal' // normal | modal
  },
  focusNodeId: String
})

const emit = defineEmits([
  'toggle-check',
  'toggle-expand',
  'update-title',
  'enter-node'
])

const sortedChildren = computed(() => {
  if (!props.node.children?.length) return []

  return [...props.node.children].sort((a, b) => {
    return Number(a.checked) - Number(b.checked)
  })
})

const getStats = (node) => {
  let total = 0
  let checked = 0

  const walk = (item) => {
    if (!item.children?.length) {
      total++

      if (item.checked) {
        checked++
      }

      return
    }

    item.children.forEach(walk)
  }

  node.children?.forEach(walk)

  return { checked, total }
}

const progress = computed(() => {
  return getStats(props.node)
})

const inputRef = ref(null)
const isModal = computed(() => props.mode === 'modal')

watch(
  () => props.focusNodeId,
  async (id) => {
    if (id === props.node.id) {
      await nextTick()
      inputRef.value?.$el.focus()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="px-4 py-2 mb-4 border-surface-200 dark:border-surface-700 bg-surface-200 dark:bg-surface-800 rounded-lg cursor-pointer data-view-item" :class="isModal ? '!bg-inherit' : ''">
    <div class="flex items-center gap-2 py-1" >
      <!-- Checkbox -->
      <Checkbox :modelValue="node.checked" binary @update:modelValue="() => emit('toggle-check', node)" :disabled="isModal" />

      <!-- Text -->
      <!-- view mode -->
      <span v-if="!isModal" class="transition-all duration-500 flex-1" :class="{ 'line-through text-gray-400 opacity-50': node.checked }" >
        {{ node.title }}
      </span>

      <!-- edit mode -->
      <InputText v-else size="large" fluid type="text" v-model="node.title" :placeholder="node.root ? 'Ketuk &quot;Enter&quot; untuk membuat sub tugas' : ''" class="!bg-inherit !border-0" :class="{ '!text-gray-400': node.checked }" @keydown.enter.prevent="emit('enter-node', node)" ref="inputRef" />

      <!-- Progress -->
      <span v-if="!isModal && node.children?.length" class="text-xs text-gray-500" > {{ progress.checked }} / {{ progress.total }} </span>

      <!-- Toggle -->
      <Button class="toggle-btn" v-if="!isModal && node.children?.length" text :icon="node.expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" @click="emit('toggle-expand', node)"  />
    </div>

    <!-- Children -->
    <TransitionGroup v-if="!isModal && node.expanded && node.children?.length" name="todo" tag="div" class="ml-2" >
      <TodoNode class="!mb-0" v-for="child in sortedChildren" :key="child.id" :node="child" @toggle-check="emit('toggle-check', $event)" @toggle-expand="emit('toggle-expand', $event)" />
    </TransitionGroup>

    <div v-if="isModal && node.children?.length" class="ml-2">
      <TodoNode class="!mb-0" v-for="child in sortedChildren" :key="child.id" :node="child" mode="modal" :focus-node-id="focusNodeId" @enter-node="emit('enter-node', $event)" />
    </div>
  </div>
</template>

<style scoped>
.todo-move {
  transition: transform 500ms ease;
}

.todo-enter-active,
.todo-leave-active {
  transition: all 500ms ease;
}

.todo-enter-from,
.todo-leave-to {
  opacity: 0;
}

.toggle-btn,
.toggle-btn:hover,
.toggle-btn:focus,
.toggle-btn:not(:disabled):hover,
.toggle-btn:active {
  background: transparent !important;
  color: inherit !important;
  box-shadow: none !important;
  border-color: transparent !important;
  color: var(--p-tree-node-toggle-button-color) !important;
}

.data-view-item {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
</style>