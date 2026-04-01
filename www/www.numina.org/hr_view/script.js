// Configuration
const PAGE_SIZE = 100;
let currentPage = 1;
let currentData = [];
let filteredData = [];

// Elements
const tableBody = document.getElementById('table-body');
const filterBtns = document.querySelectorAll('.filter-btn');
const timeSearch = document.getElementById('time-search');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.querySelector('.current-p');
const totalPageInfo = document.querySelector('.total-p');
const totalReadingsEl = document.getElementById('total-readings');
const highReadingsEl = document.getElementById('high-readings');

// Format date nicely
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function init() {
    // heartRateData is exposed globally from data.js
    currentData = heartRateData;
    filteredData = [...currentData];

    // Compute metrics
    const highReadings = currentData.filter(d => d.bpm > 120).length;
    totalReadingsEl.textContent = currentData.length.toLocaleString();
    highReadingsEl.textContent = highReadings.toLocaleString();

    attachEventListeners();
    renderTable();
}

function attachEventListeners() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filter = e.target.getAttribute('data-filter');
            applyFilters(filter, timeSearch.value);
        });
    });

    timeSearch.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        applyFilters(activeFilter, e.target.value);
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
}

function applyFilters(mode, searchStr) {
    searchStr = searchStr.toLowerCase();
    
    filteredData = currentData.filter(d => {
        // filter by bpm mode
        let matchesMode = true;
        if (mode === 'high') {
            matchesMode = d.bpm > 120;
        }

        // filter by time
        let matchesSearch = true;
        if (searchStr.length > 0) {
            const timeStr = formatTime(d.timestamp).toLowerCase();
            matchesSearch = timeStr.includes(searchStr);
        }

        return matchesMode && matchesSearch;
    });

    currentPage = 1; // reset to first page
    renderTable();
}

function renderTable() {
    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE) || 1;
    
    // Safety check boundaries
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Update pagination UI
    pageInfo.textContent = currentPage.toLocaleString();
    totalPageInfo.textContent = totalPages.toLocaleString();
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageData = filteredData.slice(startIdx, endIdx);

    // Clear old data
    tableBody.innerHTML = '';

    // Render rows
    if (pageData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); py-8;">No readings found</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();

    pageData.forEach(row => {
        const tr = document.createElement('tr');
        const isHigh = row.bpm > 120;
        
        if (isHigh) {
            tr.className = 'row-high';
        }

        tr.innerHTML = `
            <td class="col-time">${formatTime(row.timestamp)}</td>
            <td class="col-bpm">${row.bpm}</td>
            <td class="col-device">${row.source}</td>
            <td>
                <span class="status-badge ${isHigh ? 'status-high' : 'status-normal'}">
                    ${isHigh ? 'Elevated' : 'Normal'}
                </span>
            </td>
        `;
        
        fragment.appendChild(tr);
    });

    tableBody.appendChild(fragment);
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
