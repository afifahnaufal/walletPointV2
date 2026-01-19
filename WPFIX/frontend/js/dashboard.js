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

        // Initialize Navigation and View
        renderNavigation(user.role);
        handleNavigation('dashboard', user.role);

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

    if (role === 'admin') {
        items.push(
            { label: 'Dashboard', href: '#dashboard', active: true },
            { label: 'Data Pengguna', href: '#users' },
            { label: 'Data Produk', href: '#products' },
            { label: 'Log Audit', href: '#audit-logs' }
        );
    } else if (role === 'dosen') {
        items.push(
            { label: 'Dashboard', href: '#dashboard', active: true },
            { label: 'Buat Quis', href: '#quizzes' },
            { label: 'Buat Misi', href: '#missions' },
            { label: 'Approval', href: '#submissions' },
            { label: 'Data Siswa', href: '#dosen-students' }
        );
    } else if (role === 'mahasiswa') {
        items.push(
            { label: 'Dashboard', href: '#dashboard', active: true },
            { label: 'Pindai QR', href: '#scan' },
            { label: 'Misi', href: '#missions' },
            { label: 'MarketPlace', href: '#shop' },
            { label: 'Transfer Poin', href: '#transfer' },
            { label: 'Wallet', href: '#history' }
        );
    } else if (role === 'merchant') {
        items.push(
            { label: 'Dashboard', href: '#merchant-dashboard', active: true }
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
            case 'products':
                AdminController.renderProducts();
                break;
            case 'audit-logs':
                AdminController.renderAuditLogs();
                break;
            case 'dashboard':
                AdminController.renderDashboard();
                break;
            case 'profile':
                ProfileController.renderProfile();
                break;
            default:
                AdminController.renderDashboard();
                title.textContent = 'Dashboard Administrator';
        }
    } else if (role === 'dosen') {
        switch (target) {
            case 'dashboard':
                renderDashboard({ role: 'dosen' });
                break;
            case 'quizzes':
                DosenController.renderQuizzes();
                break;
            case 'missions':
                DosenController.renderMissions();
                break;
            case 'submissions':
                DosenController.renderSubmissions();
                break;
            case 'dosen-students':
                DosenController.renderStudents();
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
            case 'dashboard':
                renderDashboard({ role: 'mahasiswa' });
                break;
            case 'missions':
                MahasiswaController.renderMissions();
                break;
            case 'shop':
                MahasiswaController.renderShop();
                break;
            case 'transfer':
                MahasiswaController.renderTransfer();
                break;
            case 'scan':
                MahasiswaController.renderScanner();
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
                    <div class="stat-trend" style="color:rgba(255,255,255,0.8); font-weight: 600;">📚 Total tugas dibuat</div>
                </div>
                <div class="stat-card card-gradient-2">
                    <span class="stat-label">Ulasan Tertunda</span>
                    <div class="stat-value" id="stats-pending" style="color: #fbbf24;">--</div>
                    <div class="stat-trend" style="color:rgba(255,255,255,0.8); font-weight: 600;">⏳ Perlu segera diperiksa</div>
                </div>
                <div class="stat-card card-gradient-3">
                    <span class="stat-label">Tugas Divalidasi</span>
                    <div class="stat-value" id="stats-validated">--</div>
                    <div class="stat-trend" style="color:rgba(255,255,255,0.8); font-weight: 600;">✅ Sudah diberikan poin</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 2rem; margin-top: 2rem;">
                <div class="table-wrapper">
                    <div class="table-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>📥 Butuh Review Segera</h3>
                        <button class="btn btn-sm" onclick="handleNavigation('submissions', 'dosen')" style="background: var(--primary-bg); color: var(--primary); font-weight: 600;">Lihat Semua</button>
                    </div>
                    <div style="padding: 1rem;">
                        <div id="quickReviewList" style="display: flex; flex-direction: column; gap: 1rem;">
                            <!-- Simple items or empty state -->
                            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                <span class="spinner"></span> Menarik pengiriman terbaru...
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card fade-in" style="padding: 2rem; background: white; border: 1px solid var(--border); border-radius: 24px;">
                    <h3 style="margin-bottom: 1.5rem;">📊 Analisis Kelas</h3>
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                <span style="font-weight: 600;">Tingkat Kelulusan</span>
                                <span style="color: var(--success); font-weight: 700;">85%</span>
                            </div>
                            <div style="height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden;">
                                <div style="width: 85%; height: 100%; background: var(--success);"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                <span style="font-weight: 600;">Keaktifan Kuis</span>
                                <span style="color: var(--primary); font-weight: 700;">92%</span>
                            </div>
                            <div style="height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden;">
                                <div style="width: 92%; height: 100%; background: var(--primary);"></div>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px; font-size: 0.85rem; color: var(--text-muted);">
                            <strong>Insight:</strong> Mahasiswa paling aktif di hari Senin & Selasa. Waktu terbaik untuk merilis kuis baru!
                        </div>
                    </div>
                </div>
            </div>
        `;
        DosenController.loadDosenStats();
        loadDosenQuickReview();
    } else if (user.role === 'mahasiswa') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card card-gradient-1">
                    <span class="stat-label">Saldo Emerald</span>
                    <div class="stat-value" id="userBalance">--</div>
                    <div class="stat-trend" style="color:rgba(255,255,255,0.8)">💎 Poin dapat dibelanjakan</div>
                </div>
                <div class="stat-card card-gradient-2">
                    <span class="stat-label">Misi Selesai</span>
                    <div class="stat-value" id="stats-missions-done">--</div>
                    <div class="stat-trend" style="color:rgba(255,255,255,0.8)">✅ Tugas tervalidasi</div>
                </div>
                <div class="stat-card card-gradient-3">
                    <span class="stat-label">Discovery Hub</span>
                    <div class="stat-value" id="stats-active-missions">--</div>
                    <div class="stat-trend" style="color:rgba(255,255,255,0.8); font-weight: 600;">✨ Cari misi baru</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="card fade-in" style="padding: 2.5rem; background: white; border: 1px solid var(--border); border-radius: 24px;">
                    <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                        🚀 Akses Cepat
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div class="quick-action-card" onclick="handleNavigation('missions', 'mahasiswa')" style="background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 20px; cursor: pointer; transition: 0.3s; border: 1px solid rgba(99, 102, 241, 0.1);">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">🎯</div>
                            <h4 style="margin: 0; color: var(--primary);">Jelajahi Misi</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0 0;">Cari tugas baru untuk peroleh poin</p>
                        </div>
                        <div class="quick-action-card" onclick="handleNavigation('shop', 'mahasiswa')" style="background: rgba(16, 185, 129, 0.05); padding: 1.5rem; border-radius: 20px; cursor: pointer; transition: 0.3s; border: 1px solid rgba(16, 185, 129, 0.1);">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">🛍️</div>
                            <h4 style="margin: 0; color: #10b981;">MarketPlace</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0 0;">Tukarkan poin dengan hadiah menarik</p>
                        </div>
                        <div class="quick-action-card" onclick="handleNavigation('transfer', 'mahasiswa')" style="background: rgba(245, 158, 11, 0.05); padding: 1.5rem; border-radius: 20px; cursor: pointer; transition: 0.3s; border: 1px solid rgba(245, 158, 11, 0.1);">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">💸</div>
                            <h4 style="margin: 0; color: #f59e0b;">Transfer Poin</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0 0;">Kirim poin ke rekan atau kelompok</p>
                        </div>
                        <div class="quick-action-card" onclick="handleNavigation('scan', 'mahasiswa')" style="background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 20px; cursor: pointer; transition: 0.3s; border: 1px solid rgba(99, 102, 241, 0.1);">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">📸</div>
                            <h4 style="margin: 0; color: var(--primary);">Pindai QR</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0 0;">Bayar produk atau transfer via scan</p>
                        </div>
                        <div class="quick-action-card" onclick="handleNavigation('history', 'mahasiswa')" style="background: rgba(107, 114, 128, 0.05); padding: 1.5rem; border-radius: 20px; cursor: pointer; transition: 0.3s; border: 1px solid rgba(107, 114, 128, 0.1);">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">📑</div>
                            <h4 style="margin: 0; color: #4b5563;">Buku Kas</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0 0;">Pantau seluruh riwayat transaksi Anda</p>
                        </div>
                    </div>
                </div>

                <div class="card fade-in" style="padding: 2rem; background: #0f172a; color: white; border-radius: 24px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h4 style="opacity: 0.8; margin-bottom: 1rem;">Tips Hari Ini 💡</h4>
                        <p id="dailyTip" style="font-size: 0.95rem; line-height: 1.6;">Lakukan kuis setiap minggu untuk mempertahankan streak perolehan poin Anda!</p>
                    </div>
                    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
                        <button class="btn btn-primary" style="width: 100%; height: 50px; border-radius: 15px; background: linear-gradient(to right, #6366f1, #a855f7); border: none; font-weight: 700;" onclick="handleNavigation('missions', 'mahasiswa')">
                            Mulai Misi Sekarang
                        </button>
                    </div>
                </div>
            </div>
        `;
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
                <h2 style="font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Dashboard Merchant WalletPoint</h2>
                <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto;">Selamat datang! Anda dapat melihat riwayat penjualan dan statistik toko Anda di sini.</p>
            </div>
        `;
        MerchantController.loadMerchantStats();
    }
}

async function loadStudentStats() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const [walletRes, missionsRes, subsRes] = await Promise.all([
            API.getWallet(user.id),
            API.getMissions(),
            API.getSubmissions({ status: 'approved' })
        ]);

        if (document.getElementById('userBalance')) document.getElementById('userBalance').textContent = walletRes.data.balance.toLocaleString();
        if (document.getElementById('stats-missions-done')) document.getElementById('stats-missions-done').textContent = (subsRes.data.submissions || []).filter(s => s.student_id === user.id).length;
        if (document.getElementById('stats-active-missions')) document.getElementById('stats-active-missions').textContent = (missionsRes.data.missions || []).length;

        // Random Tip
        const tips = [
            "Selesaikan misi harian untuk poin bonus rutin!",
            "Cek MarketPlace secara berkala untuk promo terbatas.",
            "Gunakan fitur transfer untuk berbagi poin dengan teman kelompok.",
            "Misi Quiz memiliki tenggat waktu, jangan sampai terlewat!",
            "Pantau Buku Kas untuk memastikan seluruh saldo Anda aman."
        ];
        const tipElem = document.getElementById('dailyTip');
        if (tipElem) tipElem.textContent = tips[Math.floor(Math.random() * tips.length)];

    } catch (e) { console.error(e); }
}

async function loadDosenQuickReview() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await API.getDosenSubmissions({ status: 'pending', limit: 3, creator_id: user.id });
        const submissions = res.data.submissions || [];
        const container = document.getElementById('quickReviewList');
        if (!container) return;

        if (submissions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: #f8fafc; border-radius: 16px;">
                    <div>🎉</div>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;">Semua tugas telah diperiksa!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = submissions.map(s => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem;">
                        ${s.student_name ? s.student_name.charAt(0) : 'S'}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${s.student_name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${s.mission_title}</div>
                    </div>
                </div>
                <button class="btn btn-sm" onclick="handleNavigation('submissions', 'dosen')" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">Cek</button>
            </div>
        `).join('');

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
