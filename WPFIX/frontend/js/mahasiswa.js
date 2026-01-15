/* Mahasiswa Dashboard Features */

class MahasiswaController {
    static init() {
        console.log("Mahasiswa module initialized");
    }

    // ==========================
    // MODULE: DISCOVERY HUB (Missions & Quizzes)
    // ==========================
    static async renderMissions() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="page-header" style="margin-bottom: 2rem;">
                    <h2 style="font-weight: 700; color: var(--text-main);">Pusat Misi</h2>
                    <p style="color: var(--text-muted);">Jelajahi misi dan kuis untuk mendapatkan Poin Berlian</p>
                </div>

                <div class="filter-tabs" style="display: flex; gap: 1rem; margin-bottom: 2rem; background: rgba(255,255,255,0.5); padding: 0.5rem; border-radius: 12px; width: fit-content; border: 1px solid var(--border);">
                    <button class="tab-btn active" onclick="MahasiswaController.filterMissions('all', this)" style="padding: 0.5rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: white; box-shadow: var(--shadow-sm);">Semua Item</button>
                    <button class="tab-btn" onclick="MahasiswaController.filterMissions('quiz', this)" style="padding: 0.5rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: transparent;">Kuis</button>
                    <button class="tab-btn" onclick="MahasiswaController.filterMissions('task', this)" style="padding: 0.5rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background: transparent;">Tugas</button>
                </div>

                <div id="missionsGrid" class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
                    <div class="text-center" style="grid-column: 1/-1; padding: 4rem;">Memuat peluang menarik...</div>
                </div>
            </div>
        `;

        await this.loadMissions();
    }

    static async loadMissions(filterType = 'all') {
        const grid = document.getElementById('missionsGrid');
        try {
            const res = await API.getMissions();
            let missions = res.data.missions || [];

            // Get user submissions to filter out completed ones
            try {
                const subRes = await API.getSubmissions();
                const mySubmissions = subRes.data.submissions || [];
                const submittedMissionIds = new Set(mySubmissions.map(s => s.mission_id));

                missions = missions.filter(m => !submittedMissionIds.has(m.id));
            } catch (err) {
                console.warn("Could not fetch submissions for filtering", err);
            }

            grid.innerHTML = '';

            const filtered = missions.filter(m => {
                // Filter out if user already submitted (assuming 'completed' or 'submitted' flag exists or check submissions)
                // Since API.getMissions doesn't strictly return user status, we might need to rely on a property like `is_completed` if backend provides it, 
                // OR fetch submissions separately.
                // Assuming the backend has been updated to include `is_completed` or similar in the mission object for the current user, or we filter by checking submissions.

                // Let's first fetch submissions to filter client-side if needed, but best if mission object has it.
                // Looking at typical implementations, let's assume `m.is_completed` or `m.user_submission_status`.
                // If not available, we need to fetch submissions.

                // Let's try to assume we can check `m.is_completed` (common pattern). If not, we will modify to fetch submissions.
                // Wait, the user request corresponds to "mission/quiz done -> hide it".

                if (m.is_completed) return false; // Hide if completed

                if (filterType === 'all') return true;
                if (filterType === 'quiz') return m.type === 'quiz';
                return m.type !== 'quiz';
            });

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                        <div style="font-size: 4rem; opacity: 0.2; margin-bottom: 1rem;">🌪️</div>
                        <h3 style="color: var(--text-muted);">Belum ada apa-apa di sini</h3>
                        <p style="opacity: 0.6;">Cek lagi nanti untuk misi baru!</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(m => `
                <div class="card fade-in-item" style="display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border: 1px solid var(--border); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; position: relative;">
                    ${m.type === 'quiz' ? '<div style="position: absolute; top: 12px; right: 12px; background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(99, 102, 241, 0.2);">KUIS CEPAT</div>' : ''}
                    
                    <div style="padding: 1.5rem;">
                        <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem;">
                            <div style="width: 50px; height: 50px; border-radius: 12px; background: ${m.type === 'quiz' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                ${m.type === 'quiz' ? '💡' : (m.type === 'assignment' ? '📄' : '✅')}
                            </div>
                            <div style="flex:1">
                                <h4 style="margin: 0; font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${m.title}</h4>
                                <small style="color: var(--text-muted);">${m.creator_name || 'Academic Lab'}</small>
                            </div>
                        </div>

                        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${m.description || 'Selesaikan misi ini untuk mendapatkan pengakuan dan poin.'}
                        </p>

                        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.1rem;">💎</span>
                                <span style="font-weight: 800; color: var(--text-main); font-size: 1.1rem;">${m.points}</span>
                                <span style="color: var(--text-muted); font-size: 0.8rem;">pts</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">TENGGAT WAKTU</div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: ${m.deadline ? 'var(--text-main)' : 'var(--success)'};">
                                    ${m.deadline ? new Date(m.deadline).toLocaleDateString() : 'BUKA'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary" style="border-radius: 0; width: 100%; padding: 1rem; background: ${m.type === 'quiz' ? 'linear-gradient(to right, #6366f1, #a855f7)' : 'var(--primary)'}; border: none;" 
                            onclick="${m.type === 'quiz' ? `MahasiswaController.takeQuiz(${m.id})` : `MahasiswaController.showSubmitModal(${m.id})`}">
                        ${m.type === 'quiz' ? 'Ikuti Kuis Sekarang 🚀' : 'Mulai Misi ✨'}
                    </button>
                </div>
            `).join('');

        } catch (e) {
            console.error(e);
            showToast("Gagal memuat Pusat Misi", "error");
        }
    }

    static filterMissions(type, btn) {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.boxShadow = 'none';
        });
        btn.classList.add('active');
        btn.style.background = 'white';
        btn.style.boxShadow = 'var(--shadow-sm)';
        this.loadMissions(type);
    }

    // ==========================
    // MODULE: QUIZ ENGINE
    // ==========================
    static async takeQuiz(id) {
        try {
            const res = await API.getMissionByID(id);
            const mission = res.data; // Fixed structure

            if (!mission.questions || mission.questions.length === 0) {
                showToast("Kuis ini belum memiliki pertanyaan", "warning");
                return;
            }

            let currentQuestion = 0;
            const answers = [];

            const renderQuestion = () => {
                const q = mission.questions[currentQuestion];
                const modalBody = document.querySelector('#quizModalBody');

                modalBody.innerHTML = `
                    <div class="fade-in">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <span style="font-weight: 700; color: var(--primary); font-size: 0.9rem;">PERTANYAAN ${currentQuestion + 1} DARI ${mission.questions.length}</span>
                            <div style="height: 6px; width: 150px; background: #f1f5f9; border-radius: 3px; position: relative;">
                                <div style="position: absolute; left: 0; top: 0; height: 100%; background: var(--primary); border-radius: 3px; width: ${((currentQuestion + 1) / mission.questions.length) * 100}%; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        
                        <h3 style="font-weight: 700; color: var(--text-main); margin-bottom: 2rem; line-height: 1.4;">${q.question}</h3>
                        
                        <div style="display: grid; gap: 1rem;">
                            ${(q.options || []).map((opt, i) => `
                                <div class="quiz-option" onclick="this.parentElement.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected')); this.classList.add('selected')" 
                                     data-val="${opt}"
                                     style="padding: 1.25rem; background: white; border: 2px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.2s; font-weight: 600; display: flex; align-items: center; gap: 1rem;">
                                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--text-muted);">
                                        ${String.fromCharCode(65 + i)}
                                    </div>
                                    ${opt}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            };

            const modalHtml = `
                <div class="modal-overlay" id="quizModal">
                    <div class="modal-card" style="max-width: 650px; min-height: 500px; display: flex; flex-direction: column;">
                        <div class="modal-head" style="background: #fdfcfd; border-bottom: 1px solid var(--border); padding: 1rem 2rem;">
                            <h3 style="margin:0; font-size: 1.1rem; color: var(--text-main);">${mission.title}</h3>
                            <button class="btn-icon" onclick="MahasiswaController.confirmCloseQuiz()">×</button>
                        </div>
                        <div class="modal-body" id="quizModalBody" style="flex: 1; padding: 3rem 2rem;">
                            <!-- Dynamic Content -->
                        </div>
                        <div class="modal-foot" style="padding: 1.5rem 2rem; background: white;">
                            <button class="btn btn-primary" id="nextBtn" style="width: 100%; border-radius: 12px; padding: 1rem;">Pertanyaan Berikutnya</button>
                        </div>
                    </div>
                </div>
                <style>
                    .quiz-option:hover { border-color: var(--primary-light); background: rgba(99, 102, 241, 0.02); }
                    .quiz-option.selected { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); color: var(--primary); }
                    .quiz-option.selected div { border-color: var(--primary); background: var(--primary); color: white; }
                </style>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            renderQuestion();

            document.getElementById('nextBtn').addEventListener('click', async () => {
                const selected = document.querySelector('.quiz-option.selected');
                if (!selected) {
                    showToast("Silakan pilih jawaban", "warning");
                    return;
                }

                answers.push({
                    question_id: mission.questions[currentQuestion].id,
                    answer: selected.dataset.val
                });

                if (currentQuestion < mission.questions.length - 1) {
                    currentQuestion++;
                    renderQuestion();
                    if (currentQuestion === mission.questions.length - 1) {
                        document.getElementById('nextBtn').textContent = 'Selesaikan Penilaian';
                    }
                } else {
                    // Submit Quiz
                    try {
                        document.getElementById('nextBtn').disabled = true;
                        document.getElementById('nextBtn').textContent = 'Menghitung Skor...';

                        const submitData = {
                            mission_id: id,
                            answers: answers
                        };

                        await API.submitMissionSubmission(submitData);
                        showToast("Kuis berhasil dikirim! Mengalihkan ke misi...");
                        document.getElementById('quizModal').remove();
                        MahasiswaController.renderMissions();
                    } catch (e) {
                        showToast(e.message, "error");
                        document.getElementById('nextBtn').disabled = false;
                        document.getElementById('nextBtn').textContent = 'Selesaikan Penilaian';
                    }
                }
            });

        } catch (e) {
            console.error(e);
            showToast("Gagal memulai kuis", "error");
        }
    }

    static confirmCloseQuiz() {
        if (confirm("Apakah Anda yakin ingin keluar? Kemajuan Anda tidak akan disimpan.")) {
            const m = document.getElementById('quizModal');
            if (m) m.remove();
        }
    }

    // ==========================
    // MODULE: MISSION SUBMISSION
    // ==========================
    static async showSubmitModal(id) {
        try {
            const res = await API.getMissionByID(id);
            const mission = res.data;

            const modalHtml = `
                <div class="modal-overlay" onclick="closeModal(event)">
                    <div class="modal-card" style="max-width: 600px; border-radius: var(--radius-xl); overflow: hidden;">
                        <div class="modal-head" style="background: var(--primary); color: white;">
                            <h3>🚀 Mulai Pengiriman</h3>
                            <button class="btn-icon" onclick="closeModal()" style="color:white;">×</button>
                        </div>
                        <div class="modal-body" style="padding: 2rem;">
                            <div style="margin-bottom: 2rem; border-left: 3px solid var(--primary); padding-left: 1rem;">
                                <h4 style="margin:0;">${mission.title}</h4>
                                <p style="margin: 0.5rem 0 0 0; color: var(--text-muted); font-size: 0.9rem;">${mission.description || 'Tidak ada instruksi khusus yang diberikan.'}</p>
                            </div>

                            <form id="missionSubmitForm" onsubmit="MahasiswaController.handleMissionSubmission(event, ${id})">
                                <div class="form-group">
                                    <label style="font-weight: 600;">Pengiriman Teks / Tautan</label>
                                    <textarea name="submission_content" required placeholder="Ketik jawaban Anda, atau tempel tautan ke pekerjaan Anda (misalnya, GitHub, Cloud Drive)..." style="min-height: 150px; border-radius: 12px;"></textarea>
                                </div>
                                <div class="form-group">
                                    <label style="font-weight: 600;">Unggah Tangkapan Layar / File</label>
                                    <input type="file" name="file" accept="image/*,.pdf" style="border-radius: 12px; padding: 0.5rem; border: 1px solid var(--border); width: 100%;">
                                    <small style="color: var(--text-muted);">Format: JPG, PNG, PDF</small>
                                </div>
                                <div class="form-group">
                                    <label style="font-weight: 600;">Atau Tautan Eksternal (Opsional)</label>
                                    <input type="text" name="file_url" placeholder="https://drive.google.com/..." style="border-radius: 12px;">
                                </div>
                                <div class="form-actions" style="margin-top: 2rem; display: flex; gap: 1rem;">
                                    <button type="button" class="btn btn-secondary" onclick="closeModal()" style="flex:1">Batal</button>
                                    <button type="submit" class="btn btn-primary" style="flex:2; border-radius: 12px;">Kirim Solusi 🛰️</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (e) {
            showToast("Failed to load mission details", "error");
        }
    }

    static async handleMissionSubmission(e, missionId) {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('mission_id', missionId);

        // No need to convert to Object.fromEntries logic anymore as API handles FormData now
        // const data = Object.fromEntries(formData.entries());
        // data.mission_id = missionId;

        try {
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Mengirim...';

            await API.submitMissionSubmission(formData);
            showToast("Misi berhasil dikirim! Hadiah menunggu peninjauan.");
            closeModal();
            this.renderMissions();
        } catch (error) {
            showToast(error.message, "error");
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.textContent = 'Kirim Solusi 🛰️';
        }
    }

    // ==========================
    // MODULE: REWARDS STORE (Marketplace)
    // ==========================
    static async renderShop(view = 'catalog') {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="table-header" style="margin-bottom: 2rem;">
                    <div>
                        <h2 style="font-weight: 700; color: var(--text-main);">Toko Hadiah</h2>
                        <p style="color: var(--text-muted);">Tukarkan poin Anda untuk item eksklusif dan voucher</p>
                    </div>
                    <div style="background: white; padding: 0.75rem 1.5rem; border-radius: 20px; box-shadow: var(--shadow-sm); display:flex; align-items:center; gap:0.75rem;">
                         <span style="font-size: 1.2rem;">🛡️</span>
                         <span style="font-weight: 700; color: var(--primary);" id="shopBalance">Loading...</span>
                    </div>
                </div>

                <div class="tabs" style="margin-bottom: 2rem; display:flex; gap: 1rem; border-bottom: 2px solid var(--border);">
                    <button class="tab-btn ${view === 'catalog' ? 'active' : ''}" 
                            onclick="MahasiswaController.renderShop('catalog')"
                            style="padding: 0.8rem 1.5rem; background:none; border:none; border-bottom: 3px solid ${view === 'catalog' ? 'var(--primary)' : 'transparent'}; font-weight: 600; color: ${view === 'catalog' ? 'var(--primary)' : 'var(--text-muted)'}; cursor: pointer; display:flex; gap:0.5rem; align-items:center;">
                        🛍️ Katalog
                    </button>
                    <button class="tab-btn ${view === 'my_items' ? 'active' : ''}" 
                            onclick="MahasiswaController.renderShop('my_items')"
                            style="padding: 0.8rem 1.5rem; background:none; border:none; border-bottom: 3px solid ${view === 'my_items' ? 'var(--primary)' : 'transparent'}; font-weight: 600; color: ${view === 'my_items' ? 'var(--primary)' : 'var(--text-muted)'}; cursor: pointer; display:flex; gap:0.5rem; align-items:center;">
                        🎒 Inventaris Saya
                    </button>
                </div>

                <div id="shopContent">
                    <div id="shopGrid" class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                        <div class="text-center" style="grid-column: 1/-1; padding: 4rem;">Memuat Data Toko...</div>
                    </div>
                </div>
            </div>
        `;

        try {
            // Load balance
            const user = JSON.parse(localStorage.getItem('user'));
            const walletRes = await API.getWallet(user.id);
            const balanceElem = document.getElementById('shopBalance');
            if (balanceElem) balanceElem.textContent = `${walletRes.data.balance.toLocaleString()} Pts`;

            if (view === 'catalog') {
                this.loadCatalog();
            } else {
                this.loadMyPurchases(user.id);
            }

        } catch (e) {
            console.error(e);
            showToast("Failed to initiate store", "error");
        }
    }

    static async loadCatalog() {
        const grid = document.getElementById('shopGrid');
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const [productsRes, txRes] = await Promise.all([
                API.getProducts({ limit: 100 }),
                API.getTransactions(user.id)
            ]);

            let products = productsRes.data.products || [];
            const txns = txRes.data.transactions || [];

            // Filter out purchased items by matching name in transaction description
            // Backend format: "Purchase: [Product Name]"
            const boughtItems = new Set(
                txns.filter(t => t.type === 'marketplace')
                    .map(t => t.description.replace('Purchase: ', '').trim())
            );

            // Exclude bought items
            products = products.filter(p => !boughtItems.has(p.name));

            if (products.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:4rem; color:var(--text-muted);">Toko saat ini kehabisan stok atau Anda telah memborong semuanya! 🎉</div>';
                return;
            }

            grid.innerHTML = products.map(p => `
                <div class="card product-card fade-in-item" style="padding: 0; overflow: hidden; border: 1px solid var(--border); transition: transform 0.3s;">
                    <div style="height: 180px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 4rem; position: relative;">
                        ${p.category === 'vouchers' ? '🎟️' : (p.category === 'merchandise' ? '👕' : '🎁')}
                        <div style="position: absolute; bottom: 10px; right: 10px; background: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; box-shadow: var(--shadow-sm); color: ${p.stock > 0 ? 'var(--success)' : 'var(--error)'};">
                            STOCK: ${p.stock}
                        </div>
                    </div>
                    <div style="padding: 1.5rem;">
                        <h4 style="margin:0; color: var(--text-main); font-weight: 700;">${p.name}</h4>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.5rem 0 1.2rem; line-height: 1.4; min-height: 2.4em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.description}</p>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 0.3rem;">
                                <span style="font-size: 1.1rem;">💎</span>
                                <span style="font-weight: 800; color: var(--primary); font-size: 1.2rem;">${p.price.toLocaleString()}</span>
                            </div>
                            <button class="btn btn-primary" style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;" 
                                    onclick="MahasiswaController.purchaseProduct(${p.id}, '${p.name}', ${p.price})" ${p.stock <= 0 ? 'disabled' : ''}>
                                ${p.stock <= 0 ? 'Habis Terjual' : 'Tukarkan Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            grid.innerHTML = '<div style="grid-column:1/-1;">Gagal memuat produk</div>';
        }
    }

    static async loadMyPurchases(userId) {
        const grid = document.getElementById('shopGrid');
        try {
            // We use transaction history filtering for now as we don't have a dedicated 'my-items' endpoint
            const res = await API.getTransactions(userId);
            const txns = res.data.transactions || [];

            // Filter only marketplace purchases (Backend saves type as 'marketplace' not 'marketplace_purchase')
            const purchases = txns.filter(t => t.type === 'marketplace');

            if (purchases.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:4rem;">
                        <div style="font-size:3rem; margin-bottom:1rem; opacity:0.3;">🎒</div>
                        <h3 style="color:var(--text-muted);">Inventaris Kosong</h3>
                        <p style="opacity:0.6;">Anda belum menukarkan item apa pun.</p>
                        <button class="btn btn-primary" style="margin-top:1rem; border-radius:20px;" onclick="MahasiswaController.renderShop('catalog')">Jelajahi Katalog</button>
                    </div>`;
                return;
            }

            grid.innerHTML = purchases.map(t => `
                <div class="card fade-in-item" style="padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; border: 1px solid var(--border);">
                    <div style="width: 60px; height: 60px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">
                        📦
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: var(--text-main); font-weight: 700;">${t.description.replace('Purchase: ', '')}</h4>
                        <small style="color: var(--text-muted);">Ref: #PUR-${t.id} • ${new Date(t.created_at).toLocaleDateString()}</small>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: var(--primary); font-weight: 700;">-${t.amount.toLocaleString()} Pts</div>
                        <span class="badge badge-success" style="font-size: 0.7rem;">Dibeli</span>
                    </div>
                </div>
            `).join('');

            // Change grid layout for list view
            grid.style.display = 'flex';
            grid.style.flexDirection = 'column';
            grid.style.gap = '1rem';

        } catch (e) {
            grid.innerHTML = '<div style="grid-column:1/-1;">Gagal memuat inventaris</div>';
        }
    }

    static async purchaseProduct(id, name, price) {
        // 1. Initial Check
        const modalHtml = `
            <div class="modal-overlay" id="purchaseModal">
                <div class="modal-card" style="max-width: 450px; text-align: center; padding: 2rem;">
                    <div id="purchaseStep1">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🛍️</div>
                        <h3 style="margin-bottom: 0.5rem;">Pilih Metode Pembayaran</h3>
                        <p style="color: var(--text-muted); margin-bottom: 2rem;">Tukarkan <b>${name}</b> seharga <b>${price.toLocaleString()} Poin</b>.</p>
                        
                        <div style="display: grid; gap: 1rem;">
                            <button class="btn btn-primary" onclick="MahasiswaController.payWithWalletDirect(${id}, '${name}', ${price})" style="padding: 1rem; border-radius: 12px; font-weight: 700; background: #10b981; border: none;">
                                Direct Wallet Pay 🪙
                            </button>
                            <button class="btn btn-primary" onclick="MahasiswaController.proceedToQRPayment(${id}, '${name}', ${price})" style="padding: 1rem; border-radius: 12px; font-weight: 700; background: var(--primary); border: none;">
                                Pindai Pembayaran QR 📷
                            </button>
                            <button class="btn btn-secondary" onclick="document.getElementById('purchaseModal').remove()" style="padding: 1rem; border-radius: 12px;">
                                Batal
                            </button>
                        </div>
                    </div>
                    <div id="purchaseStep2" style="display: none;">
                        <h3 style="margin-bottom: 1rem;">Pindai QR untuk Membayar</h3>
                        <div style="background: white; padding: 1.5rem; border: 2px solid var(--primary); border-radius: 20px; margin-bottom: 1.5rem; display: inline-block;">
                            <!-- Simulated QR Code -->
                            <div style="width: 200px; height: 200px; background: repeating-conic-gradient(#334155 0% 25%, #fff 0% 50%) 50% / 20px 20px; border: 8px solid white;"></div>
                        </div>
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2rem;">Point Merchant: <b>University Marketplace</b><br>Ref: #PAY-${Math.floor(Math.random() * 900000 + 100000)}</p>
                        <button class="btn btn-primary" id="confirmPayBtn" style="width: 100%; padding: 1rem; border-radius: 12px; font-weight: 700;">
                            Konfirmasi Pembayaran Poin
                        </button>
                    </div>
                    <div id="purchaseStep3" style="display: none;">
                        <div style="font-size: 4rem; margin-bottom: 1rem; animation: bounce 1s infinite;">✅</div>
                        <h3 style="color: var(--success);">Pembayaran Berhasil!</h3>
                        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; text-align: left; font-family: monospace; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>BARANG:</span>
                                <span style="font-weight: 700;">${name}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>JUMLAH:</span>
                                <span style="font-weight: 700;">-${price.toLocaleString()} PTS</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>STATUS:</span>
                                <span style="color: var(--success); font-weight: 700;">SELESAI</span>
                            </div>
                            <div style="border-top: 1px dashed #cbd5e1; margin: 0.5rem 0; padding-top: 0.5rem; font-size: 0.75rem; text-align: center;">
                                Terima kasih telah menggunakan WalletPoint!
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="MahasiswaController.closePurchaseAndReload()" style="width: 100%; padding: 1rem; border-radius: 12px;">
                            Lihat Inventaris
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async payWithWalletDirect(id, name, price) {
        try {
            const btn = event.target;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Memproses...';

            await API.purchaseProduct({
                product_id: id,
                payment_method: 'wallet'
            });

            document.getElementById('purchaseStep1').style.display = 'none';
            document.getElementById('purchaseStep3').style.display = 'block';
            showToast(`Pembelian berhasil melalui dompet langsung!`, "success");
        } catch (e) {
            showToast(e.message, "error");
            const btn = document.querySelector('[onclick*="payWithWalletDirect"]');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Bayar Langsung Dompet 🪙';
            }
        }
    }

    static async proceedToQRPayment(id, name, price) {
        const step1 = document.getElementById('purchaseStep1');
        const step2 = document.getElementById('purchaseStep2');

        try {
            // Call System: Generate QR Payment Token
            const tokenRes = await API.request('/mahasiswa/payment/token', 'POST', {
                amount: price,
                merchant: "University Marketplace",
                type: "purchase"
            });

            const paymentToken = tokenRes.data.token;

            step1.style.display = 'none';
            step2.style.display = 'block';

            const btn = document.getElementById('confirmPayBtn');
            btn.onclick = async () => {
                try {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner"></span> Memvalidasi QR & Membayar...';

                    // Simulate the "Scan" part by sending the token to the purchase endpoint
                    await API.purchaseProduct({
                        product_id: id,
                        payment_method: 'qr',
                        payment_token: paymentToken
                    });

                    document.getElementById('purchaseStep2').style.display = 'none';
                    document.getElementById('purchaseStep3').style.display = 'block';
                    showToast(`Penukaran QR berhasil!`, "success");
                } catch (e) {
                    showToast(e.message, "error");
                    btn.disabled = false;
                    btn.innerHTML = 'Konfirmasi Pembayaran Poin';
                }
            };
        } catch (e) {
            showToast("Gagal membuat token pembayaran: " + e.message, "error");
        }
    }

    static closePurchaseAndReload() {
        document.getElementById('purchaseModal').remove();
        this.renderShop('catalog');
    }

    // ==========================
    // MODULE: MY LEDGER (History)
    // ==========================
    static async renderLedger() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="table-header" style="margin-bottom: 2rem;">
                    <h2 style="font-weight: 700; color: var(--text-main);">Dompet Saya</h2>
                    <p style="color: var(--text-muted);">Catatan kriptografi dari semua perolehan dan penukaran poin Anda</p>
                </div>

                <div class="table-wrapper">
                    <table class="premium-table" id="ledgerTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Detail Transaksi</th>
                                <th>Jumlah</th>
                                <th>Saldo Setelah</th>
                                <th>Waktu</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="5" class="text-center">Mendekripsi buku besar...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await API.getTransactions(user.id);
            const txns = res.data.transactions || [];
            const tbody = document.querySelector('#ledgerTable tbody');

            if (txns.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada transaksi tercatat.</td></tr>';
                return;
            }

            tbody.innerHTML = txns.map(t => `
                <tr>
                    <td><code style="font-size: 0.75rem; color: var(--text-muted);">#TX-${t.id}</code></td>
                    <td>
                        <div style="font-weight: 600; color: var(--text-main);">${t.description}</div>
                        <small style="color: var(--text-muted); text-transform: capitalize;">TYPE: ${t.type.replace('_', ' ')}</small>
                    </td>
                    <td>
                        <span style="font-weight: 700; color: ${t.type.includes('reward') || t.type.includes('topup') || t.type.includes('receive') ? 'var(--success)' : 'var(--error)'};">
                            ${t.type.includes('reward') || t.type.includes('topup') || t.type.includes('receive') ? '+' : '-'}${t.amount.toLocaleString()} Pts
                        </span>
                    </td>
                    <td style="font-weight: 600; color: var(--text-main);">${t.balance_after?.toLocaleString() || '-'}</td>
                    <td><small>${new Date(t.created_at).toLocaleString()}</small></td>
                </tr>
            `).join('');
        } catch (e) {
            console.error(e);
            showToast("Gagal memuat riwayat", "error");
        }
    }



    // ==========================
    // MODULE: TRANSFER POINTS
    // ==========================
    static async renderTransfer() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="page-header" style="margin-bottom: 2rem;">
                    <h2 style="font-weight: 700; color: var(--text-main);">Transfer Rekan</h2>
                    <p style="color: var(--text-muted);">Kirim poin ke teman atau kelompok belajar Anda</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: start;">
                    
                    <!-- Form Section -->
                    <div class="card" style="padding: 2rem; border: 1px solid var(--border);">
                        <div style="margin-bottom: 2rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1)); padding: 1.5rem; border-radius: 12px; border: 1px dashed var(--primary);">
                             <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700;">Saldo Tersedia</div>
                             <div style="font-size: 2rem; font-weight: 800; color: var(--primary);" id="transferBalance">Loading...</div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                            <button class="btn" style="background: white; border: 2px solid var(--primary); color: var(--primary); padding: 1rem; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;" onclick="MahasiswaController.openScanQR()">
                                <span style="font-size: 1.5rem;">📷</span>
                                <span style="font-size: 0.8rem; font-weight: 700;">Pindai Kode QR</span>
                            </button>
                            <button class="btn btn-primary" style="padding: 1rem; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;" onclick="MahasiswaController.showMyQR()">
                                <span style="font-size: 1.5rem;">📱</span>
                                <span style="font-size: 0.8rem; font-weight: 700;">Kode QR Saya</span>
                            </button>
                        </div>

                        <form id="transferForm" onsubmit="MahasiswaController.handleTransferSubmit(event)">
                            <div class="form-group">
                                <label style="font-weight: 600;">Penerima</label>
                                <div style="position:relative;">
                                    <input type="number" name="receiver_id" id="receiverIdInput" placeholder="Masukkan ID Siswa / NIM" required style="border-radius: 12px;" oninput="MahasiswaController.checkReceiver(this.value)">
                                    <div id="receiverFeedback" style="margin-top: 0.5rem; font-size: 0.9rem; min-height: 1.2em; font-weight: 600;"></div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label style="font-weight: 600;">Jumlah (Poin)</label>
                                <input type="number" name="amount" min="1" placeholder="e.g. 50" required style="border-radius: 12px; font-weight: 700; color: var(--text-main);">
                            </div>

                            <div class="form-group">
                                <label style="font-weight: 600;">Pesan (Opsional)</label>
                                <textarea name="description" placeholder="Untuk proyek kelompok..." style="min-height: 80px; border-radius: 12px;"></textarea>
                            </div>

                            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 1rem; border-radius: 12px; margin-top: 1rem;">
                                Konfirmasi Transfer 💸
                            </button>
                        </form>
                    </div>

                    <!-- History Section -->
                    <div class="card" style="padding: 0; border: 1px solid var(--border); overflow: hidden; min-height: 500px; display: flex; flex-direction: column;">
                        <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
                            <h4 style="margin:0;">Transfer Terbaru</h4>
                            <button class="btn btn-sm" onclick="MahasiswaController.loadTransferHistory()" style="background: white; border: 1px solid var(--border);">Segarkan 🔄</button>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="premium-table" id="transferHistoryTable" style="background: white;">
                                <thead>
                                    <tr>
                                        <th>Tipe</th>
                                        <th>Lawan Transaksi</th>
                                        <th>Jumlah</th>
                                        <th>Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td colspan="4" class="text-center" style="padding: 3rem;">Memuat riwayat...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initial Load
        this.loadTransferHistory();

        // Get Balance
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const wallet = await API.getWallet(user.id);
            document.getElementById('transferBalance').textContent = `${wallet.data.balance.toLocaleString()}`;
        } catch (e) { console.error(e); }
    }

    static checkReceiver(id) {
        const feedback = document.getElementById('receiverFeedback');
        const btn = document.querySelector('#transferForm button[type="submit"]');

        // Reset stored data
        this.currentRecipient = null;

        if (this.checkTimeout) clearTimeout(this.checkTimeout);

        if (!id) {
            feedback.innerHTML = '';
            if (btn) btn.disabled = false;
            return;
        }

        // Show searching state
        feedback.innerHTML = '<span style="color:var(--text-muted); display:flex; align-items:center; gap:0.5rem;"><span class="spinner" style="width:12px; height:12px; border-width:2px;"></span> Mencari pengguna...</span>';
        if (btn) btn.disabled = true;

        this.checkTimeout = setTimeout(async () => {
            try {
                const res = await API.lookupUser(id);
                const user = res.data;
                // Don't allow self-transfer
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (user.id == currentUser.id) {
                    feedback.innerHTML = `<span style="color:var(--error);">❌ Tidak dapat mengirim ke diri sendiri</span>`;
                    if (btn) btn.disabled = true;
                    return;
                }

                // Store valid user for submission display
                this.currentRecipient = user;

                feedback.innerHTML = `<span style="color:var(--success);">✅ Penerima: <b>${user.full_name}</b> <small>(${user.role})</small></span>`;
                if (btn) btn.disabled = false;
            } catch (e) {
                feedback.innerHTML = `<span style="color:var(--error);">❌ Pengguna tidak ditemukan</span>`;
                if (btn) btn.disabled = true;
            }
        }, 500);
    }

    static async handleTransferSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.amount = parseInt(data.amount);
        data.receiver_user_id = parseInt(data.receiver_id);
        delete data.receiver_id;

        const btn = e.target.querySelector('button[type="submit"]');

        // Get name from stored check or fallback to ID
        const recipientName = this.currentRecipient ? this.currentRecipient.full_name : `ID: ${data.receiver_user_id}`;

        try {
            btn.textContent = 'Memverifikasi Transaksi...';
            btn.disabled = true;

            const res = await API.request('/mahasiswa/transfer', 'POST', data);

            // Success Receipt Modal
            const receiptHtml = `
            <div class="modal-overlay" id="transferReceiptModal">
                <div class="modal-card" style="max-width: 450px; text-align: center; padding: 2rem; border-top: 8px solid var(--success);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🛰️</div>
                    <h3 style="color: var(--success); margin-bottom: 0.5rem;">Transmisi Berhasil</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">Transfer P2P sebesar <b>${data.amount.toLocaleString()} Poin</b> telah dikonfirmasi dan dicatat di buku besar.</p>
                    
                    <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: left; font-family: monospace; font-size: 0.85rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>PENERIMA:</span>
                            <span style="font-weight: 700; text-transform: uppercase;">${recipientName}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>HASH ID:</span>
                            <span style="font-weight: 700;">${Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                        </div>
                    </div>

                    <button class="btn btn-primary" onclick="document.getElementById('transferReceiptModal').remove(); MahasiswaController.renderTransfer();" style="width: 100%; padding: 1rem; border-radius: 12px; font-weight: 700;">
                        Kembali ke Dompet
                    </button>
                </div>
            </div>
        `;
            document.body.insertAdjacentHTML('beforeend', receiptHtml);
            e.target.reset();

        } catch (error) {
            showToast(error.message || "Transfer gagal", "error");
            btn.textContent = 'Konfirmasi Transfer 💸';
            btn.disabled = false;
        }
    }

    static openScanQR() {
        const scanHtml = `
            <div class="modal-overlay" id="scanQRModal">
                <div class="modal-card" style="max-width: 500px; padding: 0; overflow: hidden; border-radius: 24px;">
                    <div style="background: #000; height: 350px; display: flex; align-items: center; justify-content: center; position: relative;">
                        <!-- Scanner Simulation Overlay -->
                        <div style="width: 250px; height: 250px; border: 2px solid var(--primary); box-shadow: 0 0 0 1000px rgba(0,0,0,0.5); position: relative; border-radius: 12px;">
                            <div style="position: absolute; width: 100%; height: 2px; background: var(--primary); top: 0; animation: scanLine 2s linear infinite; box-shadow: 0 0 15px var(--primary);"></div>
                        </div>
                        <div style="position: absolute; bottom: 2rem; color: white; font-size: 0.9rem; font-weight: 600;">Posisikan kode QR di dalam bingkai</div>
                    </div>
                    <div style="padding: 2rem; text-align: center;">
                        <h3>Pindai QR Penerima</h3>
                        <p style="color: var(--text-muted); margin-bottom: 2rem;">Mencari Identifikasi Dompet...</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <button class="btn btn-primary" onclick="MahasiswaController.simulateScanSuccess()" style="padding: 1rem; border-radius: 12px;">Simulasikan Sukses</button>
                            <button class="btn btn-secondary" onclick="document.getElementById('scanQRModal').remove()" style="padding: 1rem; border-radius: 12px;">Batal</button>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes scanLine {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', scanHtml);
    }

    static simulateScanSuccess() {
        // Mock a success scan - usually would get User ID from QR
        const randomId = Math.floor(Math.random() * 5 + 1); // Mock existing IDs
        const input = document.getElementById('receiverIdInput');
        if (input) {
            input.value = randomId;
            showToast(`ID Pengguna yang Dipindai: ${randomId}`, "success");
        }
        document.getElementById('scanQRModal').remove();
    }

    static showMyQR() {
        const user = JSON.parse(localStorage.getItem('user'));
        const qrHtml = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-card" style="max-width: 400px; text-align: center; padding: 2.5rem; border-radius: 30px;">
                    <h3 style="margin-bottom: 0.5rem;">ID Dompet Saya</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">Minta teman Anda untuk memindai kode ini</p>
                    
                    <div style="background: white; padding: 1rem; border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--shadow-md); display: inline-block; margin-bottom: 2rem;">
                        <!-- Generated Mock QR -->
                         <div style="width: 250px; height: 250px; position:relative; display:flex; align-items:center; justify-content:center;">
                            <div style="position:absolute; width: 100%; height:100%; background: radial-gradient(circle, var(--primary) 2px, transparent 2px); background-size: 15px 15px; opacity:0.1;"></div>
                            <div style="font-size: 10rem;">📱</div>
                            <div style="position:absolute; bottom: 0; background: var(--primary); color: white; padding: 0.5rem 1.5rem; border-radius: 30px; font-weight: 800;">ID: ${user.id}</div>
                         </div>
                    </div>
                    
                    <button class="btn btn-secondary" onclick="closeModal()" style="width: 100%; padding: 1rem; border-radius: 12px;">Selesai</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', qrHtml);
    }

    static async loadTransferHistory() {
        const tbody = document.querySelector('#transferHistoryTable tbody');
        try {
            // Fetch both transfers and user wallet to identify self
            const user = JSON.parse(localStorage.getItem('user'));
            const [transfersRes, walletRes] = await Promise.all([
                API.request('/mahasiswa/transfer/history', 'GET'),
                API.getWallet(user.id) // Ensure we have the wallet ID
            ]);

            const transfers = transfersRes.data.transfers || [];
            const myWalletId = walletRes.data.id;

            if (transfers.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center" style="padding: 4rem;">
                            <div style="font-size: 2.5rem; opacity: 0.2; margin-bottom: 0.5rem;">💸</div>
                            <p style="color: var(--text-muted);">Tidak ada catatan transfer ditemukan</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = transfers.map(t => {
                // Correct logic: Compare sender_wallet_id with myWalletId
                const isIncoming = t.sender_wallet_id !== myWalletId;

                return `
                <tr>
                    <td>
                        <span class="badge ${isIncoming ? 'badge-success' : 'badge-warning'}">
                            ${isIncoming ? 'DITERIMA 📥' : 'DIKIRIM 📤'}
                        </span>
                    </td>
                    <td>
                         <div style="font-weight:600; color:var(--text-main);">
                            ${isIncoming ? 'Dari Wallet ID: ' + t.sender_wallet_id : 'Ke Wallet ID: ' + t.receiver_wallet_id}
                         </div>
                         <small style="color:var(--text-muted);">${t.description || 'Tidak ada catatan'}</small>
                    </td>
                    <td style="font-weight: 700; color: ${isIncoming ? 'var(--success)' : 'var(--error)'}">
                        ${isIncoming ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                    <td><small>${new Date(t.created_at).toLocaleDateString()} ${new Date(t.created_at).toLocaleTimeString()}</small></td>
                </tr>
            `}).join('');

        } catch (e) {
            console.error(e);
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center">Gagal memuat riwayat</td></tr>';
        }
    }
}
