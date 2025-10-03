<template>
    <!-- Teleport к контейнеру, который мы создадим в родителе -->
    <Teleport v-if="teleportContainer" :to="teleportContainer">
        <q-inner-loading :showing="showing">
            <component :is="spinnerComponent" />
        </q-inner-loading>
    </Teleport>
</template>

<script setup lang="ts">
/**
 * Создаёт случайный Spinner для InnerLoading, автоматически размещает его в родительском элементе
 */

import {
    QSpinner, QSpinnerAudio, QSpinnerBall, QSpinnerBox, QSpinnerClock, QSpinnerBars, QSpinnerCube, QSpinnerDots, QSpinnerFacebook,
    QSpinnerGrid, QSpinnerHourglass, QSpinnerInfinity, QSpinnerIos, QSpinnerOrbit, QSpinnerOval, QSpinnerPie, QSpinnerPuff,
    QSpinnerRings, QSpinnerTail,
    QInnerLoading,
    uid,
} from 'quasar';

import { ref, computed, toRefs, watch, h, getCurrentInstance, onMounted, onBeforeUnmount, nextTick, Teleport } from 'vue';

interface Props {
    showing: boolean,
    size?: string,
    color?: string,
}

const props = withDefaults(defineProps<Props>(), {
    size: '50px',
    color: 'primary',
})
const { showing, size, color } = toRefs(props)

const instance = getCurrentInstance()
const teleportContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
    await nextTick()

    const parent = instance?.parent?.vnode.el
    if (parent instanceof HTMLElement) {
        const container = document.createElement('div')
        container.id = `inner-loading-target-${uid()}`
        container.className = 'inner-loading-container'
        parent.appendChild(container)   // Добавляем в конец родителя
        teleportContainer.value = container
    }
})

onBeforeUnmount(() => {
    // Очищаем созданный контейнер при размонтировании
    if (teleportContainer.value && teleportContainer.value.parentNode) {
        teleportContainer.value.parentNode.removeChild(teleportContainer.value)
    }
})

const Spinners = [
    QSpinner,
    QSpinnerAudio,
    QSpinnerBall,
    QSpinnerBars,
    QSpinnerBox,
    QSpinnerClock,
    QSpinnerCube,
    QSpinnerDots,
    QSpinnerFacebook,
    QSpinnerGrid,
    QSpinnerHourglass,
    QSpinnerInfinity,
    QSpinnerIos,
    QSpinnerOrbit,
    QSpinnerOval,
    QSpinnerPie,
    QSpinnerPuff,
    QSpinnerRings,
    QSpinnerTail
]

const getRandomSpinner = () => {
    return Spinners[Math.floor(Math.random() * Spinners.length)];
}

const currentSpinner = ref(getRandomSpinner())

watch(() => showing.value, (newVal) => {
    if (!newVal) {
        currentSpinner.value = getRandomSpinner()
    }
})

const spinnerComponent = computed(() => {
    const componentName = h(currentSpinner.value!, {
        size: size.value,
        color: color.value,
    })
    return componentName
})

</script>
