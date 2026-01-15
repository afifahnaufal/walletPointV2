/* Merchant Dashboard Features */
class MerchantController {
    static init() {
        console.log("Merchant Controller Initialized");
    }

    static async loadMerchantStats() {
        try {
            const res = await API.getMerchantStats();
            const stats = res.data;

            const salesElem = document.getElementById('stats-merchant-sales');
            const countElem = document.getElementById('stats-merchant-count');
            const balanceElem = document.getElementById('stats-merchant-balance');

            if (salesElem) salesElem.textContent = stats.today_sales.toLocaleString();
            if (countElem) countElem.textContent = stats.transaction_count.toLocaleString();
            if (balanceElem) balanceElem.textContent = stats.total_balance.toLocaleString();
        } catch (e) {
            console.error("Error loading merchant stats:", e);
            showToast("Gagal memuat statistik kasir", "error");
        }
    }

    static async renderMerchantScanner() {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="fade-in">
                <div class="table-header" style="margin-bottom: 2rem;">
                    <div>
                        <h2 style="font-weight: 700; color: var(--text-main);">Terminal Pembayaran Kasir</h2>
                        <p style="color: var(--text-muted);">Scan QR Token Mahasiswa untuk memproses pembayaran</p>
                    </div>
                </div>

                <div class="card" style="max-width: 600px; margin: 0 auto; padding: 2.5rem; text-align: center; border-radius: 24px; box-shadow: var(--shadow-lg);">
                    <div id="merchantScannerContainer" style="width: 100%; max-width: 400px; margin: 0 auto 2rem; border-radius: 20px; overflow: hidden; border: 4px solid var(--primary); background: #000; min-height: 300px; position: relative;">
                        <div id="merchant-reader"></div>
                        <div id="scannerOverlay" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; border: 2px solid rgba(255,255,255,0.2); box-sizing: border-box;">
                             <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:70%; height:70%; border: 2px solid var(--primary); box-shadow: 0 0 0 1000px rgba(0,0,0,0.5);"></div>
                        </div>
                    </div>

                    <div id="scanResult" style="display:none; margin-top: 1rem; animation: slideUp 0.3s ease;">
                        <div class="card" style="background: rgba(99, 102, 241, 0.05); border: 1px solid var(--primary); padding: 1.5rem; text-align: left;">
                            <h4 style="margin:0 0 1rem 0; color: var(--primary);">Konfirmasi Pembayaran</h4>
                            <div id="paymentDetails" style="font-family: monospace; font-size: 0.9rem;">
                                <!-- Details will be injected here -->
                            </div>
                            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                                <button class="btn btn-secondary" onclick="MerchantController.resetScanner()" style="flex:1;">Batal</button>
                                <button id="confirmMerchantPayBtn" class="btn btn-primary" style="flex:2;">Konfirmasi & Potong Saldo</button>
                            </div>
                        </div>
                    </div>

                    <div id="waitingMsg">
                        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Posisikan QR Code Mahasiswa di dalam kotak scanner</p>
                        
                        <div style="margin-bottom: 1rem;">
                            <label for="merchantQrFileInput" class="btn btn-secondary" style="display: block; padding: 1rem; border-radius: 12px; cursor: pointer; background: rgba(99, 102, 241, 0.05); color: var(--primary); border: 2px dashed var(--primary); font-weight: 600;">
                                📁 Unggah & Scan Pembayaran
                            </label>
                            <input type="file" id="merchantQrFileInput" accept="image/*" style="display: none;">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.startScanner();
    }

    static html5QrCode = null;

    static startScanner() {
        this.html5QrCode = new Html5Qrcode("merchant-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        this.html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                this.handleScan(decodedText);
            }
        ).catch(err => {
            console.warn("Merchant camera failed, fallback to file: ", err);
        });

        // Handle File Scan
        const fileInput = document.getElementById('merchantQrFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', async e => {
                if (e.target.files.length === 0) return;
                const file = e.target.files[0];

                try {
                    await this.html5QrCode.stop();
                } catch (err) { /* Not scanning */ }

                this.html5QrCode.scanFile(file, true)
                    .then(decodedText => {
                        this.handleScan(decodedText);
                    })
                    .catch(err => {
                        showToast("Gagal memindai file: " + err, "error");
                        this.startScanner(); // Restart camera
                    });
            });
        }
    }

    static async handleScan(data) {
        // Format: WPT:tokenCode:amount:merchant
        if (!data.startsWith("WPT:")) {
            showToast("QR Code tidak valid untuk pembayaran", "error");
            return;
        }

        const parts = data.split(":");
        if (parts.length < 3) {
            showToast("Format QR Code salah", "error");
            return;
        }

        const token = parts[1];
        const amount = parts[2];
        const merchant = parts[3] || "Merchant";

        // Stop scanner while processing
        if (this.html5QrCode) {
            this.html5QrCode.stop().catch(e => console.log(e));
        }

        document.getElementById('waitingMsg').style.display = 'none';
        document.getElementById('scanResult').style.display = 'block';

        const details = document.getElementById('paymentDetails');
        details.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>JUMLAH:</span>
                <span style="font-weight:700; color:var(--primary);">${parseInt(amount).toLocaleString()} Pts</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>KASIR/TOKO:</span>
                <span style="font-weight:700;">${merchant}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span>TOKEN:</span>
                <span style="color:var(--text-muted);">${token.substring(0, 8)}...</span>
            </div>
        `;

        const btn = document.getElementById('confirmMerchantPayBtn');
        btn.onclick = async () => {
            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Memproses...';

                await API.request('/merchant/payment/scan', 'POST', { token: token });

                showToast("Pembayaran Berhasil Diproses!", "success");
                this.resetScanner();
            } catch (e) {
                showToast(e.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Konfirmasi & Potong Saldo';
            }
        };
    }

    static resetScanner() {
        document.getElementById('scanResult').style.display = 'none';
        document.getElementById('waitingMsg').style.display = 'block';
        this.startScanner();
    }
}
