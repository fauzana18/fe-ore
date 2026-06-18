
export function useFinance() {
    const formatCurrency = (value) => {
        if(value && !isNaN(value)) {
            return value.toLocaleString('id-ID', {style: 'currency', currency: 'IDR'})
        } else return 'Rp 0'
    };

    const dateHandler = (date, isMobile, getTime = false) => {
        if(isMobile) {
            const options = { year: '2-digit', month: '2-digit', day: '2-digit' }
            const d = new Date(date)
            return d.toLocaleDateString('id-ID', options)
        } else {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            const d = new Date(date)
            const dateNow = new Date()
            const dateString = d.toLocaleDateString('id-ID', options)
            const dateNowString = dateNow.toLocaleDateString('id-ID', options)
            const res = dateNowString == dateString ? getTime ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : `Hari ini, ${dateString.split(', ')[1]}` : dateString
            return res
        }
    }

    return {
        formatCurrency,
        dateHandler
    };
}
