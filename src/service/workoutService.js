import axios from "axios"

export default class workoutService {
    getWorkout() {
        return axios.get(`${import.meta.env.VITE_BASE_URL}/workout/workingout`)
    }

    createWorkout(body) {
        return axios.post(`${import.meta.env.VITE_BASE_URL}/workout/workingout`, body)
    }

    updateWorkout(body, id) {
        return axios.patch(`${import.meta.env.VITE_BASE_URL}/workout/workingout/${id}`, body)
    }

    deleteWorkout(body) {
        return axios.post(`${import.meta.env.VITE_BASE_URL}/workout/deleteoneday`, body)
    }
}