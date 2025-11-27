// modules/quickRegister.js
import { auth, db, fbAuthApi, fbDbApi } from "../src/firebase-config.js";
const { createUserWithEmailAndPassword } = fbAuthApi;
const { doc, setDoc } = fbDbApi;

export function initQuickRegister() {
    console.log("✓ Quick register module loaded");
    
    const registerForm = document.getElementById("registerForm");
    const nameInput = document.getElementById("rname");
    const phoneInput = document.getElementById("rphone");
    const emailInput = document.getElementById("remail");
    const passwordInput = document.getElementById("rpass");
    const prefLangSelect = document.getElementById("prefLang");

    if (!registerForm) {
        console.error("✗ Quick register form not found");
        return;
    }

    console.log("✓ Quick register form found, attaching event listener");

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("✓ Register form submitted");

        const name = nameInput?.value.trim();
        const phone = phoneInput?.value.trim();
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        const language = prefLangSelect?.value || "en";

        console.log("Form data:", { name, phone, email, language });

        // Validation
        if (!name) {
            showQuickRegisterError("Please enter your name");
            return;
        }
        if (!phone) {
            showQuickRegisterError("Please enter your phone number");
            return;
        }
        if (!email) {
            showQuickRegisterError("Please enter your email");
            return;
        }
        if (!password || password.length < 6) {
            showQuickRegisterError("Password must be at least 6 characters");
            return;
        }

        try {
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;
            if (submitBtn) submitBtn.disabled = true;
            if (submitBtn) submitBtn.textContent = "Registering...";

            console.log("Creating Firebase user...");
            // Create Firebase auth user
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const user = cred.user;
            console.log("✓ Firebase user created:", user.uid);

            // Save user data to Firestore
            const createdAt = new Date().toISOString();
            await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                phone,
                language,
                createdAt,
                badges: [],
                division: "",
                district: "",
                upazila: "",
                onboardingCompleted: false
            });

            console.log("✓ User profile saved to Firestore");
            showQuickRegisterSuccess("Account created successfully!");
            resetQuickRegisterForm();

            // Redirect after success
            setTimeout(() => {
                window.location.href = "../app.html";
            }, 1500);

        } catch (err) {
            console.error("Quick register error:", err);
            if (err.code === "auth/email-already-in-use") {
                showQuickRegisterError("Email already registered. Please login instead.");
            } else if (err.code === "auth/invalid-email") {
                showQuickRegisterError("Invalid email format.");
            } else if (err.code === "auth/weak-password") {
                showQuickRegisterError("Password is too weak. Use at least 6 characters.");
            } else {
                showQuickRegisterError(err.message || "Registration failed. Please try again.");
            }
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = false;
            if (submitBtn) submitBtn.textContent = "Register";
        }
    });

    console.log("✓ Quick register module initialized");
}

function showQuickRegisterError(message) {
    console.log("Showing error:", message);
    // Create or update error message
    let errorEl = document.getElementById("quickRegisterError");
    if (!errorEl) {
        errorEl = document.createElement("div");
        errorEl.id = "quickRegisterError";
        const form = document.getElementById("registerForm");
        form?.parentNode?.insertBefore(errorEl, form);
    }
    errorEl.textContent = message;
    errorEl.style.display = "block";
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorEl.style.display = "none";
    }, 5000);
}

function showQuickRegisterSuccess(message) {
    console.log("Showing success:", message);
    // Create or update success message
    let successEl = document.getElementById("quickRegisterSuccess");
    if (!successEl) {
        successEl = document.createElement("div");
        successEl.id = "quickRegisterSuccess";
        const form = document.getElementById("registerForm");
        form?.parentNode?.insertBefore(successEl, form);
    }
    successEl.textContent = message;
    successEl.style.display = "block";
}

function resetQuickRegisterForm() {
    const registerForm = document.getElementById("registerForm");
    registerForm?.reset();
    const errorEl = document.getElementById("quickRegisterError");
    if (errorEl) errorEl.style.display = "none";
}

// Export for manual initialization if needed
export function resetQuickRegister() {
    resetQuickRegisterForm();
}
