<template>
  <div class="custom-select" ref="selectRef">
    <button
      type="button"
      class="select-trigger"
      @click="toggleDropdown"
      :class="{ 'is-open': isOpen }"
    >
      <span class="select-value">{{ selectedLabel }}</span>
      <ChevronDownIcon class="select-arrow" :class="{ 'is-open': isOpen }" />
    </button>
    <transition name="dropdown">
      <div v-if="isOpen" class="select-dropdown">
        <div class="dropdown-list">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="dropdown-item"
            :class="{ 'is-selected': option.value === modelValue }"
            @click="selectOption(option)"
          >
            <span class="item-label">{{ option.label }}</span>
            <CheckIcon v-if="option.value === modelValue" class="item-check" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon, CheckIcon } from '@renderer/components/icons'

interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  options: SelectOption[]
  modelValue?: string | number
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const selectRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

const selectedLabel = computed(() => {
  const selected = props.options.find((opt) => opt.value === props.modelValue)
  return selected ? selected.label : props.placeholder
})

function toggleDropdown(): void {
  isOpen.value = !isOpen.value
}

function selectOption(option: SelectOption): void {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent): void {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import './CustomSelect.css';
</style>
