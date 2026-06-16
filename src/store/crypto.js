import { defineStore } from 'pinia'

export const vaultKeyStore = defineStore('vaultKey', {
    state: () => {
        return {
            key: null
        }
    },
    actions: {
        setValue(key) {
            this.key = key
        }
    },
})