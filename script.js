document.addEventListener("DOMContentLoaded", function () {
    // --- Time Parser Logic (from request.demo) ---
    function getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        let value = params.get(name);
        if (!value && window.location.hash.includes('?')) {
            const hashQuery = window.location.hash.split('?')[1];
            const hashParams = new URLSearchParams(hashQuery);
            value = hashParams.get(name);
        }
        return value ? decodeURIComponent(value) : '';
    }

    function parseEpoch(value) {
        if (!/^-?\d+(\.\d+)?$/.test(value)) return null;
        const num = Number(value);
        if (!Number.isFinite(num)) return null;
        if (num > 1e12) return new Date(num);
        if (num > 1e9) return new Date(num * 1000);
        return null;
    }

    function applyMonthShift(date, amount) {
        const next = new Date(date.getTime());
        const day = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + amount);
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(day, maxDay));
        return next;
    }

    function applyYearShift(date, amount) {
        const next = new Date(date.getTime());
        const day = next.getDate();
        next.setDate(1);
        next.setFullYear(next.getFullYear() + amount);
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(day, maxDay));
        return next;
    }

    function roundDown(date, unit) {
        const next = new Date(date.getTime());
        if (unit === 'y') { next.setMonth(0, 1); next.setHours(0, 0, 0, 0); return next; }
        if (unit === 'M') { next.setDate(1); next.setHours(0, 0, 0, 0); return next; }
        if (unit === 'w') {
            const day = next.getDay();
            const diff = (day + 6) % 7;
            next.setDate(next.getDate() - diff);
            next.setHours(0, 0, 0, 0);
            return next;
        }
        if (unit === 'd') { next.setHours(0, 0, 0, 0); return next; }
        if (unit === 'h') { next.setMinutes(0, 0, 0); return next; }
        if (unit === 'm') { next.setSeconds(0, 0); return next; }
        if (unit === 's') { next.setMilliseconds(0); return next; }
        return next;
    }

    function parseDateMath(value, now) {
        if (!value) return null;
        if (value === 'now') return new Date(now.getTime());
        const baseMatch = value.match(/^now([+-].+)?$/);
        if (!baseMatch) return null;
        let cursor = new Date(now.getTime());
        let remainder = value.slice(3);
        let rounding = null;
        const roundingIndex = remainder.indexOf('/');
        if (roundingIndex >= 0) {
            rounding = remainder.slice(roundingIndex + 1);
            remainder = remainder.slice(0, roundingIndex);
        }
        const opRegex = /([+-])(\d+)([smhdwMy])/g;
        let opMatch;
        while ((opMatch = opRegex.exec(remainder))) {
            const sign = opMatch[1] === '-' ? -1 : 1;
            const amount = Number(opMatch[2]) * sign;
            const unit = opMatch[3];
            if (unit === 's') cursor = new Date(cursor.getTime() + amount * 1000);
            if (unit === 'm') cursor = new Date(cursor.getTime() + amount * 60000);
            if (unit === 'h') cursor = new Date(cursor.getTime() + amount * 3600000);
            if (unit === 'd') cursor = new Date(cursor.getTime() + amount * 86400000);
            if (unit === 'w') cursor = new Date(cursor.getTime() + amount * 7 * 86400000);
            if (unit === 'M') cursor = applyMonthShift(cursor, amount);
            if (unit === 'y') cursor = applyYearShift(cursor, amount);
        }
        if (rounding) cursor = roundDown(cursor, rounding);
        return cursor;
    }

    function parseTimeValue(value, now) {
        if (!value) return null;
        const epoch = parseEpoch(value);
        if (epoch) return epoch;
        const iso = new Date(value);
        if (!Number.isNaN(iso.getTime()) && /\d{4}-\d{2}-\d{2}/.test(value)) return iso;
        const math = parseDateMath(value, now);
        if (math) return math;
        return null;
    }

    function pad(value) { return String(value).padStart(2, '0'); }
    function formatDate(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function describeRange(from, to, rawFrom, rawTo) {
        if (rawFrom && rawTo) {
            const relFrom = /^now/.test(rawFrom);
            const relTo = /^now/.test(rawTo);
            if (relFrom && relTo) return `${rawFrom} → ${rawTo}`;
            if (relFrom && rawTo === 'now') {
                const diff = to.getTime() - from.getTime();
                const hours = diff / 3600000;
                if (Math.abs(hours - 1) < 0.01) return 'Last 1 hour';
                if (Math.abs(hours - 6) < 0.05) return 'Last 6 hours';
                if (Math.abs(hours - 12) < 0.05) return 'Last 12 hours';
                if (Math.abs(hours - 24) < 0.1) return 'Last 24 hours';
                if (Math.abs(hours - 168) < 0.5) return 'Last 7 days';
            }
        }
        return `${formatDate(from)} — ${formatDate(to)}`;
    }

    // --- Main Dashboard Logic ---
    const rawFrom = getQueryParam('from') || 'now-6h';
    const rawTo = getQueryParam('to') || 'now';
    const now = new Date();
    const fromDateObj = parseTimeValue(rawFrom, now) || new Date(now.getTime() - 6 * 3600000);
    const toDateObj = parseTimeValue(rawTo, now) || now;

    const params = {
        path: (getQueryParam('path') || 'Loki slow requests').replace(/^\/+/, ''),
        client_name: getQueryParam('client_name') || 'cluster-prod-01.internal',
        from: rawFrom,
        to: rawTo
    };

    // Update UI placeholders
    document.getElementById('display-path').innerText = params.path;
    document.getElementById('display-client-name').innerText = params.client_name;
    document.getElementById('display-time-range').innerText = describeRange(fromDateObj, toDateObj, params.from, params.to);

    // Config
    Chart.defaults.color = '#d8d9da';
    Chart.defaults.borderColor = '#2c3235';
    Chart.defaults.font.family = '"Roboto", Helvetica, Arial, sans-serif';

    // 1. Request Performance
    const ctx1 = document.getElementById('chartRequestPerformance').getContext('2d');
    const labels1 = Array.from({length: 20}, (_, i) => 220 + i * 10 + ' ms');
    
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels1,
            datasets: [{
                label: 'Count',
                data: Array.from({length: 20}, () => Math.floor(Math.random() * 5)),
                backgroundColor: '#73bf69',
                barPercentage: 0.9,
                categoryPercentage: 1.0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#2c3235' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Request Performance by URLs
    const ctx2 = document.getElementById('chartRequestPerformanceUrl').getContext('2d');
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels1,
            datasets: [
                { label: '/api/v1/auth/login', data: Array.from({length: 20}, () => Math.random() > 0.8 ? 1 : 0), backgroundColor: '#ff9830' },
                { label: '/api/v2/user/profile', data: Array.from({length: 20}, () => Math.random() > 0.8 ? 1 : 0), backgroundColor: '#f2495c' },
                { label: '/v1/search/query', data: Array.from({length: 20}, () => Math.random() > 0.8 ? 1 : 0), backgroundColor: '#3274d9' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { color: '#2c3235' } }
            }
        }
    });

    // 3. Slow Request Rate
    const ctx3 = document.getElementById('chartSlowRate').getContext('2d');
    const timeLabels = [];
    let timeCursor = new Date();
    for (let i = 0; i < 30; i++) {
        timeLabels.unshift(timeCursor.getHours() + ':' + String(timeCursor.getMinutes()).padStart(2, '0'));
        timeCursor.setMinutes(timeCursor.getMinutes() - 10);
    }

    new Chart(ctx3, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                { label: 'svc-gateway-errors', data: Array.from({length: 30}, () => Math.random() < 0.1 ? Math.random() * 0.05 : 0), borderColor: '#ff9830', borderWidth: 2, pointRadius: 0 },
                { label: 'svc-data-node-slow', data: Array.from({length: 30}, () => Math.random() < 0.1 ? Math.random() * 0.05 : 0), borderColor: '#73bf69', borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } },
            scales: {
                y: { grid: { color: '#2c3235' } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
            }
        }
    });

    // 4. Slow Request Count
    const ctx4 = document.getElementById('chartSlowCount').getContext('2d');
    new Chart(ctx4, {
        type: 'bar',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Count',
                data: Array.from({length: 30}, () => Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0),
                backgroundColor: (c) => c.raw === 0 ? 'transparent' : ['#ff9830', '#73bf69', '#3274d9', '#f2495c'][Math.floor(Math.random() * 4)],
                barThickness: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
            }
        }
    });

    // 5. Populate Data Table
    const tableBody = document.querySelector('#slow-requests-table tbody');
    const methods = ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'];
    const statuses = [200, 400, 401, 403, 404, 500, 502, 503];
    const services = ['auth', 'billing', 'inventory', 'shipping', 'analytics', 'gateway'];
    const resourceTypes = ['user', 'order', 'item', 'session', 'report'];
    
    function generateID(len) {
        let r = '';
        const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < len; i++) r += c.charAt(Math.floor(Math.random() * c.length));
        return r;
    }

    function generateRow() {
        const d = new Date(); d.setMinutes(d.getMinutes() - Math.floor(Math.random() * 300));
        const t = d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0];
        const ms = Math.floor(Math.random() * 800 + 200) + ' ms';
        const m = methods[Math.floor(Math.random() * methods.length)];
        const s = statuses[Math.floor(Math.random() * statuses.length)];
        const rid = generateID(16);
        const svc = services[Math.floor(Math.random() * services.length)];
        const res = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        const u = `/api/v${Math.floor(Math.random()*3)+1}/${svc}/${res}/${generateID(8)}`;
        return `<tr><td>${t}</td><td style="color: #ff9830">${ms}</td><td>${m}</td><td>${s}</td><td style="color: #3274d9">${rid}</td><td>${u}</td></tr>`;
    }

    let rowsHtml = '';
    for (let i = 0; i < 10; i++) rowsHtml += generateRow();
    tableBody.innerHTML = rowsHtml;

    setInterval(() => {
        document.getElementById('stat-slow').innerText = Math.floor(Math.random() * 20) + 10;
        document.getElementById('stat-total').innerText = Math.floor(Math.random() * 50) + 20;
    }, 5000);
});