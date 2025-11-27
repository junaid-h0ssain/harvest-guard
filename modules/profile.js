// modules/profile.js
import { db, fbDbApi } from "../src/firebase-config.js";
const { doc, getDoc, updateDoc, setDoc } = fbDbApi;

export function initProfile() {
    const profileForm = document.getElementById("profile-form");
    const languageSelect = document.getElementById("language-select");

    profileForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Profile form submitted");
        const user = window.HG.getCurrentUser();
        if (!user) {
            console.error("No current user found!");
            alert("You are not logged in.");
            return;
        }
        console.log("Updating profile for user:", user.uid);
        const name = document.getElementById("edit-name").value.trim();
        const phone = document.getElementById("edit-phone").value.trim();
        const bio = document.getElementById("edit-bio").value.trim();
        const division = document.getElementById("edit-division")?.value || "";
        const district = document.getElementById("edit-district")?.value || "";
        const upazila = document.getElementById("edit-upazila")?.value || "";

        try {
            await setDoc(doc(db, "users", user.uid), {
                name, phone, bio, division, district, upazila, onboardingCompleted: true
            }, { merge: true });
            await loadProfile();
            alert("Profile updated.");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Error updating profile: " + error.message);
        }
    });

    languageSelect?.addEventListener("change", async () => {
        const user = window.HG.getCurrentUser();
        const lang = languageSelect.value;
        localStorage.setItem("hg_lang", lang);
        if (user) {
            try {
                await setDoc(doc(db, "users", user.uid), { language: lang }, { merge: true });
            } catch {
                // ignore
            }
        }
    });

    window.HG_profile = { loadProfile };
}

export async function loadProfile() {
    const user = window.HG.getCurrentUser();
    if (!user) return;
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profilePhone = document.getElementById("profile-phone");
    const profileBio = document.getElementById("profile-bio");
    const profileCreated = document.getElementById("profile-created");

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
        const data = snap.data();
        profileName.textContent = data.name || "";
        profileEmail.textContent = data.email || user.email;
        profilePhone.textContent = data.phone || "";
        profileBio.textContent = data.bio || "";
        profileCreated.textContent = data.createdAt || "";
        document.getElementById("edit-name").value = data.name || "";
        document.getElementById("edit-phone").value = data.phone || "";
        document.getElementById("edit-bio").value = data.bio || "";
        const languageSelect = document.getElementById("language-select");
        if (languageSelect && data.language) languageSelect.value = data.language;
    }
}
