document.addEventListener("DOMContentLoaded", function () {
    // Parameter Handling
    const urlParams = new URLSearchParams(window.location.search);
    const params = {
        path: (urlParams.get('path') || 'Loki slow requests').replace(/^\/+/, ''),
        client_name: urlParams.get('client_name') || 'cluster-prod-01.internal',
        from: urlParams.get('from') || 'now-6h',
        to: urlParams.get('to') || 'now'
    };

    // Update UI placeholders
    document.getElementById('display-path').innerText = params.path;
    document.getElementById('display-client-name').innerText = params.client_name;
    document.getElementById('display-time-range').innerText = `${params.from} to ${params.to}`;

    // Config
    Chart.defaults.color = '#d8d9da';
    Chart.defaults.borderColor = '#2c3235';
    Chart.defaults.font.family = '"Roboto", Helvetica, Arial, sans-serif';

    // 1. Request Performance (Histogram-like Bar Chart)
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
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#2c3235' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Request Performance by URLs (Stacked Bar)
    const ctx2 = document.getElementById('chartRequestPerformanceUrl').getContext('2d');
    
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels1,
            datasets: [
                {
                    label: '/api/v1/auth/login',
                    data: Array.from({length: 20}, () => Math.random() > 0.8 ? 1 : 0),
                    backgroundColor: '#ff9830'
                },
                {
                    label: '/api/v2/user/profile',
                    data: Array.from({length: 20}, () => Math.random() > 0.8 ? 1 : 0),
                    backgroundColor: '#f2495c'
                },
                {
                    label: '/v1/search/query',
                    data: Array.from({length: 20}, () => Math.random() > 0.8 ? 1 : 0),
                    backgroundColor: '#3274d9'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10 } }
            },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { color: '#2c3235' } }
            }
        }
    });

    // 3. Slow Request Rate (Line Chart)
    const ctx3 = document.getElementById('chartSlowRate').getContext('2d');
    const timeLabels = [];
    let now = new Date();
    for (let i = 0; i < 30; i++) {
        timeLabels.unshift(now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'));
        now.setMinutes(now.getMinutes() - 10);
    }

    new Chart(ctx3, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'svc-gateway-errors',
                    data: Array.from({length: 30}, () => Math.random() < 0.1 ? Math.random() * 0.05 : 0),
                    borderColor: '#ff9830',
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: 'svc-data-node-slow',
                    data: Array.from({length: 30}, () => Math.random() < 0.1 ? Math.random() * 0.05 : 0),
                    borderColor: '#73bf69',
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            },
            scales: {
                y: { grid: { color: '#2c3235' } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
            }
        }
    });

    // 4. Slow Request Count (Bar Chart with Gaps)
    const ctx4 = document.getElementById('chartSlowCount').getContext('2d');
    
    new Chart(ctx4, {
        type: 'bar',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Count',
                    data: Array.from({length: 30}, () => Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0),
                    backgroundColor: (context) => {
                        const val = context.raw;
                        if (val === 0) return 'transparent';
                        return ['#ff9830', '#73bf69', '#3274d9', '#f2495c'][Math.floor(Math.random() * 4)];
                    },
                    barThickness: 5
                }
            ]
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
    
    function generateID(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    function generateRow() {
        const date = new Date();
        date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 300));
        const timeStr = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
        
        const ms = Math.floor(Math.random() * 800 + 200) + ' ms';
        const method = methods[Math.floor(Math.random() * methods.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const reqId = generateID(16);
        
        const svc = services[Math.floor(Math.random() * services.length)];
        const res = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        const url = `/api/v${Math.floor(Math.random()*3)+1}/${svc}/${res}/${generateID(8)}`;

        return `
            <tr>
                <td>${timeStr}</td>
                <td style="color: #ff9830">${ms}</td>
                <td>${method}</td>
                <td>${status}</td>
                <td style="color: #3274d9">${reqId}</td>
                <td>${url}</td>
            </tr>
        `;
    }

    let rowsHtml = '';
    for (let i = 0; i < 10; i++) {
        rowsHtml += generateRow();
    }
    tableBody.innerHTML = rowsHtml;

    // 6. Update Stats Randomly
    setInterval(() => {
        document.getElementById('stat-slow').innerText = Math.floor(Math.random() * 20) + 10;
        document.getElementById('stat-total').innerText = Math.floor(Math.random() * 50) + 20;
    }, 5000);
});
