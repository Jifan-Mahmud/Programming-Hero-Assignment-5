
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Elements
    const logoutBtn = document.getElementById('logoutBtn');
    const issuesGrid = document.getElementById('issuesGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const issueCount = document.getElementById('issueCount');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // Modal elements
    const issueModal = document.getElementById('issueModal');
    const closeModal = document.querySelector('.close-modal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    // API State
    let allIssues = [];
    let currentTab = 'all'; // all, open, closed

    // Base API URLs
    const API_BASE = 'https://phi-lab-server.vercel.app/api/v1/lab';

    // Fetch initial data
    fetchIssues();

    // Event Listeners
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active class
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            currentTab = e.target.dataset.tab;
            renderIssues();
        });
    });

    searchBtn.addEventListener('click', () => {
        handleSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    closeModal.addEventListener('click', () => { issueModal.style.display = 'none'; });
    modalCloseBtn.addEventListener('click', () => { issueModal.style.display = 'none'; });

    // Functions
    async function fetchIssues() {
        showLoading(true, true);
        try {
            const res = await fetch(`${API_BASE}/issues`);
            const data = await res.json();
            // The API returns { status: 'success', data: [...] }
            allIssues = data.data || [];
            renderIssues();
        } catch (error) {
            console.error('Error fetching issues:', error);
            issuesGrid.innerHTML = '<p style="color:red;">Error loading data.</p>';
        } finally {
            showLoading(false);
        }
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            fetchIssues();
            return;
        }
        
        showLoading(true, true);
        try {
            const res = await fetch(`${API_BASE}/issues/search?q=${query}`);
            const data = await res.json();
            allIssues = data.data || [];
            renderIssues();
        } catch (error) {
            console.error('Error searching issues:', error);
            issuesGrid.innerHTML = '<p style="color:red;">Error searching data.</p>';
        } finally {
            showLoading(false);
        }
    }

    function renderIssues() {
        issuesGrid.innerHTML = '';
        
        let filteredIssues = allIssues;
        if (currentTab !== 'all') {
            filteredIssues = allIssues.filter(issue => issue.status.toLowerCase() === currentTab);
        }

        issueCount.textContent = `${filteredIssues.length} Issues`;

        filteredIssues.forEach(issue => {
            const card = document.createElement('div');
            const isOpened = issue.status.toLowerCase() === 'open';
            card.className = `issue-card status-${isOpened ? 'open' : 'closed'}`;
            
            // Map Priority to color classes
            const priorityLower = issue.priority ? issue.priority.toLowerCase() : 'low';
            const priorityClass = `priority-${priorityLower}`;

            let labelsHtml = '';
            if (issue.labels && Array.isArray(issue.labels) && issue.labels.length > 0) {
                labelsHtml = issue.labels.map(lbl => {
                    const color = lbl.color || '#d0d7de';
                    const name = lbl.name || lbl;
                    return `<span class="label-badge" style="color:${color}; border-color:${color}; background-color:${color}20">${name}</span>`;
                }).join('');
            } else if (typeof issue.label === 'string') {
                 labelsHtml = `<span class="label-badge">${issue.label}</span>`;
            } else if (Array.isArray(issue.label)) {
                 labelsHtml = issue.label.map(lbl => `<span class="label-badge">${lbl.name || lbl}</span>`).join('');
            }

            // Status Icon replacing SVG with PNGs
            const statusIcon = isOpened 
                ? `<img src="assets/Open-Status.png" alt="Open" style="width: 14px; height: 14px; vertical-align: middle;">` 
                : `<img src="assets/Closed- Status .png" alt="Closed" style="width: 14px; height: 14px; vertical-align: middle;">`;

            card.innerHTML = `
                <div class="card-header">
                    <span class="status-badge ${isOpened ? 'open' : 'closed'}">
                        ${statusIcon} ${issue.status}
                    </span>
                    <span class="priority-badge ${priorityClass}">${(issue.priority || 'Low').toUpperCase()}</span>
                </div>
                <h3 class="issue-title">${issue.title}</h3>
                <p class="issue-desc">${issue.description || 'No description provided.'}</p>
                <div class="labels-container">
                    ${labelsHtml}
                </div>
                <div class="card-footer">
                    <span>#${issue.id} by ${issue.author || 'Unknown'}</span>
                    <span>${formatDate(issue.createdAt || issue.created_at)}</span>
                </div>
            `;

            // On card click, fetch specific issue details
            card.addEventListener('click', () => {
                openIssueModal(issue.id);
            });

            issuesGrid.appendChild(card);
        });
    }

    async function openIssueModal(id) {
        showLoading(true);
        try {
            const res = await fetch(`${API_BASE}/issue/${id}`);
            const data = await res.json();
            // Single issue endpoints also return { status: 'success', data: {...} }
            populateModal(data.data || data);
        } catch (error) {
            console.error('Error fetching issue detail:', error);
            alert('Could not fetch issue details.');
        } finally {
            showLoading(false);
        }
    }

    function populateModal(issue) {
        document.getElementById('modalTitle').textContent = issue.title;
        
        const isOpened = issue.status.toLowerCase() === 'open';
        const modalStatus = document.getElementById('modalStatus');
        modalStatus.textContent = issue.status;
        modalStatus.className = `badge ${isOpened ? 'open' : 'closed'}`;
        
        document.getElementById('modalAuthor').textContent = issue.author || 'Unknown';
        document.getElementById('modalDate').textContent = formatDate(issue.createdAt || issue.created_at);
        document.getElementById('modalDescription').textContent = issue.description || 'No description available.';
        
        document.getElementById('modalAssignee').textContent = issue.author || 'None'; // Using author as assignee if not present
        
        const modalPriority = document.getElementById('modalPriorityBadge');
        modalPriority.textContent = (issue.priority || 'Low').toUpperCase();
        const pLower = (issue.priority || 'low').toLowerCase();
        modalPriority.className = `badge priority-badge priority-${pLower}`;

        const modalLabels = document.getElementById('modalLabels');
        modalLabels.innerHTML = '';
        if (issue.label) {
            if (Array.isArray(issue.label) && issue.label.length > 0) {
                modalLabels.innerHTML = issue.label.map(lbl => `<span class="badge label-badge">${lbl.name || lbl}</span>`).join('');
            } else if (typeof issue.label === 'string') {
                modalLabels.innerHTML = `<span class="badge label-badge">${issue.label}</span>`;
            }
        } 
        if (issue.labels && Array.isArray(issue.labels)) {
            modalLabels.innerHTML = issue.labels.map(lbl => {
                const color = lbl.color || '#d0d7de';
                const name = lbl.name || lbl;
                return `<span class="badge label-badge" style="color:${color}; border-color:${color}; background-color:${color}20">${name}</span>`;
            }).join('');
        }

        issueModal.style.display = 'flex';
    }

    function showLoading(isLoading, clearGrid = false) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
        if (isLoading && clearGrid) issuesGrid.innerHTML = ''; // Clear grid whilst loading
    }

    function formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString; // fallback
        
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
});
