import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/finance/transactions',
                    name: 'transactions',
                    component: () => import('@/views/finance/transactions/Transactions.vue')
                },
                {
                    path: '/finance/reports',
                    name: 'reports',
                    component: () => import('@/views/finance/reports/Reports.vue')
                },
                {
                    path: '/finance/plans',
                    name: 'plans',
                    component: () => import('@/views/finance/plans/Plans.vue')
                },
                {
                    path: '/lifestyle/workout',
                    name: 'workout',
                    component: () => import('@/views/lifestyle/workout/Workout.vue')
                },
                {
                    path: '/lifestyle/passwordmanagement',
                    name: 'passwordmgt',
                    component: () => import('@/views/lifestyle/passwordmgt/PasswordManagement.vue'),
                    // meta: {
                    //     requiresPassword: true
                    // }
                },
                {
                    path: '/lifestyle/notes',
                    name: 'notes',
                    component: () => import('@/views/lifestyle/notes/Notes.vue'),
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/notfound'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/Login.vue')
        }
    ]
});

router.beforeEach(async (to, from) => {
    if (!localStorage.getItem("pin") && to.name !== 'login') {
        return '/login'
    }

    // if (to.meta.requiresPassword) {
    //     const password = prompt('Masukkan password')

    //     if (password === import.meta.env.VITE_PASSWORD) {
    //         next()
    //     } else {
    //         next('/')
    //     }
    // } else {
    //     next()
    // }
})

export default router;
