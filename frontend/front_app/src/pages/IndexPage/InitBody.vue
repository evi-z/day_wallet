<template>
    <div class="page-container column flex-center">
        <q-form class="q-gutter-y-md column">
            <q-input v-model="form.name" outlined label="Название периода" autofocus></q-input>
            <q-date v-model="form.period"></q-date>
            <q-btn type="submit" color="primary" label="Создать" />
        </q-form>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';


type NewWalletCallendarForm = {
    name: string,
    period: { from: string, to: string },
}

const form = ref<NewWalletCallendarForm>({
    name: '',
    period: { from: '', to: '' },
})

</script>

<style lang="scss" scoped></style>
