document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch User Profile
        const response = await API.getProfile();
        const user = response.data;

        // Update UI with User Info
        updateUserProfile(user);

        // Render Navigation based on Role
        renderNavigation(user.role);

        // Render Dashboard Content
        renderDashboard(user);

    } catch (error) {
        console.error('Dashboard Init Error:', error);
        // If profile fetch fails heavily, might redirect to login (handled in API.getProfile)
    }
});

function updateUserProfile(user) {
    document.getElementById('userName').textContent = user.full_name || user.email;
    document.getElementById('userRole').textContent = user.role;
    document.getElementById('userAvatar').textContent = (user.full_name || user.email).charAt(0).toUpperCase();
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function closeModal(e) {
    // Only close if clicking the actual overlay background, not elements inside it
    if (e && e.target !== e.currentTarget) return;
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function renderNavigation(role) {
    const nav = document.getElementById('sidebarNav');
    let items = [];

    // Common Items
    items.push({ label: 'Ringkasan', href: '#dashboard', active: true });

    if (role === 'admin') {
        items.push(
            { label: 'Pengguna', href: '#users' },
            { label: 'Dompet', href: '#wallets' },
            { label: 'Transaksi', href: '#transactions' },
            { label: 'Transfer P2P', href: '#admin-transfers' },
            { label: 'Marketplace', href: '#products' },
            { label: 'Riwayat Penjualan', href: '#admin-sales' },
            { label: 'Log Audit', href: '#audit-logs' }
        );
    } else if (role === 'dosen') {
        items.push(
            { label: 'Buat Quis', href: '#quizzes' },
            { label: 'Buat Misi', href: '#missions' },
            { label: 'Approval', href: '#submissions' }
        );
    } else if (role === 'mahasiswa') {
        items.push(
            { label: 'Misi', href: '#missions' },
            { label: 'MarketPlace', href: '#shop' },
            { label: 'Scan QR', href: '#transfer' },
            { label: 'Wallet', href: '#history' }
        );
    } else if (role === 'merchant') {
        items.push(
            { label: 'Dashboard', href: '#merchant-dashboard' },
            { label: 'Kasir Scan', href: '#merchant-scanner' }
        );
    }

    items.push({ label: 'Pengaturan', href: '#profile' });

    nav.innerHTML = items.map(item => `
        <a href="${item.href}" class="nav-item ${item.active ? 'active' : ''}" data-target="${item.href.substring(1)}">
            ${item.label}
        </a>
    `).join('');

    // Add click listeners
    nav.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            nav.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            handleNavigation(link.dataset.target, role);

            // Auto close sidebar on mobile
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });
}

function handleNavigation(target, role) {
    // Force close any open modals to prevent blurring issues
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

    const title = document.getElementById('pageTitle');
    title.textContent = target.charAt(0).toUpperCase() + target.slice(1).replace('-', ' ');

    if (role === 'admin') {
        switch (target) {
            case 'users':
                AdminController.renderUsers();
                break;
            case 'wallets':
                AdminController.renderWallets();
                break;
            case 'transactions':
                AdminController.renderTransactions();
                break;
            case 'admin-transfers':
                AdminController.renderTransfers();
                break;
            case 'products':
                AdminController.renderProducts();
                break;
            case 'admin-sales':
                AdminController.renderMarketplaceSales();
                break;
            case 'audit-logs':
                AdminController.renderAuditLogs();
                break;
            case 'profile':
                ProfileController.renderProfile();
                break;
            default:
                renderDashboard({ role: 'admin' });
                title.textContent = 'Ringkasan Admin';
                AdminController.loadDashboardStats();
        }
    } else if (role === 'dosen') {
        switch (target) {
            case 'quizzes':
                DosenController.renderQuizzes();
                break;
            case 'missions':
                DosenController.renderMissions();
                break;
            case 'submissions':
                DosenController.renderSubmissions();
                break;
            case 'profile':
                ProfileController.renderProfile();
                break;
            default:
                renderDashboard({ role: 'dosen' });
                title.textContent = 'Ringkasan Dosen';
        }
    } else if (role === 'mahasiswa') {
        switch (target) {
            case 'missions':
                MahasiswaController.renderMissions();
                break;
            case 'shop':
                MahasiswaController.renderShop();
                break;
            case 'transfer':
                MahasiswaController.renderTransfer();
                break;

            case 'history':
                MahasiswaController.renderLedger();
                break;
            case 'profile':
                ProfileController.renderProfile();
                break;
            default:
                renderDashboard({ role: 'mahasiswa' });
                title.textContent = 'Dashboard Mahasiswa';
        }
    } else if (role === 'merchant') {
        switch (target) {
            case 'merchant-scanner':
                MerchantController.renderMerchantScanner();
                break;
            case 'profile':
                ProfileController.renderProfile();
                break;
            default:
                renderDashboard({ role: 'merchant' });
                title.textContent = 'Dashboard Kasir';
        }
    }
}

function renderDashboard(user) {
    const content = document.getElementById('mainContent');
    const title = document.getElementById('pageTitle');

    title.textContent = `Dashboard ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`;

    if (user.role === 'admin') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card card-gradient-1">
                    <span class="stat-label">Pengguna Sistem</span>
                    <div class="stat-value" id="stats-users">--</div>
                    <div class="stat-trend" style="color: var(--primary)">Total Terdaftar</div>
                </div>
                <div class="stat-card card-gradient-2">
                    <span class="stat-label">Total Transaksi</span>
                    <div class="stat-value" id="stats-txns">--</div>
                    <div class="stat-trend" style="color: var(--secondary)">Semua Acara</div>
                </div>
                <div class="stat-card card-gradient-3">
                    <span class="stat-label">Status API</span>
                    <div class="stat-value" style="color: var(--success); font-size: 1.5rem; margin-top: 0.5rem;">SEHAT</div>
                    <div class="stat-trend">Koneksi Stabil</div>
                </div>
            </div>
            
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Akses Cepat</h3>
                </div>
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                    <p>Selamat datang di panel admin premium. Gunakan bilah sisi untuk menavigasi antar modul.</p>
                </div>
            </div>
        `;
        AdminController.loadDashboardStats();
    } else if (user.role === 'dosen') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card card-gradient-1">
                    <span class="stat-label">Misi Saya</span>
                    <div class="stat-value" id="stats-missions">--</div>
                    <div class="stat-trend" style="color: var(--primary)">Total Dibuat</div>
                </div>
                <div class="stat-card card-gradient-2">
                    <span class="stat-label">Ulasan Tertunda</span>
                    <div class="stat-value" id="stats-pending">--</div>
                    <div class="stat-trend" style="color: var(--secondary)">Tindakan Diperlukan</div>
                </div>
                <div class="stat-card card-gradient-3">
                    <span class="stat-label">Tugas Divalidasi</span>
                    <div class="stat-value" id="stats-validated">--</div>
                    <div class="stat-trend" style="color: var(--success)">Disetujui oleh Saya</div>
                </div>
            </div>
            
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Dashboard Dosen</h3>
                </div>
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                    <p>Selamat datang, Pak/Bu. Anda dapat mengelola misi Anda dan meninjau kiriman mahasiswa menggunakan bilah sisi.</p>
                </div>
            </div>
        `;
        DosenController.loadDosenStats();
    } else if (user.role === 'mahasiswa') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card card-gradient-1">
                    <span class="stat-label">Saldo Emerald</span>
                    <div class="stat-value" id="userBalance">--</div>
                    <div class="stat-trend" style="color:var(--primary)">Tersedia untuk dibelanjakan</div>
                </div>
                <div class="stat-card card-gradient-2">
                    <span class="stat-label">Misi Selesai</span>
                    <div class="stat-value" id="stats-missions-done">--</div>
                    <div class="stat-trend" style="color:var(--secondary)">Poin Diperoleh</div>
                </div>
                <div class="stat-card card-gradient-3">
                    <span class="stat-label">Pusat Penemuan</span>
                    <div class="stat-value" id="stats-active-missions">--</div>
                    <div class="stat-trend" style="color:var(--success)">Tugas Tersedia</div>
                </div>
            </div>

            <div class="card fade-in" style="margin-top: 2rem; padding: 2.5rem; text-align: center; background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05)); border: 1px dashed var(--primary-light);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">👋</div>
                <h2 style="font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Selamat datang kembali, ${user.full_name || 'Mahasiswa'}!</h2>
                <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto;">Siap untuk menaiki papan peringkat? Pergilah ke Pusat Penemuan untuk menemukan misi baru dan dapatkan lebih banyak poin untuk hadiah.</p>
                <button class="btn btn-primary" style="margin-top: 1.5rem; border-radius: 20px;" onclick="handleNavigation('missions', 'mahasiswa')">Jelajahi Misi</button>
            </div>
        `;
        // Load student stats via API
        loadStudentStats();
    } else if (user.role === 'merchant') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card card-gradient-1">
                    <span class="stat-label">Total Penjualan Hari Ini</span>
                    <div class="stat-value" id="stats-merchant-sales">--</div>
                    <div class="stat-trend" style="color:var(--primary)">Poin Terkumpul</div>
                </div>
                <div class="stat-card card-gradient-2">
                    <span class="stat-label">Jumlah Transaksi</span>
                    <div class="stat-value" id="stats-merchant-count">--</div>
                    <div class="stat-trend" style="color:var(--secondary)">Sesi Berhasil</div>
                </div>
                 <div class="stat-card card-gradient-3">
                    <span class="stat-label">Saldo Emerald (Kredit)</span>
                    <div class="stat-value" id="stats-merchant-balance">--</div>
                    <div class="stat-trend" style="color:var(--success)">Total Kredit Masuk</div>
                </div>
            </div>

            <div class="card fade-in" style="margin-top: 2rem; padding: 2.5rem; text-align: center; background: white; border: 1px solid var(--primary-light); border-radius:30px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🏧</div>
                <h2 style="font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Terminal Kasir WalletPoint</h2>
                <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto;">Gunakan fitur "Kasir Scan" di bilah sisi untuk memproses pembayaran mahasiswa menggunakan QR Code mereka.</p>
                <button class="btn btn-primary" style="margin-top: 1.5rem; border-radius: 20px; padding: 1rem 2rem;" onclick="handleNavigation('merchant-scanner', 'merchant')">Mulai Scan QR 📷</button>
            </div>
        `;
        MerchantController.loadMerchantStats();
    }
}

async function loadStudentStats() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const wallet = await API.getWallet(user.id);
        const missions = await API.getMissions();
        const submissions = await API.getSubmissions({ status: 'approved' });

        document.getElementById('userBalance').textContent = wallet.data.balance.toLocaleString();
        document.getElementById('stats-missions-done').textContent = (submissions.data.submissions || []).filter(s => s.user_id === user.id).length;
        document.getElementById('stats-active-missions').textContent = (missions.data.missions || []).length;
    } catch (e) { console.error(e); }
}

function toggleSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    } else {
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
    }
}
