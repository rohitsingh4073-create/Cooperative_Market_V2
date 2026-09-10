// ============================================================
// BACKEND URL
// ============================================================

const API_URL = "https://cooperative-market-v2.onrender.com";

// ============================================================
// CURRENT LOGGED-IN USER
// ============================================================

let currentUser = null;
let currentUserType = null;

// ============================================================
// PAGE CONTROL
// ============================================================

function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach(function(page) {
        page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");
}

// ============================================================
// MESSAGE HELPER
// ============================================================

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    
    if (type === "success") {
        element.className = "message success-message";
    } else if (type === "error") {
        element.className = "message error-message";
    }
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateMobile(mobile) {
    return mobile.length === 10 && /^\d+$/.test(mobile);
}

function validatePincode(pincode) {
    return pincode.length === 6 && /^\d+$/.test(pincode);
}

// ============================================================
// LOAD HOMEPAGE ADS
// ============================================================

async function loadHomepageAds(adContainerId) {
    try {
        const response = await fetch(API_URL + "/ads/homepage");
        const data = await response.json();

        const container = document.getElementById(adContainerId);
        container.innerHTML = "";

        if (!data.success || data.ads.length === 0) {
            container.innerHTML = "<p>No ads available yet. Be the first to add services!</p>";
            return;
        }

        data.ads.forEach(function(ad) {
            const adCard = document.createElement("div");
            adCard.className = "ad-card";

            let imageHtml = "";
            if (ad.ad_photo) {
                imageHtml = `<div class="ad-image"><img src="${API_URL}/uploads/${ad.ad_photo}" alt="${ad.product_name}"></div>`;
            } else {
                imageHtml = `<div class="ad-image">📷</div>`;
            }

            adCard.innerHTML = `
                ${imageHtml}
                <div class="ad-content">
                    <h4>${ad.product_name}</h4>
                    <p>${ad.description}</p>
                    <div class="ad-price">${ad.product_price || "Contact for price"}</div>
                    <span class="ad-skill">${ad.primary_skill}</span>
                </div>
            `;

            container.appendChild(adCard);
        });

    } catch (error) {
        console.error(error);
    }
}

// ============================================================
// LOGIN
// ============================================================

document.getElementById("loginButton").addEventListener("click", async function() {

    const mobile = document.getElementById("loginMobile").value;
    const password = document.getElementById("loginPassword").value;

    if (!mobile || !password) {
        showMessage("loginMessage", "Please enter mobile number and password.", "error");
        return;
    }

    if (!validateMobile(mobile)) {
        showMessage("loginMessage", "Please enter a valid 10-digit mobile number.", "error");
        return;
    }

    try {

        const response = await fetch(API_URL + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mobile_number: mobile,
                password: password
            })
        });

        const data = await response.json();

        if (!data.success) {
            showMessage("loginMessage", data.message, "error");
            return;
        }

        currentUser = data.user;
        currentUserType = data.user_type;

        if (currentUserType === "customer") {
            document.getElementById("customerWelcome").textContent = currentUser.full_name;
            showPage("customerDashboard");
            loadHomepageAds("customerAds");
        } else if (currentUserType === "worker") {
            document.getElementById("workerWelcome").textContent = currentUser.full_name;
            showPage("workerDashboard");
            loadHomepageAds("workerAds");
        } else if (currentUserType === "shop") {
            document.getElementById("shopWelcome").textContent = currentUser.shop_name;
            showPage("shopDashboard");
            loadHomepageAds("shopAds");
        }

    } catch (error) {
        console.error(error);
        showMessage("loginMessage", "Could not connect to the server.", "error");
    }
});

// ============================================================
// SIGNUP PAGE NAVIGATION
// ============================================================

document.getElementById("customerSignupButton").addEventListener("click", function() {
    showPage("customerSignupPage");
});

document.getElementById("workerSignupButton").addEventListener("click", function() {
    showPage("workerSignupPage");
});

document.getElementById("shopSignupButton").addEventListener("click", function() {
    showPage("shopSignupPage");
});

// ============================================================
// CUSTOMER SIGNUP
// ============================================================

document.getElementById("customerSignupSubmit").addEventListener("click", async function() {

    const data = {
        full_name: document.getElementById("customerName").value,
        password: document.getElementById("customerPassword").value,
        mobile_number: document.getElementById("customerMobile").value,
        email: document.getElementById("customerEmail").value,
        address: document.getElementById("customerAddress").value,
        pincode: document.getElementById("customerPincode").value
    };

    if (!data.full_name || !data.password || !data.mobile_number || !data.address || !data.pincode) {
        showMessage("customerSignupMessage", "Please fill all required fields.", "error");
        return;
    }

    if (!validateMobile(data.mobile_number)) {
        showMessage("customerSignupMessage", "Please enter a valid 10-digit mobile number.", "error");
        return;
    }

    if (!validatePincode(data.pincode)) {
        showMessage("customerSignupMessage", "Please enter a valid 6-digit pincode.", "error");
        return;
    }

    if (data.email && !validateEmail(data.email)) {
        showMessage("customerSignupMessage", "Please enter a valid email address.", "error");
        return;
    }

    try {

        const response = await fetch(API_URL + "/signup/customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage("customerSignupMessage", "Account created successfully. Please login.", "success");
            setTimeout(() => showPage("loginPage"), 1500);
        } else {
            showMessage("customerSignupMessage", result.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("customerSignupMessage", "Could not connect to the server.", "error");
    }
});

// ============================================================
// WORKER SIGNUP
// ============================================================

document.getElementById("workerSignupSubmit").addEventListener("click", async function() {

    const data = {
        full_name: document.getElementById("workerName").value,
        password: document.getElementById("workerPassword").value,
        mobile_number: document.getElementById("workerMobile").value,
        email: document.getElementById("workerEmail").value,
        age: document.getElementById("workerAge").value,
        current_address: document.getElementById("workerAddress").value,
        city: document.getElementById("workerCity").value,
        pincode: document.getElementById("workerPincode").value,
        primary_skill: document.getElementById("workerSkill").value,
        additional_skills: document.getElementById("workerAdditionalSkills").value,
        years_of_experience: document.getElementById("workerExperience").value,
        description: document.getElementById("workerDescription").value,
        preferred_working_hours: document.getElementById("workerHours").value
    };

    if (!data.full_name || !data.password || !data.mobile_number || !data.age || !data.current_address || !data.city || !data.pincode || !data.years_of_experience || !data.primary_skill) {
        showMessage("workerSignupMessage", "Please fill all required fields.", "error");
        return;
    }

    if (!validateMobile(data.mobile_number)) {
        showMessage("workerSignupMessage", "Please enter a valid 10-digit mobile number.", "error");
        return;
    }

    if (!validatePincode(data.pincode)) {
        showMessage("workerSignupMessage", "Please enter a valid 6-digit pincode.", "error");
        return;
    }

    if (isNaN(data.age) || data.age < 18 || data.age > 100) {
        showMessage("workerSignupMessage", "Please enter a valid age.", "error");
        return;
    }

    if (isNaN(data.years_of_experience) || data.years_of_experience < 0) {
        showMessage("workerSignupMessage", "Please enter a valid experience in years.", "error");
        return;
    }

    try {

        const response = await fetch(API_URL + "/signup/worker", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage("workerSignupMessage", "Worker account created successfully. Please login.", "success");
            setTimeout(() => showPage("loginPage"), 1500);
        } else {
            showMessage("workerSignupMessage", result.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("workerSignupMessage", "Could not connect to the server.", "error");
    }
});

// ============================================================
// SHOP SIGNUP
// ============================================================

document.getElementById("shopSignupSubmit").addEventListener("click", async function() {

    const workerListString = document.getElementById("shopWorkerList").value;
    const workerList = workerListString ? workerListString.split(",").map(w => w.trim()) : [];

    const data = {
        shop_name: document.getElementById("shopName").value,
        password: document.getElementById("shopPassword").value,
        mobile_number: document.getElementById("shopMobile").value,
        email: document.getElementById("shopEmail").value,
        primary_skill: document.getElementById("shopSkill").value,
        additional_skills: document.getElementById("shopAdditionalSkills").value,
        address: document.getElementById("shopAddress").value,
        city: document.getElementById("shopCity").value,
        pincode: document.getElementById("shopPincode").value,
        description: document.getElementById("shopDescription").value,
        worker_list: workerList
    };

    if (!data.shop_name || !data.password || !data.mobile_number || !data.primary_skill || !data.address || !data.city || !data.pincode) {
        showMessage("shopSignupMessage", "Please fill all required fields.", "error");
        return;
    }

    if (!validateMobile(data.mobile_number)) {
        showMessage("shopSignupMessage", "Please enter a valid 10-digit mobile number.", "error");
        return;
    }

    if (!validatePincode(data.pincode)) {
        showMessage("shopSignupMessage", "Please enter a valid 6-digit pincode.", "error");
        return;
    }

    try {

        const response = await fetch(API_URL + "/signup/shop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage("shopSignupMessage", "Shop account created successfully. Please login.", "success");
            setTimeout(() => showPage("loginPage"), 1500);
        } else {
            showMessage("shopSignupMessage", result.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("shopSignupMessage", "Could not connect to the server.", "error");
    }
});

// ============================================================
// BACK TO LOGIN
// ============================================================

document.getElementById("customerSignupBack").addEventListener("click", function() {
    showPage("loginPage");
});

document.getElementById("workerSignupBack").addEventListener("click", function() {
    showPage("loginPage");
});

document.getElementById("shopSignupBack").addEventListener("click", function() {
    showPage("loginPage");
});

// ============================================================
// CUSTOMER - FIND WORKER
// ============================================================

document.getElementById("findWorkerButton").addEventListener("click", function() {

    const content = document.getElementById("customerContent");

    content.innerHTML = `
        <h2>🔍 Find a Worker</h2>
        <div class="form-group">
            <label>Select Service</label>
            <select id="serviceSelect">
                <option value="">Select a service</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Painter">Painter</option>
                <option value="Cleaner">Cleaner</option>
                <option value="Driver">Driver</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <button id="searchWorkersButton">Search Workers</button>
        <div id="workerResults" style="margin-top: 30px;"></div>
    `;

    document.getElementById("searchWorkersButton").addEventListener("click", searchWorkers);
});

// ============================================================
// SEARCH WORKERS
// ============================================================

async function searchWorkers() {

    const service = document.getElementById("serviceSelect").value;
    
    if (!service) {
        alert("Please select a service.");
        return;
    }

    const results = document.getElementById("workerResults");
    results.innerHTML = "<p>Searching...</p>";

    try {

        const response = await fetch(API_URL + "/workers?service=" + encodeURIComponent(service));
        const data = await response.json();

        if (!data.success || data.workers.length === 0) {
            results.innerHTML = "<p>No available workers found.</p>";
            return;
        }

        results.innerHTML = "<h3>Available Workers</h3>";

        data.workers.forEach(function(worker) {

            let ratingText = "No ratings yet";

            if (worker.average_rating !== null) {
                ratingText = worker.average_rating + " / 5 (" + worker.number_of_ratings + " ratings)";
            }

            const workerCard = document.createElement("div");
            workerCard.className = "card";

            workerCard.innerHTML = `
                <h3>${worker.full_name}</h3>
                <p><strong>Skill:</strong> ${worker.primary_skill}</p>
                <p><strong>Experience:</strong> ${worker.years_of_experience} years</p>
                <p><strong>About:</strong> ${worker.description}</p>
                <p><strong>Working hours:</strong> ${worker.preferred_working_hours}</p>
                <p><strong>Rating:</strong> ${ratingText}</p>
                <button class="book-button" style="margin-top: 10px;">Book Worker</button>
                <button class="subscribe-button" style="margin-top: 10px; background: #28a745;">Subscribe to Plan</button>
            `;

            const bookButton = workerCard.querySelector(".book-button");
            bookButton.addEventListener("click", function() {
                showBookingForm(worker);
            });

            const subscribeButton = workerCard.querySelector(".subscribe-button");
            subscribeButton.addEventListener("click", function() {
                showSubscriptionPlans(worker);
            });

            results.appendChild(workerCard);
        });

    } catch (error) {
        console.error(error);
        results.innerHTML = "<p>Could not connect to the server.</p>";
    }
}

// ============================================================
// BOOKING FORM
// ============================================================

function showBookingForm(worker) {

    const content = document.getElementById("customerContent");

    content.innerHTML = `
        <h2>📅 Book Worker</h2>
        <div class="profile-info">
            <p><strong>Worker:</strong> ${worker.full_name}</p>
            <p><strong>Service:</strong> ${worker.primary_skill}</p>
        </div>

        <div class="form-group">
            <label>Select Date</label>
            <input type="date" id="bookingDate">
        </div>

        <div class="form-group">
            <label>Upload Problem Photo (Optional)</label>
            <input type="file" id="problemPhoto" accept="image/*">
        </div>

        <button id="confirmBookingButton">Confirm Booking</button>
        <button id="backToWorkersButton" class="secondary-button" style="margin-top: 10px;">Back</button>

        <div id="bookingMessage" class="message" style="margin-top: 15px;"></div>
    `;

    document.getElementById("confirmBookingButton").addEventListener("click", function() {
        createBooking(worker);
    });

    document.getElementById("backToWorkersButton").addEventListener("click", function() {
        document.getElementById("findWorkerButton").click();
    });
}

// ============================================================
// CREATE BOOKING
// ============================================================

async function createBooking(worker) {

    const date = document.getElementById("bookingDate").value;

    if (!date) {
        showMessage("bookingMessage", "Please select a date.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("customer_id", currentUser.customer_id);
    formData.append("worker_id", worker.worker_id);
    formData.append("date", date);

    const fileInput = document.getElementById("problemPhoto");
    if (fileInput.files.length > 0) {
        formData.append("problem_photo", fileInput.files[0]);
    }

    try {

        const response = await fetch(API_URL + "/book", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage("bookingMessage", result.message, "success");
            setTimeout(function() {
                loadCustomerBookings();
            }, 1500);
        } else {
            showMessage("bookingMessage", result.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("bookingMessage", "Could not connect to the server.", "error");
    }
}

// ============================================================
// CUSTOMER BOOKINGS
// ============================================================

document.getElementById("customerBookingsButton").addEventListener("click", loadCustomerBookings);

async function loadCustomerBookings() {

    const content = document.getElementById("customerContent");
    content.innerHTML = "<h2>📅 My Bookings</h2><p>Loading...</p>";

    try {

        const response = await fetch(API_URL + "/bookings/customer/" + currentUser.customer_id);
        const data = await response.json();

        if (data.bookings.length === 0) {
            content.innerHTML = "<h2>📅 My Bookings</h2><p>You have no bookings yet.</p>";
            return;
        }

        content.innerHTML = "<h2>📅 My Bookings</h2>";

        data.bookings.forEach(function(booking) {

            const card = document.createElement("div");
            card.className = "card";

            let buttons = "";

            if (booking.status === "ACCEPTED") {
                buttons += `<button class="complete-button" style="margin-top: 10px;">✓ Service Completed</button>`;
            }

            if (booking.status === "COMPLETED") {
                buttons += `<button class="rating-button" style="margin-top: 10px;">⭐ Give Rating / Review</button>`;
            }

            let problemPhotoHtml = "";
            if (booking.problem_photo) {
                problemPhotoHtml = `<p style="margin-top: 15px;"><strong>Problem Photo:</strong><br><img src="${API_URL}/uploads/${booking.problem_photo}" alt="Problem Photo" style="max-width: 200px; border-radius: 8px; margin-top: 10px;"></p>`;
            }

            card.innerHTML = `
                <h3>Booking ${booking.booking_id}</h3>
                <p><strong>Worker:</strong> ${booking.worker_name || "Unknown"}</p>
                <p><strong>Service:</strong> ${booking.service}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Status:</strong> <span class="card-badge">${booking.status}</span></p>
                ${problemPhotoHtml}
                ${buttons}
            `;

            const completeButton = card.querySelector(".complete-button");
            if (completeButton) {
                completeButton.addEventListener("click", function() {
                    completeBooking(booking.booking_id);
                });
            }

            const ratingButton = card.querySelector(".rating-button");
            if (ratingButton) {
                ratingButton.addEventListener("click", function() {
                    showRatingForm(booking);
                });
            }

            content.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
}

// ============================================================
// COMPLETE SERVICE
// ============================================================

async function completeBooking(bookingId) {

    const response = await fetch(API_URL + "/booking/" + bookingId + "/complete", {
        method: "POST"
    });

    const data = await response.json();
    alert(data.message);

    if (data.success) {
        loadCustomerBookings();
    }
}

// ============================================================
// RATING FORM
// ============================================================

function showRatingForm(booking) {

    const content = document.getElementById("customerContent");

    content.innerHTML = `
        <h2>⭐ Rate Worker</h2>
        <div class="profile-info">
            <p><strong>Worker:</strong> ${booking.worker_name}</p>
        </div>

        <div class="form-group">
            <label>Rating (1 - 5)</label>
            <select id="ratingValue">
                <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                <option value="4">⭐⭐⭐⭐ 4 - Good</option>
                <option value="3">⭐⭐⭐ 3 - Average</option>
                <option value="2">⭐⭐ 2 - Poor</option>
                <option value="1">⭐ 1 - Very Poor</option>
            </select>
        </div>

        <div class="form-group">
            <label>Your Review</label>
            <textarea id="reviewText" rows="4" placeholder="Share your experience..."></textarea>
        </div>

        <button id="submitRatingButton">Submit Rating</button>
        <div id="ratingMessage" class="message" style="margin-top: 15px;"></div>
    `;

    document.getElementById("submitRatingButton").addEventListener("click", function() {
        submitRating(booking);
    });
}

// ============================================================
// SUBMIT RATING
// ============================================================

async function submitRating(booking) {

    const rating = document.getElementById("ratingValue").value;
    const review = document.getElementById("reviewText").value;

    const data = {
        booking_id: booking.booking_id,
        customer_id: currentUser.customer_id,
        rating: rating,
        review: review
    };

    try {

        const response = await fetch(API_URL + "/rating", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage("ratingMessage", result.message, "success");
            setTimeout(function() {
                loadCustomerBookings();
            }, 1500);
        } else {
            showMessage("ratingMessage", result.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("ratingMessage", "Could not connect to the server.", "error");
    }
}

// ============================================================
// CUSTOMER SUBSCRIPTIONS
// ============================================================

document.getElementById("customerSubscriptionsButton").addEventListener("click", loadCustomerSubscriptions);

async function loadCustomerSubscriptions() {

    const content = document.getElementById("customerContent");
    content.innerHTML = "<h2>🎯 My Subscriptions</h2><p>Loading...</p>";

    try {

        const response = await fetch(API_URL + "/subscriptions/customer/" + currentUser.customer_id);
        const data = await response.json();

        if (data.subscriptions.length === 0) {
            content.innerHTML = "<h2>🎯 My Subscriptions</h2><p>You have no active subscriptions.</p>";
            return;
        }

        content.innerHTML = "<h2>🎯 My Subscriptions</h2>";

        data.subscriptions.forEach(function(sub) {

            const card = document.createElement("div");
            card.className = "card";

            let cancelButton = "";
            if (sub.status === "ACTIVE") {
                cancelButton = `<button class="cancel-button" style="margin-top: 10px; background: #dc3545;">Cancel Subscription</button>`;
            }

            card.innerHTML = `
                <h3>${sub.plan_name}</h3>
                <p><strong>Provider:</strong> ${sub.worker_name}</p>
                <p><strong>Description:</strong> ${sub.plan_description}</p>
                <p><strong>Price:</strong> ${sub.plan_price}</p>
                <p><strong>Duration:</strong> ${sub.plan_duration}</p>
                <p><strong>Status:</strong> <span class="card-badge">${sub.status}</span></p>
                <p><strong>Start Date:</strong> ${sub.start_date}</p>
                <p><strong>End Date:</strong> ${sub.end_date}</p>
                ${cancelButton}
            `;

            const cancelBtn = card.querySelector(".cancel-button");
            if (cancelBtn) {
                cancelBtn.addEventListener("click", function() {
                    cancelSubscription(sub.subscription_id);
                });
            }

            content.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
}

// ============================================================
// CANCEL SUBSCRIPTION
// ============================================================

async function cancelSubscription(subscriptionId) {

    if (!confirm("Are you sure you want to cancel this subscription?")) {
        return;
    }

    try {

        const response = await fetch(API_URL + "/subscription/" + subscriptionId + "/cancel", {
            method: "POST"
        });

        const data = await response.json();
        alert(data.message);

        if (data.success) {
            loadCustomerSubscriptions();
        }

    } catch (error) {
        console.error(error);
        alert("Could not connect to the server.");
    }
}

// ============================================================
// SHOW SUBSCRIPTION PLANS
// ============================================================

function showSubscriptionPlans(worker) {

    const content = document.getElementById("customerContent");
    content.innerHTML = "<h2>🎯 Subscription Plans</h2><p>Loading plans...</p>";

    fetchSubscriptionPlans(worker.worker_id, function(plans) {

        content.innerHTML = `
            <h2>🎯 Subscription Plans from ${worker.full_name}</h2>
            <div class="plan-grid" id="plansContainer"></div>
        `;

        const plansContainer = document.getElementById("plansContainer");

        plans.forEach(function(plan) {

            const planCard = document.createElement("div");
            planCard.className = "plan-card";

            planCard.innerHTML = `
                <h3>${plan.plan_name}</h3>
                <p>${plan.plan_description}</p>
                <div class="plan-price">${plan.plan_price}</div>
                <p><strong>Duration:</strong> ${plan.plan_duration}</p>
                <button class="subscribe-plan-button">Subscribe Now</button>
            `;

            const subscribeBtn = planCard.querySelector(".subscribe-plan-button");
            subscribeBtn.addEventListener("click", function() {
                subscribeToplan(worker.worker_id, plan);
            });

            plansContainer.appendChild(planCard);
        });
    });
}

// ============================================================
// FETCH SUBSCRIPTION PLANS
// ============================================================

async function fetchSubscriptionPlans(workerId, callback) {

    try {

        const response = await fetch(API_URL + "/subscription-plans/" + workerId);
        const data = await response.json();

        if (data.success) {
            callback(data.plans);
        }

    } catch (error) {
        console.error(error);
    }
}

// ============================================================
// SUBSCRIBE TO PLAN
// ============================================================

async function subscribeToplan(workerId, plan) {

    const data = {
        customer_id: currentUser.customer_id,
        worker_id: workerId,
        plan_name: plan.plan_name,
        plan_description: plan.plan_description,
        plan_price: plan.plan_price,
        plan_duration: plan.plan_duration
    };

    try {

        const response = await fetch(API_URL + "/subscription/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            loadCustomerSubscriptions();
        } else {
            alert(result.message);
        }

    } catch (error) {
        console.error(error);
        alert("Could not connect to the server.");
    }
}

// ============================================================
// CUSTOMER PROFILE
// ============================================================

document.getElementById("customerProfileButton").addEventListener("click", function() {

    const content = document.getElementById("customerContent");

    content.innerHTML = `
        <h2>👤 My Profile</h2>
        <div class="profile-info">
            <p><strong>Name:</strong> ${currentUser.full_name}</p>
            <p><strong>Mobile:</strong> ${currentUser.mobile_number}</p>
            <p><strong>Email:</strong> ${currentUser.email || "Not provided"}</p>
            <p><strong>Address:</strong> ${currentUser.address}</p>
            <p><strong>Pincode:</strong> ${currentUser.pincode}</p>
        </div>
    `;
});

// ============================================================
// WORKER PROFILE
// ============================================================

document.getElementById("workerProfileButton").addEventListener("click", function() {

    const content = document.getElementById("workerContent");

    content.innerHTML = `
        <h2>👤 My Profile</h2>
        <div class="profile-info">
            <p><strong>Name:</strong> ${currentUser.full_name}</p>
            <p><strong>Mobile:</strong> ${currentUser.mobile_number}</p>
            <p><strong>Email:</strong> ${currentUser.email || "Not provided"}</p>
            <p><strong>Age:</strong> ${currentUser.age}</p>
            <p><strong>Address:</strong> ${currentUser.current_address}</p>
            <p><strong>City:</strong> ${currentUser.city}</p>
            <p><strong>Pincode:</strong> ${currentUser.pincode}</p>
            <p><strong>Primary Skill:</strong> ${currentUser.primary_skill}</p>
            <p><strong>Additional Skills:</strong> ${currentUser.additional_skills}</p>
            <p><strong>Experience:</strong> ${currentUser.years_of_experience} years</p>
            <p><strong>About:</strong> ${currentUser.description}</p>
            <p><strong>Preferred Working Hours:</strong> ${currentUser.preferred_working_hours}</p>
        </div>
    `;
});

// ============================================================
// SHOP PROFILE
// ============================================================

document.getElementById("shopProfileButton").addEventListener("click", function() {

    const content = document.getElementById("shopContent");

    content.innerHTML = `
        <h2>👤 My Shop Profile</h2>
        <div class="profile-info">
            <p><strong>Shop Name:</strong> ${currentUser.shop_name}</p>
            <p><strong>Mobile:</strong> ${currentUser.mobile_number}</p>
            <p><strong>Email:</strong> ${currentUser.email || "Not provided"}</p>
            <p><strong>Primary Skill:</strong> ${currentUser.primary_skill}</p>
            <p><strong>Additional Skills:</strong> ${currentUser.additional_skills}</p>
            <p><strong>Address:</strong> ${currentUser.current_address}</p>
            <p><strong>City:</strong> ${currentUser.city}</p>
            <p><strong>Pincode:</strong> ${currentUser.pincode}</p>
            <p><strong>About:</strong> ${currentUser.description}</p>
            <p><strong>Workers:</strong> ${currentUser.worker_list.join(", ") || "None listed"}</p>
        </div>
    `;
});

// ============================================================
// WORKER BOOKINGS
// ============================================================

document.getElementById("workerBookingsButton").addEventListener("click", loadWorkerBookings);

async function loadWorkerBookings() {

    const content = document.getElementById("workerContent");
    content.innerHTML = "<h2>📅 My Bookings</h2><p>Loading...</p>";

    try {

        const response = await fetch(API_URL + "/bookings/worker/" + currentUser.worker_id);
        const data = await response.json();

        if (data.bookings.length === 0) {
            content.innerHTML = "<h2>📅 My Bookings</h2><p>You have no bookings.</p>";
            return;
        }

        content.innerHTML = "<h2>📅 My Bookings</h2>";

        data.bookings.forEach(function(booking) {

            const card = document.createElement("div");
            card.className = "card";

            let buttons = "";

            if (booking.status === "PENDING") {
                buttons = `
                    <button class="accept-button" style="margin-top: 10px;">✓ Accept</button>
                    <button class="reject-button" style="margin-top: 10px; background: #dc3545;">✗ Reject</button>
                `;
            }

            let problemPhotoHtml = "";
            if (booking.problem_photo) {
                problemPhotoHtml = `<p style="margin-top: 15px;"><strong>Customer Problem Photo:</strong><br><img src="${API_URL}/uploads/${booking.problem_photo}" alt="Problem Photo" style="max-width: 200px; border-radius: 8px; margin-top: 10px;"></p>`;
            }

            card.innerHTML = `
                <h3>Booking ${booking.booking_id}</h3>
                <p><strong>Customer:</strong> ${booking.customer_name || "Unknown"}</p>
                <p><strong>Service:</strong> ${booking.service}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Status:</strong> <span class="card-badge">${booking.status}</span></p>
                ${problemPhotoHtml}
                ${buttons}
            `;

            const acceptButton = card.querySelector(".accept-button");
            if (acceptButton) {
                acceptButton.addEventListener("click", function() {
                    updateBookingStatus(booking.booking_id, "accept");
                });
            }

            const rejectButton = card.querySelector(".reject-button");
            if (rejectButton) {
                rejectButton.addEventListener("click", function() {
                    updateBookingStatus(booking.booking_id, "reject");
                });
            }

            content.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
}

// ============================================================
// SHOP BOOKINGS
// ============================================================

document.getElementById("shopBookingsButton").addEventListener("click", loadShopBookings);

async function loadShopBookings() {

    const content = document.getElementById("shopContent");
    content.innerHTML = "<h2>📅 My Bookings</h2><p>Loading...</p>";

    try {

        const response = await fetch(API_URL + "/bookings/worker/" + currentUser.worker_id);
        const data = await response.json();

        if (data.bookings.length === 0) {
            content.innerHTML = "<h2>📅 My Bookings</h2><p>You have no bookings.</p>";
            return;
        }

        content.innerHTML = "<h2>📅 My Bookings</h2>";

        data.bookings.forEach(function(booking) {

            const card = document.createElement("div");
            card.className = "card";

            let buttons = "";

            if (booking.status === "PENDING") {
                buttons = `
                    <button class="accept-button" style="margin-top: 10px;">✓ Accept</button>
                    <button class="reject-button" style="margin-top: 10px; background: #dc3545;">✗ Reject</button>
                `;
            }

            let problemPhotoHtml = "";
            if (booking.problem_photo) {
                problemPhotoHtml = `<p style="margin-top: 15px;"><strong>Customer Problem Photo:</strong><br><img src="${API_URL}/uploads/${booking.problem_photo}" alt="Problem Photo" style="max-width: 200px; border-radius: 8px; margin-top: 10px;"></p>`;
            }

            card.innerHTML = `
                <h3>Booking ${booking.booking_id}</h3>
                <p><strong>Customer:</strong> ${booking.customer_name || "Unknown"}</p>
                <p><strong>Service:</strong> ${booking.service}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Status:</strong> <span class="card-badge">${booking.status}</span></p>
                ${problemPhotoHtml}
                ${buttons}
            `;

            const acceptButton = card.querySelector(".accept-button");
            if (acceptButton) {
                acceptButton.addEventListener("click", function() {
                    updateBookingStatus(booking.booking_id, "accept");
                });
            }

            const rejectButton = card.querySelector(".reject-button");
            if (rejectButton) {
                rejectButton.addEventListener("click", function() {
                    updateBookingStatus(booking.booking_id, "reject");
                });
            }

            content.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
}

// ============================================================
// ACCEPT / REJECT BOOKING
// ============================================================

async function updateBookingStatus(bookingId, action) {

    try {

        const response = await fetch(API_URL + "/booking/" + bookingId + "/" + action, {
            method: "POST"
        });

        const data = await response.json();
        alert(data.message);

        if (data.success) {
            loadWorkerBookings();
        }

    } catch (error) {
        console.error(error);
        alert("Could not connect to the server.");
    }
}

// ============================================================
// WORKER AVAILABILITY
// ============================================================

document.getElementById("availabilityButton").addEventListener("click", function() {

    const content = document.getElementById("workerContent");
    const status = currentUser.available ? "✅ Available" : "❌ Unavailable";

    content.innerHTML = `
        <h2>✅ Availability</h2>
        <div class="profile-info">
            <p><strong>Current Status:</strong> ${status}</p>
        </div>
        <button id="toggleAvailabilityButton">Change Availability</button>
        <div id="availabilityMessage" class="message" style="margin-top: 15px;"></div>
    `;

    document.getElementById("toggleAvailabilityButton").addEventListener("click", toggleAvailability);
});

// ============================================================
// SHOP AVAILABILITY
// ============================================================

document.getElementById("shopAvailabilityButton").addEventListener("click", function() {

    const content = document.getElementById("shopContent");
    const status = currentUser.available ? "✅ Available" : "❌ Unavailable";

    content.innerHTML = `
        <h2>✅ Availability</h2>
        <div class="profile-info">
            <p><strong>Current Status:</strong> ${status}</p>
        </div>
        <button id="shopToggleAvailabilityButton">Change Availability</button>
        <div id="shopAvailabilityMessage" class="message" style="margin-top: 15px;"></div>
    `;

    document.getElementById("shopToggleAvailabilityButton").addEventListener("click", toggleShopAvailability);
});

// ============================================================
// TOGGLE AVAILABILITY
// ============================================================

async function toggleAvailability() {

    const newStatus = !currentUser.available;

    try {

        const response = await fetch(API_URL + "/worker/" + currentUser.worker_id + "/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ available: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            currentUser.available = data.available;
            const status = currentUser.available ? "✅ Available" : "❌ Unavailable";
            showMessage("availabilityMessage", "You are now " + status + ".", "success");
        } else {
            showMessage("availabilityMessage", data.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("availabilityMessage", "Could not connect to the server.", "error");
    }
}

// ============================================================
// TOGGLE SHOP AVAILABILITY
// ============================================================

async function toggleShopAvailability() {

    const newStatus = !currentUser.available;

    try {

        const response = await fetch(API_URL + "/worker/" + currentUser.worker_id + "/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ available: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            currentUser.available = data.available;
            const status = currentUser.available ? "✅ Available" : "❌ Unavailable";
            showMessage("shopAvailabilityMessage", "Your shop is now " + status + ".", "success");
        } else {
            showMessage("shopAvailabilityMessage", data.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("shopAvailabilityMessage", "Could not connect to the server.", "error");
    }
}

// ============================================================
// WORKER EARNINGS
// ============================================================

document.getElementById("earningsButton").addEventListener("click", async function() {

    const content = document.getElementById("workerContent");

    try {

        const response = await fetch(API_URL + "/worker/" + currentUser.worker_id + "/earnings");
        const data = await response.json();

        content.innerHTML = `
            <h2>💰 Earnings</h2>
            <div class="profile-info">
                <p><strong>Completed Jobs:</strong> ${data.completed_jobs}</p>
                <p><strong>Total Earnings:</strong> ₹${data.earnings}</p>
                <p><em>${data.message}</em></p>
            </div>
        `;

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
});

// ============================================================
// SHOP EARNINGS
// ============================================================

document.getElementById("shopEarningsButton").addEventListener("click", async function() {

    const content = document.getElementById("shopContent");

    try {

        const response = await fetch(API_URL + "/worker/" + currentUser.worker_id + "/earnings");
        const data = await response.json();

        content.innerHTML = `
            <h2>💰 Earnings</h2>
            <div class="profile-info">
                <p><strong>Completed Jobs:</strong> ${data.completed_jobs}</p>
                <p><strong>Total Earnings:</strong> ₹${data.earnings}</p>
                <p><em>${data.message}</em></p>
            </div>
        `;

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
});

// ============================================================
// WORKER PORTFOLIO
// ============================================================

document.getElementById("workerPortfolioButton").addEventListener("click", function() {

    const content = document.getElementById("workerContent");

    content.innerHTML = `
        <h2>🎨 My Portfolio</h2>

        <div class="form-group">
            <label>Upload Work Photo</label>
            <input type="file" id="portfolioFileInput" accept="image/*">
        </div>

        <button id="uploadPortfolioButton">Upload Photo</button>
        <div id="portfolioUploadMessage" class="message" style="margin-top: 15px;"></div>

        <div id="portfolioPhotosContainer" style="margin-top: 30px;"></div>
    `;

    document.getElementById("uploadPortfolioButton").addEventListener("click", uploadPortfolioPhoto);
    loadPortfolioPhotos();
});

async function uploadPortfolioPhoto() {

    const fileInput = document.getElementById("portfolioFileInput");

    if (fileInput.files.length === 0) {
        showMessage("portfolioUploadMessage", "Please select a file.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("worker_id", currentUser.worker_id);
    formData.append("portfolio_photo", fileInput.files[0]);

    try {

        const response = await fetch(API_URL + "/upload/portfolio", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showMessage("portfolioUploadMessage", data.message, "success");
            fileInput.value = "";
            setTimeout(loadPortfolioPhotos, 1000);
        } else {
            showMessage("portfolioUploadMessage", data.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("portfolioUploadMessage", "Could not connect to the server.", "error");
    }
}

async function loadPortfolioPhotos() {

    try {

        const response = await fetch(API_URL + "/portfolio/" + currentUser.worker_id);
        const data = await response.json();

        const container = document.getElementById("portfolioPhotosContainer");
        container.innerHTML = "<h3>📸 Your Portfolio Photos</h3>";

        if (data.photos.length === 0) {
            container.innerHTML += "<p>No photos uploaded yet.</p>";
            return;
        }

        const imageGrid = document.createElement("div");
        imageGrid.className = "image-grid";

        data.photos.forEach(function(photo) {
            const imageItem = document.createElement("div");
            imageItem.className = "image-item";
            const img = document.createElement("img");
            img.src = API_URL + "/uploads/" + photo;
            imageItem.appendChild(img);
            imageGrid.appendChild(imageItem);
        });

        container.appendChild(imageGrid);

    } catch (error) {
        console.error(error);
    }
}

// ============================================================
// SHOP PORTFOLIO
// ============================================================

document.getElementById("shopPortfolioButton").addEventListener("click", function() {

    const content = document.getElementById("shopContent");

    content.innerHTML = `
        <h2>🎨 My Shop Portfolio</h2>

        <div class="form-group">
            <label>Upload Work Photo</label>
            <input type="file" id="shopPortfolioFileInput" accept="image/*">
        </div>

        <button id="shopUploadPortfolioButton">Upload Photo</button>
        <div id="shopPortfolioUploadMessage" class="message" style="margin-top: 15px;"></div>

        <div id="shopPortfolioPhotosContainer" style="margin-top: 30px;"></div>
    `;

    document.getElementById("shopUploadPortfolioButton").addEventListener("click", uploadShopPortfolioPhoto);
    loadShopPortfolioPhotos();
});

async function uploadShopPortfolioPhoto() {

    const fileInput = document.getElementById("shopPortfolioFileInput");

    if (fileInput.files.length === 0) {
        showMessage("shopPortfolioUploadMessage", "Please select a file.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("worker_id", currentUser.worker_id);
    formData.append("portfolio_photo", fileInput.files[0]);

    try {

        const response = await fetch(API_URL + "/upload/portfolio", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showMessage("shopPortfolioUploadMessage", data.message, "success");
            fileInput.value = "";
            setTimeout(loadShopPortfolioPhotos, 1000);
        } else {
            showMessage("shopPortfolioUploadMessage", data.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("shopPortfolioUploadMessage", "Could not connect to the server.", "error");
    }
}

async function loadShopPortfolioPhotos() {

    try {

        const response = await fetch(API_URL + "/portfolio/" + currentUser.worker_id);
        const data = await response.json();

        const container = document.getElementById("shopPortfolioPhotosContainer");
        container.innerHTML = "<h3>📸 Your Shop Portfolio Photos</h3>";

        if (data.photos.length === 0) {
            container.innerHTML += "<p>No photos uploaded yet.</p>";
            return;
        }

        const imageGrid = document.createElement("div");
        imageGrid.className = "image-grid";

        data.photos.forEach(function(photo) {
            const imageItem = document.createElement("div");
            imageItem.className = "image-item";
            const img = document.createElement("img");
            img.src = API_URL + "/uploads/" + photo;
            imageItem.appendChild(img);
            imageGrid.appendChild(imageItem);
        });

        container.appendChild(imageGrid);

    } catch (error) {
        console.error(error);
    }
}

// ============================================================
// WORKER PRODUCTS/SERVICES
// ============================================================

document.getElementById("workerProductsButton").addEventListener("click", function() {

    const content = document.getElementById("workerContent");

    content.innerHTML = `
        <h2>📦 My Products/Services</h2>

        <h3>Add New Product/Service</h3>

        <div class="form-group">
            <label>Product/Service Name</label>
            <input type="text" id="productName" placeholder="e.g., Plumbing Repair">
        </div>

        <div class="form-group">
            <label>Description</label>
            <textarea id="productDescription" rows="3" placeholder="Describe your product or service..."></textarea>
        </div>

        <div class="form-group">
            <label>Price (Optional)</label>
            <input type="text" id="productPrice" placeholder="e.g., ₹500/hour">
        </div>

        <div class="form-group">
            <label>Product Photo (Optional)</label>
            <input type="file" id="productPhotoInput" accept="image/*">
        </div>

        <button id="addProductButton">Add Product/Service</button>
        <div id="productAddMessage" class="message" style="margin-top: 15px;"></div>

        <div id="productsContainer" style="margin-top: 30px;"></div>
    `;

    document.getElementById("addProductButton").addEventListener("click", addProduct);
    loadProducts();
});

async function addProduct() {

    const productName = document.getElementById("productName").value;
    const productDescription = document.getElementById("productDescription").value;
    const productPrice = document.getElementById("productPrice").value;

    if (!productName) {
        showMessage("productAddMessage", "Product name is required.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("worker_id", currentUser.worker_id);
    formData.append("product_name", productName);
    formData.append("product_description", productDescription);
    formData.append("product_price", productPrice);

    const fileInput = document.getElementById("productPhotoInput");
    if (fileInput.files.length > 0) {
        formData.append("product_photo", fileInput.files[0]);
    }

    try {

        const response = await fetch(API_URL + "/product/add", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showMessage("productAddMessage", data.message, "success");
            document.getElementById("productName").value = "";
            document.getElementById("productDescription").value = "";
            document.getElementById("productPrice").value = "";
            fileInput.value = "";
            setTimeout(loadProducts, 1000);
        } else {
            showMessage("productAddMessage", data.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("productAddMessage", "Could not connect to the server.", "error");
    }
}

async function loadProducts() {

    try {

        const response = await fetch(API_URL + "/products/" + currentUser.worker_id);
        const data = await response.json();

        const container = document.getElementById("productsContainer");
        container.innerHTML = "<h3>📦 Your Products/Services</h3>";

        if (data.products.length === 0) {
            container.innerHTML += "<p>No products added yet.</p>";
            return;
        }

        data.products.forEach(function(product) {

            const card = document.createElement("div");
            card.className = "card";

            let photoHtml = "";
            if (product.product_photo) {
                photoHtml = `<img src="${API_URL}/uploads/${product.product_photo}" alt="${product.product_name}" style="max-width: 200px; border-radius: 8px; margin-top: 10px;">`;
            }

            card.innerHTML = `
                <h4>${product.product_name}</h4>
                <p>${product.product_description}</p>
                <p><strong>Price:</strong> ${product.product_price || "Contact for price"}</p>
                ${photoHtml}
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error(error);
    }
}

// ============================================================
// SHOP PRODUCTS/SERVICES
// ============================================================

document.getElementById("shopProductsButton").addEventListener("click", function() {

    const content = document.getElementById("shopContent");

    content.innerHTML = `
        <h2>📦 My Shop Products/Services</h2>

        <h3>Add New Product/Service</h3>

        <div class="form-group">
            <label>Product/Service Name</label>
            <input type="text" id="shopProductName" placeholder="e.g., Plumbing Repair">
        </div>

        <div class="form-group">
            <label>Description</label>
            <textarea id="shopProductDescription" rows="3" placeholder="Describe your product or service..."></textarea>
        </div>

        <div class="form-group">
            <label>Price (Optional)</label>
            <input type="text" id="shopProductPrice" placeholder="e.g., ₹500/hour">
        </div>

        <div class="form-group">
            <label>Product Photo (Optional)</label>
            <input type="file" id="shopProductPhotoInput" accept="image/*">
        </div>

        <button id="shopAddProductButton">Add Product/Service</button>
        <div id="shopProductAddMessage" class="message" style="margin-top: 15px;"></div>

        <div id="shopProductsContainer" style="margin-top: 30px;"></div>
    `;

    document.getElementById("shopAddProductButton").addEventListener("click", addShopProduct);
    loadShopProducts();
});

async function addShopProduct() {

    const productName = document.getElementById("shopProductName").value;
    const productDescription = document.getElementById("shopProductDescription").value;
    const productPrice = document.getElementById("shopProductPrice").value;

    if (!productName) {
        showMessage("shopProductAddMessage", "Product name is required.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("worker_id", currentUser.worker_id);
    formData.append("product_name", productName);
    formData.append("product_description", productDescription);
    formData.append("product_price", productPrice);

    const fileInput = document.getElementById("shopProductPhotoInput");
    if (fileInput.files.length > 0) {
        formData.append("product_photo", fileInput.files[0]);
    }

    try {

        const response = await fetch(API_URL + "/product/add", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showMessage("shopProductAddMessage", data.message, "success");
            document.getElementById("shopProductName").value = "";
            document.getElementById("shopProductDescription").value = "";
            document.getElementById("shopProductPrice").value = "";
            fileInput.value = "";
            setTimeout(loadShopProducts, 1000);
        } else {
            showMessage("shopProductAddMessage", data.message, "error");
        }

    } catch (error) {
        console.error(error);
        showMessage("shopProductAddMessage", "Could not connect to the server.", "error");
    }
}

async function loadShopProducts() {

    try {

        const response = await fetch(API_URL + "/products/" + currentUser.worker_id);
        const data = await response.json();

        const container = document.getElementById("shopProductsContainer");
        container.innerHTML = "<h3>📦 Your Shop Products/Services</h3>";

        if (data.products.length === 0) {
            container.innerHTML += "<p>No products added yet.</p>";
            return;
        }

        data.products.forEach(function(product) {

            const card = document.createElement("div");
            card.className = "card";

            let photoHtml = "";
            if (product.product_photo) {
                photoHtml = `<img src="${API_URL}/uploads/${product.product_photo}" alt="${product.product_name}" style="max-width: 200px; border-radius: 8px; margin-top: 10px;">`;
            }

            card.innerHTML = `
                <h4>${product.product_name}</h4>
                <p>${product.product_description}</p>
                <p><strong>Price:</strong> ${product.product_price || "Contact for price"}</p>
                ${photoHtml}
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error(error);
    }
}

// ============================================================
// WORKER SUBSCRIPTIONS
// ============================================================

document.getElementById("workerSubscriptionsButton").addEventListener("click", loadWorkerSubscriptions);

async function loadWorkerSubscriptions() {

    const content = document.getElementById("workerContent");
    content.innerHTML = "<h2>🎯 My Subscriptions</h2><p>Loading...</p>";

    try {

        const response = await fetch(API_URL + "/subscriptions/worker/" + currentUser.worker_id);
        const data = await response.json();

        if (data.subscriptions.length === 0) {
            content.innerHTML = "<h2>🎯 My Subscriptions</h2><p>You have no active subscriptions.</p>";
            return;
        }

        content.innerHTML = "<h2>🎯 Subscriptions from Customers</h2>";

        data.subscriptions.forEach(function(sub) {

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <h3>${sub.plan_name}</h3>
                <p><strong>Customer:</strong> ${sub.customer_name}</p>
                <p><strong>Description:</strong> ${sub.plan_description}</p>
                <p><strong>Price:</strong> ${sub.plan_price}</p>
                <p><strong>Duration:</strong> ${sub.plan_duration}</p>
                <p><strong>Status:</strong> <span class="card-badge">${sub.status}</span></p>
                <p><strong>Start Date:</strong> ${sub.start_date}</p>
                <p><strong>End Date:</strong> ${sub.end_date}</p>
            `;

            content.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
}

// ============================================================
// SHOP SUBSCRIPTIONS
// ============================================================

document.getElementById("shopSubscriptionsButton").addEventListener("click", loadShopSubscriptions);

async function loadShopSubscriptions() {

    const content = document.getElementById("shopContent");
    content.innerHTML = "<h2>🎯 My Subscriptions</h2><p>Loading...</p>";

    try {

        const response = await fetch(API_URL + "/subscriptions/worker/" + currentUser.worker_id);
        const data = await response.json();

        if (data.subscriptions.length === 0) {
            content.innerHTML = "<h2>🎯 My Subscriptions</h2><p>You have no active subscriptions.</p>";
            return;
        }

        content.innerHTML = "<h2>🎯 Subscriptions from Customers</h2>";

        data.subscriptions.forEach(function(sub) {

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <h3>${sub.plan_name}</h3>
                <p><strong>Customer:</strong> ${sub.customer_name}</p>
                <p><strong>Description:</strong> ${sub.plan_description}</p>
                <p><strong>Price:</strong> ${sub.plan_price}</p>
                <p><strong>Duration:</strong> ${sub.plan_duration}</p>
                <p><strong>Status:</strong> <span class="card-badge">${sub.status}</span></p>
                <p><strong>Start Date:</strong> ${sub.start_date}</p>
                <p><strong>End Date:</strong> ${sub.end_date}</p>
            `;

            content.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Could not connect to the server.</p>";
    }
}

// ============================================================
// LOGOUT
// ============================================================

document.getElementById("customerLogoutButton").addEventListener("click", logout);
document.getElementById("workerLogoutButton").addEventListener("click", logout);
document.getElementById("shopLogoutButton").addEventListener("click", logout);

function logout() {

    currentUser = null;
    currentUserType = null;

    document.getElementById("loginMobile").value = "";
    document.getElementById("loginPassword").value = "";

    showPage("loginPage");
}
