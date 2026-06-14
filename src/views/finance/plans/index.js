import FinanceService from '@/service/FinanceService'
import * as XLSX from 'xlsx'

export default {
    data() {
		return {
            amountNegative: false,
            loading: false,
			income: 0,
			out: 0,
			planlist: [],
            pemasukan: [],
            pengeluaran: [],
			
			monthTitle: '',
			month: null,
			dateconfig: {month: 'long', year: 'numeric'},
			dateregion: 'id-ID',

			planDialog: false,
			deletePlanDialog: false,
			submitted: false,
			submitting: false,
			plan: {},
			modalHeader: 'Tambah Plan',
			submitStatus: '',
			submitMessage: '',
			type: [
				{ label: 'Pengeluaran', code: 'out' },
				{ label: 'Pemasukan', code: 'in' }
			],
			toDelete: {},

			exportDialog: false,
			exporting: false,
			range: [
				{ label: 'Bulan Terpilih', code: 2 },
				{ label: 'Semua', code: 1 },
				// { label: 'Atur Sendiri', code: 3 }
			],
			exportRange: {},
			monthRange: null,
		}
	},
	financeService: null,
    watch: {
		month: {
			async handler() {
				const date = new Date(this.month)
				const namaBulan = date.toLocaleString(this.dateregion, this.dateconfig)
				this.monthTitle = namaBulan

				const params = namaBulan.split(' ')
				await this.getPlan(params[0], params[1])
			}
		}
    },
    created() {
		this.financeService = new FinanceService()
	},
	async mounted() {
		const date = new Date()
		this.month = date
		const namaBulan = date.toLocaleString(this.dateregion, this.dateconfig)
		this.monthTitle = namaBulan
		const params = namaBulan.split(' ')

		await this.getPlan(params[0], params[1])
	},
	methods: {
		formatCurrency(value) {
			return value.toLocaleString('id-ID', {style: 'currency', currency: 'IDR'})
		},
		async getPlan(month, year) {
			this.loading = true
			const res = await this.financeService.getPlanList(month, year)
			const result = res.data.result
			this.planlist = result
			this.pemasukan = result.filter(r => r.type == 'in')
			this.pengeluaran = result.filter(r => r.type == 'out')

			this.income = 0
			this.pemasukan.map(item => {
				this.income += item.amount
			})

			this.out = 0
			this.pengeluaran.map(item => {
				this.out += item.amount
			})
			
			this.amountNegative = this.income - this.out < 0
			this.loading = false
		},
		async changeMonth(to) {
			const date = new Date(this.month)
			if(to == 'next') date.setMonth(date.getMonth() + 1)
			else date.setMonth(date.getMonth() - 1)
			
			this.month = date
			const namaBulan = date.toLocaleString(this.dateregion, this.dateconfig)
			this.monthTitle = namaBulan

			const params = namaBulan.split(' ')
			await this.getPlan(params[0], params[1])
		},
		openNew() {
			this.plan = {
				type: this.type[0]
			}
			this.submitStatus = ''
			this.submitted = false
			this.modalHeader = `Tambah Plan ${this.monthTitle}`
			this.planDialog = true
		},
		hideDialog() {
			this.planDialog = false
			this.submitted = false
		},
		async savePlan() {
			let res
			this.submitted = true
			this.submitting = true

			if(!this.plan.name || !this.plan.amount) {
				this.submitting = false
				return
			}

			const body = {
				name: this.plan.name,
				amount: this.plan.amount,
				type: this.plan.type.code,
				month: this.monthTitle.split(' ')[0],
				year: this.monthTitle.split(' ')[1],
				created: new Date()
			}
			
			try {
				if(!this.plan.id) res = await this.financeService.createPlan(body)
				else res = await this.financeService.updatePlan(body, this.plan.id)

				if(res.status == 200) {
					this.submitStatus = 'success'
					this.submitMessage = res.data.message
					this.planDialog = false
					this.$toast.add({severity: 'success', summary: 'Sukses', detail: res.data.message, life: 3000})
				}
				else {
					this.submitStatus = 'error'
					this.submitMessage = res.data.message
				}
			}
			catch(err) {
				this.submitStatus = 'error'
				this.submitMessage = err.response ? err.response.data.message : 'Data gagal dibuat.'
			}

			this.submitting = false
		},
		editPlan(plan) {
			this.submitStatus = ''
			this.plan = {...plan}
			this.plan.created = plan.created
			this.plan.type = this.type.find(each => each.code == plan.type)
			this.modalHeader = `Ubah Plan ${plan.name} (${this.monthTitle})`
			this.planDialog = true
		},
		confirmDeletePlan(plan) {
			this.toDelete = plan
			this.deletePlanDialog = true
		},
		async deletePlan() {
			let stat, message, summary
			this.submitting = true

			try {
				const res = await this.financeService.deletePlan(this.toDelete.id)

				if(res.status == 200) {
					stat = 'success'
					message = res.data.message
					summary = 'Sukses'
				}
				else {
					stat = 'error'
					message = res.data.message
					summary = 'Gagal'
				}
			}
			catch(err) {
				stat = 'error'
				message = err.response ? err.response.data.message : 'Data gagal dihapus.'
				summary = 'Gagal'
			}

			this.deletePlanDialog = false
			this.$toast.add({severity: stat, summary, detail: message, life: 3000})
			this.submitting = false
			if(stat == 'success') await this.getPlan(this.monthTitle.split(' ')[0], this.monthTitle.split(' ')[1])
		},
		openExport() {
			this.dateStart = null
			this.dateEnd = null
			this.exportRange = this.range[0]
			this.exportDialog = true
		},
		async exportExcel() {
			let fileName, list
			this.exporting = true

			try {
				switch (this.exportRange.code) {
					case 1:
						const res = await this.financeService.getPlanRange()
						list  = res.data.result
						fileName = 'Rencana Keuangan'
						break
					case 2:
						list = this.planlist
						fileName = `Rencana Keuangan ${this.monthTitle}`
						break
				}

				if(list.length < 1) throw 'Data Kosong'

				const keyname = []

				const grouped = list.reduce((acc, item) => {
					const key = `${item.month} ${item.year}`

					if (!acc[key]) {
						acc[key] = []
						keyname.push(key)
					}

					acc[key].push(item)

					return acc
				}, {})

				keyname.sort((a, b) => {
					return new Date(a.date) - new Date(b.date)
				})

				let wb = {}
				wb.Sheets = {}
				wb.SheetNames = []
				let wopts = { bookType: 'xlsx', bookSST: false, type: 'binary' }
				let wscols = [
					{wch: 20},
					{wch: 15},
					{wch: 20},
					{wch: 15}
				]
				
				keyname.map(key => {
					let ws = { '!ref': "A1:Z111176" }
					let total_in = 0
					let total_out = 0
					
					ws['A1'] = { v: key, t: "s" }
					ws['A2'] = { v: 'Keluar', t: "s" }
					ws['C2'] = { v: 'Masuk', t: "s" }

					
					const pengeluaran = grouped[key].filter(item => item.type == 'out')
					const pemasukan = grouped[key].filter(item => item.type == 'in')

					pengeluaran.map((item, i) => {
						total_out += item.amount
						ws[`A${i+3}`] = { v: item.name, t: "s" }
						ws[`B${i+3}`] = { v: item.amount, t: "n", z: '"Rp"#,##0' }
					})

					pemasukan.map((item, i) => {
						total_in += item.amount
						ws[`C${i+3}`] = { v: item.name, t: "s" }
						ws[`D${i+3}`] = { v: item.amount, t: "n", z: '"Rp"#,##0' }
					})

					const rowcount = pengeluaran.length > pemasukan.length ? pengeluaran.length + 3 : pemasukan.length + 3

					ws[`A${rowcount}`] = { v: 'Total', t: "s" }
					ws[`B${rowcount}`] = { v: total_out, t: "n", z: '"Rp"#,##0' }
					ws[`C${rowcount}`] = { v: 'Total', t: "s" }
					ws[`D${rowcount}`] = { v: total_in, t: "n", z: '"Rp"#,##0' }
					ws[`A${rowcount + 1}`] = { v: 'Masuk - Keluar', t: "s" }
					ws[`C${rowcount + 1}`] = { v: total_in - total_out, t: "n", z: '"Rp"#,##0' }

					ws["!merges"] = [
						{s: { r: 0, c: 0 }, e: { r: 0, c: 3 }},
						{s: { r: 1, c: 0 }, e: { r: 1, c:  1}},
						{s: { r: 1, c: 2 }, e: { r: 1, c:  3}},
						{s: { r: rowcount, c: 0 }, e: { r: rowcount, c:  1}},
						{s: { r: rowcount, c: 2 }, e: { r: rowcount, c:  3}}
					]
					ws['!cols'] = wscols
				
					wb.SheetNames.push(key)
					wb.Sheets[key] = ws
				})

				XLSX.write(wb, wopts)
				XLSX.writeFile(wb, `${fileName}.xlsx`)
			}
			catch(err) {
				const message = err.response ? err.response.data.message : err
				this.$toast.add({severity: 'error', summary: 'Gagal', detail: message, life: 3000})
			}

			this.exporting = false
			this.exportDialog = false
			// this.monthRange = null
		},
		async refresh() {
			if(this.submitStatus == 'success') {
				await this.getPlan(this.monthTitle.split(' ')[0], this.monthTitle.split(' ')[1])
			}
		},
	}
}