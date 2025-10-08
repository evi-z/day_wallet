<template>
    <q-layout view="lHh Lpr lFf" class="fit">
        <q-header elevated>
            <q-toolbar class="toolbar">
                <!-- <q-btn flat dense round icon="menu" aria-label="Menu"/> -->

                <q-toolbar-title>
                    Day Wallet
                </q-toolbar-title>

                <!-- <div>v1.0</div> -->
                <div class="row items-center q-gutter-x-sm">
                    <q-btn flat dense round icon="sym_o_logout" aria-label="Выйти" @click="logout"/>
                </div>
            </q-toolbar>
        </q-header>

        <!-- <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
            <q-list>
                <q-item-label header>
                    Essential Links
                </q-item-label>
            </q-list>
        </q-drawer> -->

        <q-page-container class="page-container">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PAGES } from 'src/router/models';
import { useRouter } from 'vue-router';

const $router = useRouter();

const logout = () => {
    $router.push({ name: PAGES.Login });
}

</script>

<style lang="scss">
.toolbar {
    height: 50px;
}

.page-container {
    height: calc(100% - 50px);
}
</style>
