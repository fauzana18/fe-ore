import axios from "axios"

export default class workoutService {
    getVault() {
        return axios.get(`${import.meta.env.VITE_BASE_URL}/data/vault`)
    }

    createVault(body) {
        return axios.post(`${import.meta.env.VITE_BASE_URL}/data/vault`, body)
    }

    updateVault(body, id) {
        return axios.patch(`${import.meta.env.VITE_BASE_URL}/data/vault/${id}`, body)
    }

    deleteVault(id) {
        return axios.delete(`${import.meta.env.VITE_BASE_URL}/data/vault/${id}`)
    }

    getVaultHistory(id) {
        return axios.get(`${import.meta.env.VITE_BASE_URL}/data/vault/${id}`)
    }

    getNotes() {
        return axios.get(`${import.meta.env.VITE_BASE_URL}/data/notes`)
    }

    createNotes(body) {
        return axios.post(`${import.meta.env.VITE_BASE_URL}/data/notes`, body)
    }

    updateNotes(body, id) {
        return axios.patch(`${import.meta.env.VITE_BASE_URL}/data/notes/${id}`, body)
    }

    deleteNotes(id) {
        return axios.delete(`${import.meta.env.VITE_BASE_URL}/data/notes/${id}`)
    }
}