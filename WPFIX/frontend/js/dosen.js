class DosenController {
    static init() {
        console.log("Dosen module initialized");
    }

    static async loadDosenStats() {
        try {
            const missions = await API.getDosenMissions();
            const submissions = await API.getDosenSubmissions();

            const mElem = document.getElementById('stats-missions');
            const pElem = document.getElementById('stats-pending');
            const vElem = document.getElementById('stats-validated');

            if (mElem) mElem.textContent = missions.data.total || 0;
            if (pElem) {
                const pending = (submissions.data.submissions || []).filter(s => s.status === 'pending').length;
                pElem.textContent = pending;
            }
            if (vElem) {
                const approved = (submissions.data.submissions || []).filter(s => s.status === 'approved').length;
                vElem.textContent = approved;
            }
        } catch (e) {
            console.error("Failed to load dosen stats", e);
        }
    }

    // ==========================
    // MODULE: QUIZZES
    // ==========================
    static async renderQuizzes() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2 style="font-weight: 700; color: var(--text-main);">Manajemen Kuis</h2>
                        <p style="color: var(--text-muted);">Buat dan kelola kuis interaktif untuk siswa</p>
                    </div>
                    <button class="btn btn-primary" onclick="DosenController.showQuizModal()">
                        <span style="font-size: 1.2rem;">+</span> Buat Kuis Baru
                    </button>
                </div>

                <div class="table-wrapper">
                    <div style="overflow-x: auto;">
                        <table class="premium-table" id="quizzesTable">
                            <thead>
                                <tr>
                                    <th>Detail Kuis</th>
                                    <th>Kompleksitas</th>
                                    <th>Hadiah</th>
                                    <th>Jadwal</th>
                                    <th>Status</th>
                                    <th class="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody><tr><td colspan="6" class="text-center">Memuat Kuis...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        try {
            const result = await API.getDosenMissions({ type: 'quiz' });
            const quizzes = (result.data.missions || []).filter(m => m.type === 'quiz');
            const tbody = document.querySelector('#quizzesTable tbody');

            if (quizzes.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center" style="padding: 4rem 1rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📝</div>
                            <h3 style="color: var(--text-muted);">Tidak ada kuis ditemukan</h3>
                            <p style="opacity: 0.6;">Mulai dengan membuat kuis interaktif pertama Anda.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = quizzes.map(q => `
                <tr class="fade-in-item">
                    <td>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                💡
                            </div>
                            <div>
                                <strong style="font-size: 1rem; color: var(--text-main);">${q.title}</strong><br>
                                <small style="color: var(--text-muted); display: block; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${q.description || 'Tidak ada instruksi yang diberikan'}
                                </small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.2);">
                            ${q.questions?.length || 0} Pertanyaan
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <span style="color: #fbbf24; font-size: 1.1rem;">💎</span>
                            <span style="font-weight: 700; color: var(--text-main);">${q.points.toLocaleString()}</span>
                            <small style="color: var(--text-muted);">pts</small>
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem;">
                            <div style="color: var(--text-main);">${q.deadline ? new Date(q.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Tidak Ada Batas'}</div>
                            <small style="color: var(--text-muted);">${q.deadline ? new Date(q.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${q.status === 'active' ? 'badge-success' : 'badge-warning'}">
                            ${q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                        </span>
                    </td>
                    <td class="text-right">
                        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                            <button class="btn-icon" style="background: #f1f5f9;" onclick="DosenController.showQuizModal(${q.id})" title="Edit Kuis">
                                <span style="font-size: 0.9rem;">✏️</span>
                            </button>
                            <button class="btn-icon" style="background: rgba(239, 68, 68, 0.05); color: var(--error);" onclick="DosenController.deleteMission(${q.id})" title="Hapus Kuis">
                                <span style="font-size: 0.9rem;">🗑️</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
            showToast("Gagal memuat kuis", "error");
        }
    }

    static async showQuizModal(id = null) {
        let quiz = null;
        if (id) {
            try {
                const res = await API.getDosenMissions();
                quiz = res.data.missions.find(m => m.id === id);
            } catch (e) { console.error(e); }
        }

        const modalHtml = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-card" style="max-width: 1000px; width: 95%; height: 90vh; display: flex; flex-direction: column;">
                    <div class="modal-head" style="background: linear-gradient(to right, #6366f1, #a855f7); color: white; padding: 1.5rem 2rem;">
                        <div>
                            <h3 style="margin:0; font-weight: 700;">${id ? '📝 Edit Penilaian' : '✨ Desain Kuis Baru'}</h3>
                            <p style="margin: 0.2rem 0 0 0; font-size: 0.85rem; opacity: 0.9;">Konfigurasikan pertanyaan dan hadiah untuk siswa Anda</p>
                        </div>
                        <button class="btn-icon" onclick="closeModal()" style="color: white; font-size: 1.5rem;">×</button>
                    </div>
                    
                    <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 2rem; background: #fdfcfd;">
                        <form id="quizForm" onsubmit="DosenController.handleQuizSubmit(event, ${id})">
                            <!-- Basic Config Card -->
                            <div class="card" style="margin-bottom: 2rem; border-left: 4px solid var(--primary); padding: 1.5rem;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                                    <div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; color: var(--text-main);">Judul Kuis</label>
                                            <input type="text" name="title" value="${quiz?.title || ''}" required placeholder="misal, Matematika - Dasar Aljabar" style="border-radius: 10px;">
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; color: var(--text-main);">Panduan & Deskripsi</label>
                                            <textarea name="description" placeholder="Sebutkan aturan atau konteks kuis..." style="min-height: 100px; border-radius: 10px;">${quiz?.description || ''}</textarea>
                                        </div>
                                    </div>
                                    <div>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                            <div class="form-group">
                                                <label style="font-weight: 600; color: var(--text-main);">Alokasi Poin</label>
                                                <div style="position: relative;">
                                                    <input type="number" name="points" value="${quiz?.points || 100}" required min="1" style="padding-left: 2.5rem; border-radius: 10px;">
                                                    <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5;">💎</span>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label style="font-weight: 600; color: var(--text-main);">Batas Waktu / Tenggat</label>
                                                <input type="datetime-local" name="deadline" value="${quiz?.deadline ? new Date(quiz.deadline).toISOString().slice(0, 16) : ''}" style="border-radius: 10px;">
                                            </div>
                                        </div>
                                        <div style="background: rgba(99, 102, 241, 0.05); padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--primary); border: 1px dashed var(--primary-light);">
                                            <strong>Tip Pro:</strong> Kuis dengan poin lebih tinggi cenderung memiliki keterlibatan siswa yang lebih baik. Pastikan tenggat waktu masuk akal!
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Questions Sections -->
                            <div id="questionsContainer">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: #fff; position: sticky; top: 0; z-index: 10; padding: 0.5rem 0;">
                                    <h3 style="margin:0; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
                                        <span style="background: var(--secondary); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">?</span>
                                        Quiz Questions (<span id="qCount">0</span>/20)
                                    </h3>
                                    <button type="button" id="btnAddQuestion" class="btn btn-primary" onclick="DosenController.addQuestionField()" style="padding: 0.5rem 1rem; font-size: 0.85rem; border-radius: 2rem;">
                                        + Tambah Pertanyaan Baru
                                    </button>
                                </div>
                                <div id="questionsList">
                                    <!-- Dynamic fields -->
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modal-foot" style="padding: 1.5rem 2rem; border-top: 1px solid var(--border); background: white; border-bottom-left-radius: var(--radius-xl); border-bottom-right-radius: var(--radius-xl);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="color: var(--text-muted); font-size: 0.9rem;">
                                ✨ Total Poin: <span id="pointsPreview" style="font-weight: 700; color: var(--primary);">${quiz?.points || 100}</span>
                            </div>
                            <div style="display: flex; gap: 1rem;">
                                <button type="button" class="btn btn-secondary" onclick="closeModal()" style="background: transparent; color: var(--text-muted);">Buang</button>
                                <button type="submit" form="quizForm" class="btn btn-primary" style="padding: 0.8rem 2.5rem; border-radius: 2rem;">
                                    ${id ? 'Perbarui Penilaian' : 'Luncurkan Kuis 🚀'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Point preview sync
        document.querySelector('input[name="points"]').addEventListener('input', (e) => {
            document.getElementById('pointsPreview').textContent = e.target.value;
        });

        // Pre-fill questions
        if (quiz?.questions && quiz.questions.length > 0) {
            quiz.questions.forEach((q, idx) => this.addQuestionField(q, idx + 1));
        } else {
            this.addQuestionField(null, 1);
        }
    }

    static addQuestionField(data = null, index = null) {
        const container = document.getElementById('questionsList');
        const count = container.children.length;

        if (count >= 20 && !data) {
            showToast("Maksimum 20 pertanyaan tercapai", "warning");
            return;
        }

        if (!index) {
            index = count + 1;
        }

        const qId = Date.now() + Math.random().toString(16).slice(2);
        const html = `
            <div class="question-item card fade-in" style="padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--border); border-left: 5px solid var(--primary); box-shadow: var(--shadow-md); position: relative; border-radius: var(--radius-lg);" id="q-${qId}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: center; flex: 1;">
                        <span class="q-number" style="background: var(--primary); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">${index}</span>
                        <input type="text" class="question-text" placeholder="Ketik pertanyaan Anda di sini..." value="${data?.question || ''}" required 
                               style="font-size: 1.1rem; font-weight: 600; border: none; border-bottom: 2px solid #f1f5f9; padding: 0.5rem 0; border-radius: 0; width: 100%;">
                    </div>
                    <button type="button" class="btn-icon" style="color: var(--error); border: none; background: rgba(239, 68, 68, 0.05); margin-left: 1rem;" 
                            onclick="document.getElementById('q-${qId}').remove(); DosenController.reindexQuestions();" title="Hapus Pertanyaan">
                        <span style="font-size: 1.2rem;">&times;</span>
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    ${['A', 'B', 'C', 'D'].map((letter, i) => {
            const optionValue = data?.options ? (data.options[i] || '') : '';
            const isCorrect = data?.answer === optionValue && optionValue !== '';
            return `
                        <div style="display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.2s;">
                            <input type="radio" name="correct-${qId}" value="${i}" ${isCorrect ? 'checked' : (i === 0 && !data ? 'checked' : '')} 
                                   style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary);">
                            <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-weight: 800; color: #64748b; min-width: 15px;">${letter}</span>
                                <input type="text" class="question-option" placeholder="Option ${letter}" value="${optionValue}" required 
                                       style="background: transparent; border: none; padding: 0.25rem 0; font-size: 0.95rem; width: 100%;"
                                       oninput="this.closest('div').parentElement.querySelector('input[type=radio]').value = ${i};">
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
                
                <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--success);">●</span> Pilih tombol radio di sebelah jawaban yang benar.
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        this.reindexQuestions();
    }

    static reindexQuestions() {
        const questions = document.querySelectorAll('.question-item');
        const counterElem = document.getElementById('qCount');
        const btnAdd = document.getElementById('btnAddQuestion');

        if (counterElem) counterElem.textContent = questions.length;

        if (btnAdd) {
            if (questions.length >= 20) {
                btnAdd.disabled = true;
                btnAdd.style.opacity = '0.5';
                btnAdd.style.cursor = 'not-allowed';
            } else {
                btnAdd.disabled = false;
                btnAdd.style.opacity = '1';
                btnAdd.style.cursor = 'pointer';
            }
        }

        questions.forEach((el, idx) => {
            const span = el.querySelector('.q-number');
            if (span) span.textContent = idx + 1;
        });
    }

    static async handleQuizSubmit(e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.type = 'quiz';
        data.points = parseInt(data.points);

        // Collect questions
        const questionsList = [];
        document.querySelectorAll('.question-item').forEach(el => {
            const question = el.querySelector('.question-text').value;
            const optionInputs = el.querySelectorAll('.question-option');
            const options = Array.from(optionInputs).map(o => o.value).filter(v => v.trim() !== "");

            // Get selected radio button index
            const qId = el.id.replace('q-', '');
            const selectedRadio = el.querySelector(`input[name="correct-${qId}"]:checked`);
            const selectedIdx = selectedRadio ? parseInt(selectedRadio.value) : 0;

            // The answer is the text of the selected option
            const answer = optionInputs[selectedIdx] ? optionInputs[selectedIdx].value : "";

            questionsList.push({ question, options, answer });
        });

        if (questionsList.length === 0) {
            showToast("Setidaknya satu pertanyaan diperlukan", "error");
            return;
        }

        data.questions = questionsList;

        if (data.deadline) {
            data.deadline = new Date(data.deadline).toISOString();
        } else {
            delete data.deadline;
        }

        try {
            if (id) {
                await API.updateMission(id, data);
            } else {
                await API.createMission(data);
            }
            showToast("Kuis berhasil diterbitkan");
            closeModal();
            DosenController.renderQuizzes();
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    // ==========================
    // MODULE: MISSIONS
    // ==========================
    static async renderMissions() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="table-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2 style="font-weight: 700; color: var(--text-main);">Lokakarya Misi</h2>
                        <p style="color: var(--text-muted);">Koordinasikan tugas dan penugasan untuk pengembangan siswa</p>
                    </div>
                    <button class="btn btn-primary" onclick="DosenController.showMissionModal()">
                        <span style="font-size: 1.2rem;">+</span> Tugas Baru
                    </button>
                </div>

                <div class="table-wrapper">
                    <div style="overflow-x: auto;">
                        <table class="premium-table" id="missionsTable">
                            <thead>
                                <tr>
                                    <th>Pengenal Tugas</th>
                                    <th>Kategori</th>
                                    <th>Hadiah</th>
                                    <th>Linimasa</th>
                                    <th>Status</th>
                                    <th class="text-right">Kelola</th>
                                </tr>
                            </thead>
                            <tbody><tr><td colspan="6" class="text-center">Menyelaraskan misi...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        try {
            const result = await API.getDosenMissions();
            const missions = (result.data.missions || []).filter(m => m.type !== 'quiz');
            const tbody = document.querySelector('#missionsTable tbody');

            if (missions.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center" style="padding: 4rem 1rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">🛠️</div>
                            <h3 style="color: var(--text-muted);">Tidak ada misi aktif</h3>
                            <p style="opacity: 0.6;">Laboratorium misi Anda saat ini kosong.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = missions.map(m => `
                <tr class="fade-in-item">
                    <td>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ${m.type === 'assignment' ? '📄' : '✅'}
                            </div>
                            <div>
                                <strong style="font-size: 1rem; color: var(--text-main);">${m.title}</strong><br>
                                <small style="color: var(--text-muted); display: block; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${m.description || 'Tidak ada detail instruksi'}
                                </small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success); text-transform: capitalize; border: 1px solid rgba(16, 185, 129, 0.2);">
                            ${m.type}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <span style="color: #fbbf24; font-size: 1.1rem;">💎</span>
                            <span style="font-weight: 700; color: var(--text-main);">${m.points.toLocaleString()}</span>
                            <small style="color: var(--text-muted);">pts</small>
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem;">
                            <div style="color: var(--text-main);">${m.deadline ? new Date(m.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Buka Selamanya'}</div>
                            <small style="color: var(--text-muted);">${m.deadline ? new Date(m.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Tidak Ada Kadaluwarsa'}</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${m.status === 'active' ? 'badge-success' : 'badge-warning'}" style="border-radius: 20px;">
                            ${m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                    </td>
                    <td class="text-right">
                        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                            <button class="btn-icon" style="background: #f1f5f9;" onclick="DosenController.showMissionModal(${m.id})" title="Sempurnakan Tugas">
                                <span style="font-size: 0.9rem;">✏️</span>
                            </button>
                            <button class="btn-icon" style="background: rgba(239, 68, 68, 0.05); color: var(--error);" onclick="DosenController.deleteMission(${m.id})" title="Hapus Tugas">
                                <span style="font-size: 0.9rem;">🗑️</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
            showToast("Gagal memuat misi lokakarya", "error");
        }
    }

    static async showMissionModal(id = null) {
        let mission = null;
        if (id) {
            try {
                const res = await API.getDosenMissions();
                mission = res.data.missions.find(m => m.id === id);
            } catch (e) { console.error(e); }
        }

        const modalHtml = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-card" style="max-width: 650px; width: 95%; overflow: hidden; border-radius: var(--radius-xl);">
                    <div class="modal-head" style="background: var(--primary); color: white; padding: 1.5rem 2rem;">
                        <div>
                            <h3 style="margin:0; font-weight: 700;">${id ? '🛠️ Sempurnakan Misi' : '✨ Arsiteki Misi Baru'}</h3>
                            <p style="margin: 0.2rem 0 0 0; font-size: 0.85rem; opacity: 0.9;">Desain tugas untuk menantang siswa Anda</p>
                        </div>
                        <button class="btn-icon" onclick="closeModal()" style="color: white; font-size: 1.5rem;">×</button>
                    </div>

                    <div class="modal-body" style="padding: 2rem;">
                        <form id="missionForm" onsubmit="DosenController.handleMissionSubmit(event, ${id})">
                            <div class="form-group">
                                <label style="font-weight: 600; color: var(--text-main);">Nama Proyek / Judul Misi</label>
                                <input type="text" name="title" value="${mission?.title || ''}" required placeholder="misal, Analisis Sistem Keuangan" style="border-radius: 10px;">
                            </div>
                            <div class="form-group">
                                <label style="font-weight: 600; color: var(--text-main);">Instruksi Komprehensif</label>
                                <textarea name="description" placeholder="Berikan langkah-langkah yang jelas untuk penyelesaian..." style="min-height: 120px; border-radius: 10px;">${mission?.description || ''}</textarea>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                <div class="form-group">
                                    <label style="font-weight: 600; color: var(--text-main);">Kategori Tugas</label>
                                    <select name="type" style="border-radius: 10px; background-color: #f8fafc;">
                                        <option value="task" ${mission?.type === 'task' ? 'selected' : ''}>Tugas Standar</option>
                                        <option value="assignment" ${mission?.type === 'assignment' ? 'selected' : ''}>Penugasan Laboratorium</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style="font-weight: 600; color: var(--text-main);">Hadiah Dompet (poin)</label>
                                    <div style="position: relative;">
                                        <input type="number" name="points" value="${mission?.points || 100}" required min="1" style="padding-left: 2.5rem; border-radius: 10px;">
                                        <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);">💎</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label style="font-weight: 600; color: var(--text-main);">Tenggat Penyelesaian</label>
                                <input type="datetime-local" name="deadline" value="${mission?.deadline ? new Date(mission.deadline).toISOString().slice(0, 16) : ''}" style="border-radius: 10px;">
                            </div>

                            <div class="form-actions" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                                <button type="button" class="btn" onclick="closeModal()" style="background: transparent; color: var(--text-muted);">Buang Perubahan</button>
                                <button type="submit" class="btn btn-primary" style="padding: 0.8rem 2rem; border-radius: 2rem; box-shadow: var(--shadow-md);">
                                    ${id ? 'Eksekusi Pembaruan' : 'Luncurkan Misi 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async handleMissionSubmit(e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Ensure points is a valid positive number
        const points = parseInt(data.points, 10);
        if (isNaN(points) || points <= 0) {
            showToast("Poin hadiah harus berupa angka positif", "error");
            return;
        }
        data.points = points;

        if (data.deadline) {
            try {
                data.deadline = new Date(data.deadline).toISOString();
            } catch (err) {
                delete data.deadline;
            }
        } else {
            delete data.deadline;
        }

        try {
            if (id) {
                await API.updateMission(id, data);
                showToast("Misi berhasil diperbarui");
            } else {
                await API.createMission(data);
                showToast("Misi berhasil dibuat");
            }
            closeModal();
            DosenController.renderMissions();
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    static async deleteMission(id) {
        if (!confirm("Apakah Anda yakin ingin menghapus misi ini?")) return;
        try {
            await API.deleteMission(id);
            showToast("Misi dihapus");
            DosenController.renderMissions();
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    // ==========================
    // MODULE: SUBMISSIONS
    // ==========================
    static async renderSubmissions(statusFilter = 'pending') {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="table-header" style="margin-bottom: 2rem;">
                    <h2 style="font-weight: 700; color: var(--text-main);">Terminal Validasi</h2>
                    <p style="color: var(--text-muted);">Tinjau pengiriman siswa dan berikan poin</p>
                </div>

                <div class="tabs" style="margin-bottom: 1.5rem; display:flex; gap: 1rem; border-bottom: 2px solid var(--border);">
                    <button class="tab-btn ${statusFilter === 'pending' ? 'active' : ''}" 
                            onclick="DosenController.renderSubmissions('pending')"
                            style="padding: 0.8rem 1.5rem; background:none; border:none; border-bottom: 3px solid ${statusFilter === 'pending' ? 'var(--primary)' : 'transparent'}; font-weight: 600; color: ${statusFilter === 'pending' ? 'var(--primary)' : 'var(--text-muted)'}; cursor: pointer;">
                        ⏳ Menunggu Peninjauan
                    </button>
                    <button class="tab-btn ${statusFilter !== 'pending' ? 'active' : ''}" 
                            onclick="DosenController.renderSubmissions('approved')"
                            style="padding: 0.8rem 1.5rem; background:none; border:none; border-bottom: 3px solid ${statusFilter !== 'pending' ? 'var(--primary)' : 'transparent'}; font-weight: 600; color: ${statusFilter !== 'pending' ? 'var(--primary)' : 'var(--text-muted)'}; cursor: pointer;">
                        ✅ Riwayat / Ditinjau
                    </button>
                </div>

                <div class="table-wrapper">
                    <div style="overflow-x: auto;">
                        <table class="premium-table" id="submissionsTable">
                            <thead>
                                <tr>
                                    <th>Info Kandidat</th>
                                    <th>Asal Misi</th>
                                    <th>Waktu</th>
                                    <th>Status & Skor</th>
                                    <th class="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody><tr><td colspan="5" class="text-center">Menunggu aliran data...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        try {
            // Note: If 'approved', we might want to also see 'rejected'. Backend filter currently implies exact match.
            // For simplicity, let's carry the filter string. If user clicks History, we might defaulting to 'approved' but strictly we want completed.
            // But API might support status filter.

            let queryStatus = statusFilter;
            if (statusFilter !== 'pending') {
                // If viewing history, maybe we fetch all non-pending? 
                // Currently API implementation usually filters by exact status. 
                // Let's stick to the requested status for now.
            }

            const result = await API.getDosenSubmissions({ status: queryStatus, limit: 100 });
            let submissions = result.data.submissions || [];

            // If tab is history, we might want to merge approved & rejected if backend doesn't support generic 'completed' status
            // Assuming for now simple filter.

            const tbody = document.querySelector('#submissionsTable tbody');

            if (submissions.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center" style="padding: 4rem 1rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📭</div>
                            <h3 style="color: var(--text-muted);">Tidak ada pengiriman ${statusFilter}</h3>
                            <p style="opacity: 0.6;">Kotak masuk Anda untuk kategori ini kosong.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = submissions.map(s => `
                <tr class="fade-in-item">
                    <td>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">
                                ${s.student_name ? s.student_name.charAt(0) : 'S'}
                            </div>
                            <div>
                                <strong style="color: var(--text-main);">${s.student_name}</strong><br>
                                <small style="color: var(--text-muted);">${s.student_nim}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: var(--primary);">${s.mission_title}</div>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem;">
                            <div style="color: var(--text-main);">${new Date(s.created_at).toLocaleDateString()}</div>
                            <small style="color: var(--text-muted);">${new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${s.status === 'pending' ? 'badge-warning' : (s.status === 'approved' ? 'badge-success' : 'badge-error')}" 
                              style="text-transform: capitalize;">
                            ${s.status}
                        </span>
                        ${s.status !== 'pending' ? `<span style="font-weight: 700; margin-left: 0.5rem; color: var(--text-main);">${s.score}/100</span>` : ''}
                    </td>
                    <td class="text-right">
                        ${s.status === 'pending'
                    ? `<button class="btn btn-primary" onclick="DosenController.showReviewModal(${s.id})" style="padding: 0.4rem 1.2rem; font-size: 0.85rem; border-radius: 20px;">Tinjau Sekarang</button>`
                    : `<button class="btn" onclick="DosenController.showReviewModal(${s.id})" style="padding: 0.4rem 1.2rem; font-size: 0.85rem; background: #f1f5f9; color: var(--text-muted);">Lihat Detail</button>`
                }
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error(error);
            showToast("Gagal mengambil pengiriman", "error");
        }
    }

    static async showReviewModal(id) {
        try {
            const res = await API.getDosenSubmissions();
            const submission = res.data.submissions.find(s => s.id === id);

            const modalHtml = `
                <div class="modal-overlay" onclick="closeModal(event)">
                    <div class="modal-card" style="max-width: 750px; border-radius: var(--radius-xl); overflow: hidden;">
                        <div class="modal-head" style="background: #0f172a; color: white; padding: 1.5rem 2rem;">
                            <div>
                                <h3 style="margin:0;">Validasi Pekerjaan: ${submission.student_name}</h3>
                                <p style="margin: 0.2rem 0 0 0; font-size: 0.85rem; opacity: 0.7;">${submission.mission_title}</p>
                            </div>
                            <button class="btn-icon" onclick="closeModal()" style="color: white;">×</button>
                        </div>
                        <div class="modal-body" style="padding: 2rem; background: #f8fafc;">
                            <div class="card" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border: 1px solid var(--border);">
                                <label style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 0.5rem;">Artefak Pengiriman</label>
                                <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.95rem; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${submission.content || 'Tidak ada konten teks yang disediakan.'}</div>
                                ${submission.file_url ? `
                                    <div style="margin-top: 1rem;">
                                        <a href="${submission.file_url}" target="_blank" class="btn" style="background: var(--primary); color: white; font-size: 0.85rem; width: 100%;">
                                            Lihat Bukti Terlampir 📎
                                        </a>
                                    </div>
                                ` : ''}
                            </div>

                            <form id="reviewForm" onsubmit="DosenController.handleReviewSubmit(event, ${id})">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                    <div class="form-group">
                                        <label style="font-weight: 600;">Skor Teknis (0-100)</label>
                                        <input type="number" name="score" value="100" min="0" max="100" required style="border-radius: 10px;">
                                    </div>
                                    <div class="form-group">
                                        <label style="font-weight: 600;">Keputusan</label>
                                        <select name="status" style="border-radius: 10px;">
                                            <option value="approved">✅ Setujui & Hadiahi</option>
                                            <option value="rejected">❌ Tolak Pengiriman</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label style="font-weight: 600;">Umpan Balik & Catatan Mentorship</label>
                                    <textarea name="review_note" placeholder="Beritahu siswa bagaimana kinerja mereka..." style="min-height: 100px; border-radius: 10px;"></textarea>
                                </div>
                                <div class="form-actions" style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                    <button type="button" class="btn" onclick="closeModal()" style="background: transparent; color: var(--text-muted);">Batal</button>
                                    <button type="submit" class="btn btn-primary" style="padding: 0.8rem 2.5rem; border-radius: 30px;">Selesaikan Peninjauan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        } catch (error) {
            showToast("Kesalahan memuat detail", "error");
        }
    }

    static async handleReviewSubmit(e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.score = parseInt(data.score);

        try {
            await API.reviewSubmission(id, data);
            showToast(`Pengiriman ${data.status} berhasil`);
            closeModal();
            DosenController.renderSubmissions();
        } catch (error) {
            showToast(error.message, "error");
        }
    }
}
