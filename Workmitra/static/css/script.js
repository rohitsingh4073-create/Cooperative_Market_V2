/* ============================================================
   WorkMitra — Shared Frontend JavaScript
   ============================================================ */

"use strict";

/* ============================================================
   GLOBAL HELPERS
   ============================================================ */

const API_BASE = window.location.origin;

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showAlert(message, type = "info", containerId = "alert-container") {
    const container = $(containerId);

    if (!container) {
        alert(message);
        return;
    }

    container.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(message)}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = "";
    }, 4000);
}

function showLoading(containerId, message = "Loading...") {
    const container = $(containerId);

    if (container) {
        container.innerHTML = `
            <div class="loading">
                ${escapeHTML(message)}
            </div>
        `;
    }
}

function formatRating(rating) {
    if (rating === null || rating === undefined) {
        return "No ratings yet";
    }

    return `★ ${Number(rating).toFixed(1)}`;
}

function statusBadge(status) {
    if (!status) {
        return "";
    }

    const normalized = status.toUpperCase();

    let className = "badge-pending";

    if (normalized === "ACCEPTED") {
        className = "badge-accepted";
    } else if (normalized === "COMPLETED") {
        className = "badge-completed";
    } else if (
        normalized === "REJECTED" ||
        normalized === "CANCELLED"
    ) {
        className = "badge-rejected";
    } else if (normalized === "ACTIVE") {
        className = "badge-active";
    }

    return `
        <span class="badge ${className}">
            ${escapeHTML(normalized)}
        </span>
    `;
}

/* ============================================================
   DASHBOARD NAVIGATION
   ============================================================ */

function showSection(sectionId, button = null) {
    document.querySelectorAll(".dashboard-section").forEach(section => {
        section.classList.remove("active");
    });

    const target = $(sectionId);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".sidebar-menu button").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }
}

/* ============================================================
   MODALS
   ============================================================ */

function openModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.add("show");
    }
}

function closeModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.remove("show");
    }
}

document.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
        event.target.classList.remove("show");
    }
});

/* ============================================================
   API REQUEST HELPER
   ============================================================ */

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);

        const contentType = response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const message =
                typeof data === "object" && data.message
                    ? data.message
                    : "Something went wrong.";

            throw new Error(message);
        }

        return data;

    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
}

/* ============================================================
   HOME PAGE — FEATURED ADS
   ============================================================ */

async function loadHomepageAds() {
    const container = $("homepage-ads");

    if (!container) {
        return;
    }

    showLoading("homepage-ads", "Loading featured services...");

    try {
        const data = await apiRequest(
            `${API_BASE}/api/ads/homepage`
        );

        if (!data.success || !data.ads || data.ads.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No featured services yet</h3>
                    <p>Service providers will appear here once they add their services.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.ads.map(ad => {

            const photo = ad.ad_photo
                ? `
                    <img
                        src="/uploads/${encodeURIComponent(ad.ad_photo)}"
                        alt="${escapeHTML(ad.product_name)}"
                    >
                `
                : "";

            return `
                <div class="ad-card">

                    ${photo}

                    <div class="ad-card-body">

                        <div class="worker-skill">
                            ${escapeHTML(ad.primary_skill)}
                        </div>

                        <h3>
                            ${escapeHTML(ad.product_name)}
                        </h3>

                        <p>
                            ${escapeHTML(ad.description || "")}
                        </p>

                        ${
                            ad.product_price
                                ? `
                                    <div class="product-price">
                                        ${escapeHTML(ad.product_price)}
                                    </div>
                                  `
                                : ""
                        }

                        <p style="margin-top:8px;">
                            <strong>
                                ${escapeHTML(ad.shop_name)}
                            </strong>
                        </p>

                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-error">
                Unable to load featured services.
            </div>
        `;
    }
}

/* ============================================================
   IMAGE PREVIEW
   ============================================================ */

function previewImage(input, previewId) {
    const preview = $(previewId);

    if (!preview || !input.files || !input.files[0]) {
        return;
    }

    const file = input.files[0];

    if (!file.type.startsWith("image/")) {
        preview.innerHTML = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        preview.innerHTML = `
            <img
                src="${event.target.result}"
                alt="Preview"
                style="
                    max-width:100%;
                    max-height:250px;
                    border-radius:8px;
                    margin-top:10px;
                "
            >
        `;
    };

    reader.readAsDataURL(file);
}

/* ============================================================
   DATE HELPERS
   ============================================================ */

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function setMinimumDate(inputId) {
    const input = $(inputId);

    if (input) {
        input.min = getTodayDate();
    }
}

/* ============================================================
   SESSION STORAGE
   ============================================================ */

function saveLocalSession(userId, userType, userName) {
    localStorage.setItem(
        "workmitra_session",
        JSON.stringify({
            user_id: userId,
            user_type: userType,
            user_name: userName
        })
    );
}

function getLocalSession() {
    try {
        const value = localStorage.getItem("workmitra_session");

        if (!value) {
            return null;
        }

        return JSON.parse(value);

    } catch {
        return null;
    }
}

function clearLocalSession() {
    localStorage.removeItem("workmitra_session");
}

/* ============================================================
   LOGOUT
   ============================================================ */

function logoutUser() {
    clearLocalSession();
    window.location.href = "/logout";
}

/* ============================================================
   PAGE INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    /*
     * Homepage
     */
    if ($("homepage-ads")) {
        loadHomepageAds();
    }

    /*
     * Date inputs
     */
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.min) {
            input.min = getTodayDate();
        }
    });

});