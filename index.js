// const baseUrl = 'https://sgd-myr-rates-api-production.up.railway.app/'; // Free credit, will use up
// const baseUrl = 'https://sgd-myr-rates-api.onrender.com/';  // Render will sleep after 15 minutes, slow first call
const baseUrl = 'https://yongjianwen-rates.hf.space/';  // Best way
const ratesUrl = baseUrl + 'rates/';

const refreshInterval = 60000; // 60 seconds

const tableRows = document.querySelectorAll('.data-table tr');
const cimb = document.querySelector('#cimb');
const wise = document.querySelector('#wise');
const panda = document.querySelector('#panda');
const countdown = document.querySelector('#countdown');
const amountInput = document.getElementById('amount');

let debounceTimer;
let refreshTimer;

const initialValue = localStorage.getItem('sgd');
if (initialValue) {
    amountInput.value = initialValue;
} else {
    amountInput.value = '1000';
}

prepareFetch();

amountInput.addEventListener('input', function (e) {
    // Ensure only numbers and decimals are entered
    const value = e.target.value.replace(/[^0-9.]/g, '')
        .replace(/(\..*)\./g, '$1');
    e.target.value = value;

    localStorage.setItem('sgd', value);

    if (!value) {
        cimb.innerHTML = 'N/A';
        wise.innerHTML = 'N/A';
        panda.innerHTML = 'N/A';

        tableRows.forEach(row => {
            const valueCell = row.querySelector('.result');
            const checkIcon = row.querySelector('.status-icon');

            valueCell.querySelector('.diff').innerHTML = '';

            checkIcon.classList.remove('loading');
            checkIcon.classList.add('inactive');
            checkIcon.classList.remove('active');
        });

        clearTimeout(debounceTimer);
        clearTimeout(refreshTimer);
        localStorage.setItem('sgd', '1000');

        return;
    }

    clearInterval(refreshTimer);
    countdown.innerHTML = 0;

    prepareFetch();
});

async function prepareFetch() {
    // Show loading indicator
    tableRows.forEach(row => {
        const checkIcon = row.querySelector('.status-icon');

        checkIcon.classList.add('loading');
        checkIcon.innerHTML = '';
    });

    // Debounce the API call
    debounceFetch(amountInput.value);
}

// Debounce function to delay API call
function debounceFetch(value) {
    clearTimeout(debounceTimer);
    // if (refresh) clearInterval(refresh);
    debounceTimer = setTimeout(() => {
        fetchRates(value);
    }, 1000); // 1 second delay
}

async function fetchRates(value) {
    fetch(ratesUrl + value)
        .then(res => res.json())
        .then(json => {
            cimb.innerHTML = json['cimb'].toFixed(2);
            wise.innerHTML = json['wise'].toFixed(2);
            panda.innerHTML = json['panda'].toFixed(2);

            const values = [];

            tableRows.forEach(row => {
                const valueCell = row.querySelector('.result');
                const value = parseFloat(valueCell.textContent);
                values.push(value);
            });

            const maxValue = Math.max(...values);

            tableRows.forEach(row => {
                const valueCell = row.querySelector('.result');
                const checkIcon = row.querySelector('.status-icon');
                const value = parseFloat(valueCell.textContent);

                checkIcon.classList.remove('loading');
                checkIcon.innerHTML = 'check_circle';

                if (value === maxValue) {
                    checkIcon.classList.add('active');
                    checkIcon.classList.remove('inactive');

                    valueCell.querySelector('.diff').innerHTML = '';
                } else {
                    checkIcon.classList.add('inactive');
                    checkIcon.classList.remove('active');

                    const diff = maxValue - value;
                    valueCell.querySelector('.diff').innerHTML = '(-' + diff.toFixed(2) + ')';
                }
            });

            cimb.innerHTML = 'RM ' + json['cimb'].toFixed(2);
            wise.innerHTML = 'RM ' + json['wise'].toFixed(2);
            panda.innerHTML = 'RM ' + json['panda'].toFixed(2);
        })
        .catch(error => {
            console.error(error)
            cimb.innerHTML = 'N/A';
            wise.innerHTML = 'N/A';
            panda.innerHTML = 'N/A';

            tableRows.forEach(row => {
                const checkIcon = row.querySelector('.status-icon');

                checkIcon.classList.remove('loading');
                checkIcon.classList.add('inactive');
                checkIcon.classList.remove('active');
            });
        })
        .finally(() => {
            clearInterval(refreshTimer);
            countdown.innerHTML = refreshInterval / 1000;
            refreshTimer = setInterval(() => {
                countdown.innerHTML = Math.max(0, Number(countdown.innerHTML) - 1);
                if (countdown.innerHTML === '0') {
                    clearInterval(refreshTimer);
                    prepareFetch()
                }
            }, 1000);
        });
}
