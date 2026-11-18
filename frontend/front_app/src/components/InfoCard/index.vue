<template>
    <q-card flat bordered class="info-card">
        <div ref="headRef" class="info-card__head" role="button" tabindex="0" @click="expanded = !expanded"
            @keydown.enter.prevent="expanded = !expanded" @keydown.space.prevent="expanded = !expanded">
            <div class="info-card__heading">
                <div ref="titleRef" class="info-card__title">{{ title }}</div>
                <div v-if="hasSummary && !inline" ref="summaryRef" class="info-card__summary"
                    :class="{ 'info-card__summary--hidden': expanded }">
                    <slot name="summary">{{ summary }}</slot>
                </div>
            </div>

            <div v-if="hasSummary && inline" ref="summaryRef"
                class="info-card__summary info-card__summary--inline"
                :class="{ 'info-card__summary--hidden': expanded }">
                <slot name="summary">{{ summary }}</slot>
            </div>

            <q-space v-if="!inline" />
            <span ref="chevronRef" class="info-card__chevron">
                <q-icon :name="expanded ? 'sym_o_expand_less' : 'sym_o_expand_more'" size="20px" />
            </span>
        </div>

        <div class="info-card__body" :class="{ 'info-card__body--open': expanded }" :inert="!expanded"
            :aria-hidden="!expanded">
            <div class="info-card__body-inner">
                <q-separator />
                <slot />
            </div>
        </div>
    </q-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';

interface Props {
    title: string,
    summary?: string,
}

const props = withDefaults(defineProps<Props>(), {
    summary: '',
})

const expanded = defineModel<boolean>({ default: false })

const slots = useSlots()
const headRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const summaryRef = ref<HTMLElement | null>(null)
const chevronRef = ref<HTMLElement | null>(null)
const inline = ref(false)

const hasSummary = computed(() => !!slots.summary || !!props.summary)

let observer: ResizeObserver | undefined

const updateLayout = async () => {
    await nextTick()
    if (!hasSummary.value || !headRef.value || !titleRef.value || !summaryRef.value) {
        inline.value = false
        return
    }

    const headStyle = getComputedStyle(headRef.value)
    const padding = parseFloat(headStyle.paddingLeft) + parseFloat(headStyle.paddingRight)
    const available = headRef.value.clientWidth - padding

    const titleWidth = titleRef.value.scrollWidth
    const chevronWidth = chevronRef.value?.offsetWidth ?? 0
    const chips = Array.from(summaryRef.value.querySelectorAll<HTMLElement>('.q-chip'))
    const summaryWidth = chips.length
        ? chips.reduce((sum, chip, index) => sum + chip.offsetWidth + (index > 0 ? 4 : 0), 0)
        : summaryRef.value.scrollWidth

    // 8px между заголовком, сводкой и шевроном
    inline.value = titleWidth + summaryWidth + chevronWidth + 16 <= available
}

watch(hasSummary, () => { void updateLayout() })

onMounted(async () => {
    await updateLayout()
    observer = new ResizeObserver(() => { void updateLayout() })
    if (headRef.value) observer.observe(headRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style lang="scss" scoped>
.info-card {
    border-radius: 10px;
}

.info-card__head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.info-card__head:hover {
    background: rgba(6, 95, 70, 0.04);
}

.info-card__heading {
    min-width: 0;
    flex: 0 1 auto;
}

.info-card__title {
    overflow: hidden;
    max-width: 100%;
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.info-card__summary {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
    max-height: 56px;
    overflow: hidden;
    color: #6b7280;
    font-size: 10px;
    line-height: 1.3;
    opacity: 1;
    transition:
        max-height 220ms cubic-bezier(0.4, 0, 0.2, 1),
        margin-top 220ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity 180ms ease;
}

.info-card__summary--inline {
    flex: 0 0 auto;
    justify-content: flex-end;
    margin-top: 0;
    margin-left: auto;
}

.info-card__summary--hidden {
    max-height: 0;
    margin-top: 0;
    opacity: 0;
}

.info-card__chevron {
    display: flex;
    flex: 0 0 auto;
    color: #6b7280;
}

.info-card__body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

.info-card__body--open {
    grid-template-rows: 1fr;
}

.info-card__body-inner {
    min-height: 0;
    overflow: hidden;
}
</style>
