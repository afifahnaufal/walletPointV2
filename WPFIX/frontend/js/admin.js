/* Admin Dashboard Features */

class AdminController {
    static init() {
        console.log("Admin module initialized");
    }

    static async loadDashboardStats() {
        try {
            const users = await API.getUsers({ limit: 1 });
            const txns = await API.getAllTransactions({ limit: 1 });

            const uElem = document.getElementById('stats-users');
            const tElem = document.getElementById('stats-txns');

            if (uElem) uElem.textContent = users.data.total || 0;
            if (tElem) tElem.textContent = txns.data.total || 0;
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    }

    // ==========================
    // MODULE: USERS
    // ==========================
    static async renderUsers() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Manajemen Pengguna</h3>
                    <button class="btn btn-primary" onclick="AdminController.showAddUserModal()">+ Tambah Pengguna</button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="premium-table" id="usersTable">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Email</th>
                                <th>NIM/NIP</th>
                                <th>Peran</th>
                                <th>Status</th>
                                <th>Saldo</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="7" class="text-center">Memuat...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const result = await API.getUsers({ limit: 100 });
            const users = result.data.users || [];

            const tbody = document.querySelector('#usersTable tbody');
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada pengguna ditemukan.</td></tr>';
                return;
            }

            tbody.innerHTML = users.map(user => `
                <tr id="user-row-${user.id}">
                    <td><strong>${user.full_name}</strong></td>
                    <td>${user.email}</td>
                    <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${user.nim_nip}</code></td>
                    <td><span class="badge badge-info">${user.role}</span></td>
                    <td><span class="badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}">${user.status}</span></td>
                    <td style="font-weight: 700; color: var(--primary)">${user.balance.toLocaleString()} pts</td>
                    <td>
                        <button class="btn-icon" onclick="AdminController.showEditUserModal(${user.id})" title="Edit Pengguna">✏️</button>
                         <button class="btn-icon" onclick="AdminController.resetPassword(${user.id})" title="Reset Kata Sandi">🔑</button>
                        ${user.status === 'active'
                    ? `<button class="btn-icon" style="color:red" onclick="AdminController.toggleUserStatus(${user.id}, 'inactive')" title="Nonaktifkan">🚫</button>`
                    : `<button class="btn-icon" style="color:green" onclick="AdminController.toggleUserStatus(${user.id}, 'active')" title="Aktifkan">✅</button>`
                }
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error(error);
            document.querySelector('#usersTable tbody').innerHTML = `<tr><td colspan="7" style="color:red">Gagal memuat pengguna.</td></tr>`;
        }
    }

    static async showAddUserModal() {
        AdminController.renderUserModal(null, 'Tambah Pengguna Baru');
    }

    static async showEditUserModal(id) {
        try {
            const response = await API.request(`/admin/users/${id}`, 'GET');
            AdminController.renderUserModal(response.data, 'Edit Pengguna');
        } catch (error) {
            alert("Gagal mengambil data pengguna: " + error.message);
        }
    }

    static renderUserModal(user = null, title) {
        const isEdit = !!user;
        const modalHtml = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-card">
                    <div class="modal-head">
                        <h3>${title}</h3>
                        <button class="btn-icon" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="userForm" onsubmit="AdminController.handleUserSubmit(event, ${isEdit ? user.id : 'null'})">
                            <div class="form-group">
                                <label>Nama Lengkap</label>
                                <input type="text" name="full_name" value="${user?.full_name || ''}" required placeholder="misal: John Doe">
                            </div>
                            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label>Alamat Email</label>
                                    <input type="email" name="email" value="${user?.email || ''}" required placeholder="john@example.com">
                                </div>
                                <div>
                                    <label>NIM/NIP</label>
                                    <input type="text" name="nim_nip" value="${user?.nim_nip || ''}" required placeholder="12345678">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Peran Pengguna</label>
                                <select name="role">
                                    <option value="mahasiswa" ${user?.role === 'mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
                                    <option value="dosen" ${user?.role === 'dosen' ? 'selected' : ''}>Dosen</option>
                                    <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                            ${!isEdit ? `
                            <div class="form-group">
                                <label>Kata Sandi Awal</label>
                                <input type="password" name="password" required minlength="6" placeholder="Min. 6 karakter">
                            </div>` : ''}
                            
                            <div class="form-actions">
                                <button type="button" class="btn" onclick="closeModal()">Batal</button>
                                <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async handleUserSubmit(e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            if (id) {
                await API.updateUser(id, data); // Make sure API.updateUser is implemented
            } else {
                await API.createUser(data);
            }
            closeModal();
            AdminController.renderUsers();
            showToast(`Pengguna berhasil ${id ? 'diperbarui' : 'dibuat'}`);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    static async toggleUserStatus(id, newStatus) {
        if (!confirm(`Apakah Anda yakin ingin mengatur pengguna ini menjadi ${newStatus}?`)) return;
        try {
            // Re-using generic update since backend usually supports status update via same endpoint
            await API.updateUser(id, { status: newStatus });
            AdminController.renderUsers();
        } catch (error) {
            alert(error.message);
        }
    }

    static async resetPassword(id) {
        const newPassword = prompt("Masukkan kata sandi baru untuk pengguna ini:");
        if (newPassword) {
            try {
                await API.resetUserPassword(id, newPassword);
                showToast('Kata sandi berhasil diperbarui');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
    }


    // ==========================
    // MODULE: WALLETS
    // ==========================
    static async renderWallets() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Manajemen Dompet</h3>
                </div>
                <div style="overflow-x: auto;">
                    <table class="premium-table" id="walletsTable">
                        <thead>
                            <tr>
                                <th>Akun</th>
                                <th>Peran</th>
                                <th>Saldo Saat Ini</th>
                                <th>Aksi Cepat</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="4" class="text-center">Memuat...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const result = await API.getWallets({ limit: 100 });
            const wallets = result.data.users || []; // Note: Endpoint returns UserWithWallet wrapper

            const tbody = document.querySelector('#walletsTable tbody');
            tbody.innerHTML = wallets.map(w => `
                <tr>
                    <td>
                        <strong>${w.full_name}</strong><br>
                        <small style="color: var(--text-muted)">${w.email}</small>
                    </td>
                    <td><span class="badge badge-info">${w.role}</span></td>
                    <td style="font-size: 1.1em; font-weight: 800; color: var(--primary)">${w.balance.toLocaleString()} pts</td>
                    <td>
                        <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="AdminController.showAdjustModal(${w.id}, '${w.full_name}')">Sesuaikan</button>
                        <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; background: #fee2e2; color: #991b1b;" onclick="AdminController.showResetModal(${w.id}, '${w.full_name}')">Reset</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
        }
    }

    static showAdjustModal(walletId, userName) {
        const modalHtml = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-card">
                    <div class="modal-head">
                        <h3>Sesuaikan Poin: ${userName}</h3>
                        <button class="btn-icon" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="adjustForm" onsubmit="AdminController.handleAdjust(event)">
                            <input type="hidden" name="wallet_id" value="${walletId}">
                            <div class="form-group">
                                <label>Arah</label>
                                <select name="direction">
                                    <option value="credit">Kredit (Tambah poin)</option>
                                    <option value="debit">Debit (Kurangi poin)</option>
                                </select>
                            </div>
                             <div class="form-group">
                                <label>Jumlah (poin)</label>
                                <input type="number" name="amount" min="1" required placeholder="misal: 100">
                            </div>
                             <div class="form-group">
                                <label>Deskripsi / Alasan</label>
                                <textarea name="description" required placeholder="Alasan penyesuaian..." style="min-height: 80px;"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn" onclick="closeModal()">Batal</button>
                                <button type="submit" class="btn btn-primary">Selesaikan Penyesuaian</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async handleAdjust(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.wallet_id = parseInt(data.wallet_id);
        data.amount = parseInt(data.amount);

        try {
            await API.adjustWalletPoints(data);
            closeModal();
            AdminController.renderWallets();
            showToast('Poin berhasil disesuaikan');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    static showResetModal(walletId, userName) {
        const modalHtml = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-card">
                    <div class="modal-head">
                        <h3>Reset Dompet: ${userName}</h3>
                        <button class="btn-icon" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="background: #fff7ed; padding: 1rem; border-radius: 0.75rem; border: 1px solid #ffedd5; margin-bottom: 2rem;">
                            <p style="color:#9a3412; font-size: 0.875rem;"><strong>Peringatan Kritis:</strong> Ini akan menimpa saldo saat ini. Tindakan ini dicatat dalam log sistem.</p>
                        </div>
                        <form id="resetForm" onsubmit="AdminController.handleReset(event)">
                            <input type="hidden" name="wallet_id" value="${walletId}">
                            <div class="form-group">
                                <label>Saldo Target (poin)</label>
                                <input type="number" name="new_balance" min="0" value="0" required>
                            </div>
                             <div class="form-group">
                                <label>Justifikasi (Diperlukan)</label>
                                <input type="text" name="reason" required placeholder="Mengapa reset ini diperlukan?">
                            </div>
                            <div class="form-actions" style="margin-top: 2rem;">
                                <button type="button" class="btn" onclick="closeModal()">Tutup</button>
                                <button type="submit" class="btn" style="background: var(--error); color: white;">Konfirmasi Reset</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async handleReset(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.wallet_id = parseInt(data.wallet_id);
        data.new_balance = parseInt(data.new_balance);

        if (!confirm("Apakah Anda BENAR-BENAR YAKIN? Ini tidak dapat dibatalkan dengan mudah.")) return;

        try {
            await API.resetWallet(data);
            closeModal();
            AdminController.renderWallets();
            showToast('Saldo dompet berhasil direset');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // ==========================
    // MODULE: TRANSACTIONS
    // ==========================
    static async renderTransactions() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Semua Transaksi</h3>
                </div>
                <div style="overflow-x: auto;">
                    <table class="premium-table" id="txnTable">
                        <thead>
                            <tr>
                                <th>Tanggal & Waktu</th>
                                <th>Pengguna</th>
                                <th>Jenis Aktivitas</th>
                                <th>Jumlah</th>
                                <th>Deskripsi</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="6" class="text-center">Memuat Data...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const result = await API.getAllTransactions({ limit: 50 });
            const txns = result.data.transactions || [];

            const tbody = document.querySelector('#txnTable tbody');
            if (txns.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada transaksi ditemukan.</td></tr>';
                return;
            }

            tbody.innerHTML = txns.map(t => `
                <tr>
                    <td><small>${new Date(t.created_at).toLocaleString()}</small></td>
                    <td>
                        <strong>${t.user_name}</strong><br>
                        <small style="color: var(--text-muted)">${t.nim_nip}</small>
                    </td>
                    <td><span class="badge badge-info">${t.type}</span></td>
                    <td style="font-weight: 800; color: ${t.direction === 'credit' ? 'var(--success)' : 'var(--error)'}">
                        ${t.direction === 'credit' ? '↑' : '↓'} ${t.amount.toLocaleString()}
                    </td>
                    <td><small>${t.description}</small></td>
                    <td><span class="badge badge-success">${t.status}</span></td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
        }
    }
    static async renderTransfers() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Transfer Sesama Pengguna</h3>
                </div>
                <div style="overflow-x: auto;">
                    <table class="premium-table" id="transfersTable">
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Pengirim</th>
                                <th>Penerima</th>
                                <th>Jumlah</th>
                                <th>Catatan</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="6" class="text-center">Memuat Transfer...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const result = await API.getAllTransfers({ limit: 50 });
            const items = result.data.transfers || [];

            const tbody = document.querySelector('#transfersTable tbody');
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada transfer tercatat.</td></tr>';
                return;
            }

            tbody.innerHTML = items.map(t => `
                <tr>
                    <td><small>${new Date(t.created_at).toLocaleString()}</small></td>
                    <td>
                        <strong>${t.sender_name}</strong><br>
                        <small style="color:var(--text-muted)">${t.sender_nim}</small>
                    </td>
                    <td>
                         <strong>${t.receiver_name}</strong><br>
                        <small style="color:var(--text-muted)">${t.receiver_nim}</small>
                    </td>
                    <td style="font-weight: 800; color: var(--primary)">
                         ${t.amount.toLocaleString()} pts
                    </td>
                    <td><small>${t.description || '-'}</small></td>
                    <td><span class="badge ${t.status === 'success' ? 'status-active' : 'status-inactive'}">${t.status}</span></td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
            document.querySelector('#transfersTable tbody').innerHTML = '<tr><td colspan="6" class="text-center" style="color:red">Gagal memuat transfer.</td></tr>';
        }
    }

    static async renderMarketplaceSales() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Riwayat Penjualan Marketplace</h3>
                </div>
                <div style="overflow-x: auto;">
                    <table class="premium-table" id="salesTable">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Pembeli</th>
                                <th>ID Produk</th>
                                <th>Jumlah Dibayar</th>
                                <th>Kuantitas</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="6" class="text-center">Memuat Penjualan...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const result = await API.getMarketplaceTransactions({ limit: 50 });
            const items = result.data.transactions || [];

            const tbody = document.querySelector('#salesTable tbody');
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada penjualan tercatat.</td></tr>';
                return;
            }

            tbody.innerHTML = items.map(t => `
                <tr>
                    <td><small>${new Date(t.created_at).toLocaleString()}</small></td>
                    <td>
                         User #${t.wallet_id} <span style="color:var(--text-muted)">(Dompet)</span>
                    </td>
                    <td>
                         Product #${t.product_id}
                    </td>
                    <td style="font-weight: 800; color: var(--success)">
                         +${t.amount.toLocaleString()} pts
                    </td>
                    <td>${t.quantity}</td>
                    <td><span class="badge ${t.status === 'success' ? 'status-active' : 'status-inactive'}">${t.status}</span></td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
            document.querySelector('#salesTable tbody').innerHTML = '<tr><td colspan="6" class="text-center" style="color:red">Gagal memuat riwayat penjualan.</td></tr>';
        }
    }

    static async renderProducts() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Katalog Marketplace</h3>
                    <button class="btn btn-primary" onclick="AdminController.showProductModal()">+ Buat Produk</button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="premium-table" id="productsTable">
                        <thead>
                            <tr>
                                <th>Detail Produk</th>
                                <th>Harga</th>
                                <th>Stok</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="5" class="text-center">Menyingkronkan Marketplace...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const result = await API.getProducts({ limit: 100 });
            const products = result.data.products || [];

            const tbody = document.querySelector('#productsTable tbody');
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada produk ditemukan.</td></tr>';
                return;
            }

            tbody.innerHTML = products.map(p => `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <div style="width:40px; height:40px; background:#f1f5f9; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">📦</div>
                            <div>
                                <strong>${p.name}</strong><br>
                                <small style="color:var(--text-muted)">${p.description || 'Tidak ada deskripsi'}</small>
                            </div>
                        </div>
                    </td>
                    <td style="font-weight:800; color:var(--primary)">${p.price.toLocaleString()} pts</td>
                    <td>
                        <div style="font-weight:600;">${p.stock} unit</div>
                        <progress value="${p.stock}" max="100" style="width:60px; height:6px;"></progress>
                    </td>
                    <td><span class="badge ${p.status === 'active' ? 'status-active' : 'status-inactive'}">${p.status}</span></td>
                    <td>
                        <button class="btn-icon" onclick="AdminController.showProductModal(${p.id})" title="Edit Barang">✏️</button>
                        <button class="btn-icon" style="color:var(--error)" onclick="AdminController.deleteProduct(${p.id})" title="Hapus Barang">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
        }
    }

    static async showProductModal(id = null) {
        let product = null;
        if (id) {
            try {
                const res = await API.request(`/admin/products/${id}`, 'GET');
                product = res.data;
            } catch (e) { console.error(e); }
        }

        const modalHtml = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-card">
                    <div class="modal-head">
                        <h3>${id ? 'Ubah Produk' : 'Katalog Barang Baru'}</h3>
                        <button class="btn-icon" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="productForm" onsubmit="AdminController.handleProductSubmit(event, ${id})">
                            <div class="form-group">
                                <label>Nama Produk</label>
                                <input type="text" name="name" value="${product?.name || ''}" required placeholder="misal: Hoodie Kampus">
                            </div>
                            <div class="form-group">
                                <label>Deskripsi Detail</label>
                                <textarea name="description" placeholder="Deskripsikan barang..." style="min-height: 80px;">${product?.description || ''}</textarea>
                            </div>
                            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label>Harga (Poin)</label>
                                    <input type="number" name="price" value="${product?.price || ''}" required min="1">
                                </div>
                                <div>
                                    <label>Kuantitas Stok</label>
                                    <input type="number" name="stock" value="${product?.stock || 0}" required min="0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>URL Gambar Tampilan (Opsional)</label>
                                <input type="text" name="image_url" value="${product?.image_url || ''}" placeholder="https://unsplash.com/...">
                            </div>
                            <div class="form-group">
                                <label>Status Visibilitas</label>
                                <select name="status">
                                    <option value="active" ${product?.status === 'active' ? 'selected' : ''}>Aktif / Terdaftar</option>
                                    <option value="inactive" ${product?.status === 'inactive' ? 'selected' : ''}>Tersembunyi</option>
                                </select>
                            </div>
                            <div class="form-actions" style="margin-top: 2rem;">
                                <button type="button" class="btn" onclick="closeModal()">Buang</button>
                                <button type="submit" class="btn btn-primary">${id ? 'Simpan Perubahan' : 'Konfirmasi & Daftar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async handleProductSubmit(e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.price = parseInt(data.price);
        data.stock = parseInt(data.stock);

        try {
            if (id) {
                await API.updateProduct(id, data);
            } else {
                await API.createProduct(data);
            }
            closeModal();
            AdminController.renderProducts();
            showToast(`Produk berhasil ${id ? 'diperbarui' : 'dibuat'}`);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    static async deleteProduct(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

        try {
            await API.deleteProduct(id);
            AdminController.renderProducts();
        } catch (error) {
            alert(error.message);
        }
    }

    // ==========================
    // MODULE: SYSTEM AUDIT
    // ==========================
    static async renderAuditLogs() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="table-wrapper">
                <div class="table-header">
                    <h3>Riwayat Audit Sistem</h3>
                </div>
                <div style="overflow-x: auto;">
                    <table class="premium-table" id="auditTable">
                        <thead>
                            <tr>
                                <th>Terjadi Pada</th>
                                <th>Dilakukan Oleh</th>
                                <th>Jenis Aksi</th>
                                <th>Entitas Target</th>
                                <th>Detail Aktivitas</th>
                                <th>Info Asal</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="6" class="text-center">Mengambil log...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const result = await API.getAuditLogs({ limit: 50 });
            const logs = result.data.logs || [];

            const tbody = document.querySelector('#auditTable tbody');
            if (logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada log audit ditemukan.</td></tr>';
                return;
            }

            tbody.innerHTML = logs.map(log => `
                <tr>
                    <td><small style="font-weight:500;">${new Date(log.created_at).toLocaleString()}</small></td>
                    <td>
                        <strong>${log.user_name || 'System'}</strong><br>
                        <span class="badge badge-info" style="font-size: 0.65rem;">${log.user_role || 'SYSTEM'}</span>
                    </td>
                    <td><span class="badge" style="background:#f1f5f9; color:var(--text-main);">${log.action}</span></td>
                    <td><code style="font-size: 0.75rem;">${log.entity} #${log.entity_id}</code></td>
                    <td style="font-size: 0.875rem;">${log.details}</td>
                    <td>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">
                            <strong>${log.ip_address}</strong><br>
                            ${log.user_agent ? log.user_agent.substring(0, 30) + '...' : '-'}
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
            document.querySelector('#auditTable tbody').innerHTML = '<tr><td colspan="6" class="text-center" style="color:red">Gagal memuat log.</td></tr>';
        }
    }
}


