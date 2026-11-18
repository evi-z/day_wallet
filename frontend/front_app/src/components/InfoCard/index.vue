<template>
    <q-card flat bordered class="info-card">
        <div class="info-card__head" role="button" tabindex="0" @click="expanded = !expanded"
            @keydown.enter.prevent="expanded = !expanded" @keydown.space.prevent="expanded = !expanded">
            <div class="info-card__heading">
                <div class="info-card__title">{{ title }}</div>
                <div v-if="summaryPlacement === 'below' && !expanded && ($slots.summary || summary)"
                    class="info-card__summary">
                    <slot name="summary">{{ summary }}</slot>
                </div>
            </div>
            <q-space v-if="summaryPlacement === 'below'" />
            <div v-if="summaryPlacement === 'inline' && !expanded && ($slots.summary || summary)"
                class="info-card__summary info-card__summary--inline">
                <slot name="summary">{{ summary }}</slot>
            </div>
            <q-icon :name="expanded ? 'sym_o_expand_less' : 'sym_o_expand_more'" size="20px"
                class="info-card__chevron" />
        </div>

        <q-slide-transition>
            <div v-show="expanded" class="info-card__body">
                <q-separator />
                <slot />
            </div>
        </q-slide-transition>
    </q-card>
</template>

<script setup lang="ts">
interface Props {
    title: string,
    summary?: string,
    summaryPlacement?: 'below' | 'inline',
}

withDefaults(defineProps<Props>(), {
    summary: '',
    summaryPlacement: 'below',
})

const expanded = defineModel<boolean>({ default: false })
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
    padding: 6px 10px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.info-card__head:hover {
    background: rgba(6, 95, 70, 0.04);
}

.info-card__heading {
    min-width: 0;
}

.info-card__title {
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
}

.info-card__summary {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    margin-top: 1px;
    color: #6b7280;
    font-size: 10px;
    line-height: 1.3;
}

.info-card__summary--inline {
    justify-content: flex-end;
    min-width: 0;
    max-width: 65%;
    margin-left: auto;
}

.info-card__chevron {
    margin-left: 4px;
    flex: 0 0 auto;
    color: #6b7280;
}
</style>
