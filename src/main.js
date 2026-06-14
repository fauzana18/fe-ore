import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primeuix/themes/aura';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Vue3TouchEvents from "vue3-touch-events";

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

const app = createApp(App);
const pinia = createPinia()

app.use(router);
app.use(pinia)
app.use(Vue3TouchEvents, {
	disableClick: true
})
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);


import { useLayout } from '@/composables/layout';
const { layoutConfig, primaryColors, surfaces, updateColors, onPresetChange } = useLayout();

if (layoutConfig.darkTheme) document.documentElement.classList.add('app-dark');
else document.documentElement.classList.remove('app-dark');

const primaryColor = primaryColors.value.find(col => col.name == layoutConfig.primary)
updateColors('primary', primaryColor)

const surface = surfaces.value.find(col => col.name == layoutConfig.surface)
updateColors('surface', surface)

onPresetChange()

app.mount('#app');
