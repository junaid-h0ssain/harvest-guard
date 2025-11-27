// modules/aiScan.js
import { HF_CONFIG } from "../config.js"; // adjust path if your config is elsewhere

// Small helper: pick the best label from HF response
function interpretPrediction(predictions) {
    if (!Array.isArray(predictions) || predictions.length === 0) {
        return {
            verdict: "Unknown",
            message: "মডেল কোনো ফলাফল ফেরত দেয়নি। দয়া করে আবার চেষ্টা করুন।"
        };
    }

    // HF image classification returns [{ label, score }, ...][web:6][web:9]
    const best = predictions.reduce((a, b) => (b.score > a.score ? b : a));
    const label = (best.label || "").toLowerCase();

    let verdict;
    if (label.includes("fresh")) {
        verdict = "Fresh";
    } else if (label.includes("rotten") || label.includes("bad") || label.includes("defect")) {
        verdict = "Rotten";
    } else {
        verdict = "Unclear";
    }

    let message;
    if (verdict === "Fresh") {
        message = "এই ফসলটি এখনো ভালো অবস্থায় (Fresh) আছে।";
    } else if (verdict === "Rotten") {
        message = "এই ফসলটিতে পচন বা ক্ষতির লক্ষণ দেখা যাচ্ছে (Rotten)।";
    } else {
        message = `মডেল নিশ্চিত নয়: ${best.label} (${(best.score * 100).toFixed(1)}%).`;
    }

    return { verdict, message, raw: best };
}

async function callHuggingFace(file) {
    // Sends raw image bytes as the body; HF Inf. API accepts binary images.[web:6][web:9]
    const response = await fetch(HF_CONFIG.apiUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${HF_CONFIG.apiKey}`
            // Content-Type is inferred from the Blob (image/*)
        },
        body: file
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`HF API error ${response.status}: ${errorText}`);
    }

    return response.json();
}

export function initAiScanner() {
    const fileInput = document.getElementById("ai-scan-input");
    const scanButton = document.getElementById("ai-scan-button");
    const statusEl = document.getElementById("ai-scan-status");
    const resultEl = document.getElementById("ai-scan-result");
    const previewImg = document.getElementById("ai-scan-preview");

    // If this view/card isn’t present, just do nothing (keeps module safe).[attached_file:1]
    if (!fileInput || !scanButton || !statusEl || !resultEl || !previewImg) {
        return;
    }

    let selectedFile = null;

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        selectedFile = file;
        resultEl.textContent = "";

        if (!file) {
            statusEl.textContent = "দয়া করে একটি ফসলের ছবি নির্বাচন করুন।";
            previewImg.classList.add("hidden");
            previewImg.removeAttribute("src");
            return;
        }

        // Preview for quick visual confirmation on mobile
        const url = URL.createObjectURL(file);
        previewImg.src = url;
        previewImg.classList.remove("hidden");
        statusEl.textContent = "ছবি নির্বাচিত হয়েছে। এখন Scan crop health ক্লিক করুন।";
    });

    scanButton.addEventListener("click", async () => {
        if (!selectedFile) {
            statusEl.textContent = "দয়া করে আগে একটি ছবি নির্বাচন করুন।";
            return;
        }

        statusEl.textContent = "স্ক্যান চলছে… কিছুক্ষণ অপেক্ষা করুন।";
        scanButton.disabled = true;
        scanButton.classList.add("opacity-70", "cursor-not-allowed");
        resultEl.textContent = "";

        const start = performance.now();

        try {
            const predictions = await callHuggingFace(selectedFile);
            const { verdict, message, raw } = interpretPrediction(predictions);

            const elapsedMs = performance.now() - start;
            const seconds = (elapsedMs / 1000).toFixed(1);

            statusEl.textContent = `স্ক্যান সম্পন্ন (${seconds} সেকেন্ডে)।`;
            resultEl.innerHTML = `
        <span class="font-semibold">Verdict:</span> ${verdict}<br/>
        <span class="text-xs text-gray-600">
          Model label: ${raw.label} • Confidence: ${(raw.score * 100).toFixed(1)}%
        </span><br/>
        <span>${message}</span>
    `;
        } catch (err) {
            console.error(err);
            statusEl.textContent =
                "স্ক্যান করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করে কিছুক্ষণ পরে আবার চেষ্টা করুন।";
            resultEl.textContent = "";
        } finally {
            scanButton.disabled = false;
            scanButton.classList.remove("opacity-70", "cursor-not-allowed");
        }
    });
}
