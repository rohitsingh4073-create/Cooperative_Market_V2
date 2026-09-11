import os
import random
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    redirect,
    url_for,
    session,
    send_from_directory
)
from flask_cors import CORS

# ============================================================
# CLASSES
# ============================================================

class Customer:
    def __init__(self, customer_id, full_name, password, mobile_number, email, address, pincode):
        self.customer_id = customer_id
        self.full_name = full_name
        self.password = password
        self.mobile_number = mobile_number
        self.email = email
        self.address = address
        self.pincode = pincode

    def to_dict(self):
        return {
            "customer_id": self.customer_id,
            "full_name": self.full_name,
            "password": self.password,
            "mobile_number": self.mobile_number,
            "email": self.email,
            "address": self.address,
            "pincode": self.pincode
        }

class Worker:
    def __init__(self, worker_id, full_name, password, mobile_number, email, age, current_address, city, pincode, primary_skill, additional_skills, years_of_experience, description, available, preferred_working_hours, is_shop=False, shop_name="", worker_list=None):
        self.worker_id = worker_id
        self.full_name = full_name
        self.password = password
        self.mobile_number = mobile_number
        self.email = email
        self.age = age
        self.current_address = current_address
        self.city = city
        self.pincode = pincode
        self.primary_skill = primary_skill
        self.additional_skills = additional_skills
        self.years_of_experience = years_of_experience
        self.description = description
        self.available = available
        self.preferred_working_hours = preferred_working_hours
        self.is_shop = is_shop
        self.shop_name = shop_name
        self.worker_list = worker_list if worker_list else []
        self.portfolio_photos = []
        self.products_services = []

    def to_dict(self):
        return {
            "worker_id": self.worker_id,
            "full_name": self.full_name,
            "password": self.password,
            "mobile_number": self.mobile_number,
            "email": self.email,
            "age": self.age,
            "current_address": self.current_address,
            "city": self.city,
            "pincode": self.pincode,
            "primary_skill": self.primary_skill,
            "additional_skills": self.additional_skills,
            "years_of_experience": self.years_of_experience,
            "description": self.description,
            "available": self.available,
            "preferred_working_hours": self.preferred_working_hours,
            "is_shop": self.is_shop,
            "shop_name": self.shop_name,
            "worker_list": self.worker_list,
            "portfolio_photos": self.portfolio_photos,
            "products_services": self.products_services
        }

class Booking:
    def __init__(self, booking_id, customer_id, worker_id, service, date, status, problem_photo=""):
        self.booking_id = booking_id
        self.customer_id = customer_id
        self.worker_id = worker_id
        self.service = service
        self.date = date
        self.status = status
        self.problem_photo = problem_photo

    def to_dict(self):
        return {
            "booking_id": self.booking_id,
            "customer_id": self.customer_id,
            "worker_id": self.worker_id,
            "service": self.service,
            "date": self.date,
            "status": self.status,
            "problem_photo": self.problem_photo
        }

class Rating:
    def __init__(self, rating_id, booking_id, customer_id, worker_id, rating, review):
        self.rating_id = rating_id
        self.booking_id = booking_id
        self.customer_id = customer_id
        self.worker_id = worker_id
        self.rating = rating
        self.review = review

    def to_dict(self):
        return {
            "rating_id": self.rating_id,
            "booking_id": self.booking_id,
            "customer_id": self.customer_id,
            "worker_id": self.worker_id,
            "rating": self.rating,
            "review": self.review
        }

class Subscription:
    def __init__(self, subscription_id, worker_id, customer_id, plan_name, plan_description, plan_price, plan_duration, status, start_date, end_date):
        self.subscription_id = subscription_id
        self.worker_id = worker_id
        self.customer_id = customer_id
        self.plan_name = plan_name
        self.plan_description = plan_description
        self.plan_price = plan_price
        self.plan_duration = plan_duration
        self.status = status
        self.start_date = start_date
        self.end_date = end_date

    def to_dict(self):
        return {
            "subscription_id": self.subscription_id,
            "worker_id": self.worker_id,
            "customer_id": self.customer_id,
            "plan_name": self.plan_name,
            "plan_description": self.plan_description,
            "plan_price": self.plan_price,
            "plan_duration": self.plan_duration,
            "status": self.status,
            "start_date": self.start_date,
            "end_date": self.end_date
        }

class Advertisement:
    def __init__(self, ad_id, worker_id, shop_name, primary_skill, description, ad_photo, product_name, product_price):
        self.ad_id = ad_id
        self.worker_id = worker_id
        self.shop_name = shop_name
        self.primary_skill = primary_skill
        self.description = description
        self.ad_photo = ad_photo
        self.product_name = product_name
        self.product_price = product_price

    def to_dict(self):
        return {
            "ad_id": self.ad_id,
            "worker_id": self.worker_id,
            "shop_name": self.shop_name,
            "primary_skill": self.primary_skill,
            "description": self.description,
            "ad_photo": self.ad_photo,
            "product_name": self.product_name,
            "product_price": self.product_price
        }

# ============================================================
# APP SETUP
# ============================================================

app = Flask(__name__)
app.secret_key = 'workmitra_secret_key_2024'
CORS(app)

# ============================================================
# FILE UPLOAD CONFIGURATION
# ============================================================

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ============================================================
# IN-MEMORY STORAGE
# ============================================================

workers = []
customers = []
bookings = []
ratings = []
subscriptions = []
advertisements = []

# ============================================================
# ID COUNTERS
# ============================================================

customer_counter = [1]
worker_counter = [1]
booking_counter = [1]
rating_counter = [1]
subscription_counter = [1]
ad_counter = [1]

# ============================================================
# PAGES
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        data = request.get_json()
        mobile_number = data.get("mobile_number")
        password = data.get("password")

        for customer in customers:
            if customer.mobile_number == mobile_number and customer.password == password:
                session['user_id'] = customer.customer_id
                session['user_type'] = 'customer'
                session['user_name'] = customer.full_name
                return jsonify({"success": True, "user_type": "customer", "redirect": "/customer-dashboard"})

        for worker in workers:
            if worker.mobile_number == mobile_number and worker.password == password:
                user_type = "shop" if worker.is_shop else "worker"
                session['user_id'] = worker.worker_id
                session['user_type'] = user_type
                session['user_name'] = worker.full_name if not worker.is_shop else worker.shop_name
                return jsonify({"success": True, "user_type": user_type, "redirect": f"/{user_type}-dashboard"})

        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    return render_template("login.html")

@app.route("/signup", methods=["GET", "POST"])
def signup_page():
    if request.method == "POST":
        user_type = request.form.get("user_type")
        
        if user_type == "customer":
            full_name = request.form.get("full_name")
            password = request.form.get("password")
            mobile_number = request.form.get("mobile_number")
            email = request.form.get("email", "")
            address = request.form.get("address")
            pincode = request.form.get("pincode")

            for customer in customers:
                if customer.mobile_number == mobile_number:
                    return jsonify({"success": False, "message": "Mobile number already registered"}), 400

            customer_id = f"C{customer_counter[0]:03d}"
            customer_counter[0] += 1

            customer = Customer(customer_id, full_name, password, mobile_number, email, address, pincode)
            customers.append(customer)

            session['user_id'] = customer_id
            session['user_type'] = 'customer'
            session['user_name'] = full_name

            return jsonify({"success": True, "redirect": "/customer-dashboard"})

        elif user_type == "worker":
            full_name = request.form.get("full_name")
            password = request.form.get("password")
            mobile_number = request.form.get("mobile_number")
            email = request.form.get("email", "")
            age = request.form.get("age")
            current_address = request.form.get("current_address")
            city = request.form.get("city")
            pincode = request.form.get("pincode")
            primary_skill = request.form.get("primary_skill")
            additional_skills = request.form.get("additional_skills", "")
            years_of_experience = request.form.get("years_of_experience")
            description = request.form.get("description", "")
            preferred_working_hours = request.form.get("preferred_working_hours", "")

            for worker in workers:
                if worker.mobile_number == mobile_number:
                    return jsonify({"success": False, "message": "Mobile number already registered"}), 400

            worker_id = f"W{worker_counter[0]:03d}"
            worker_counter[0] += 1

            worker = Worker(
                worker_id, full_name, password, mobile_number, email, age,
                current_address, city, pincode, primary_skill, additional_skills,
                years_of_experience, description, True, preferred_working_hours,
                is_shop=False, shop_name=""
            )
            workers.append(worker)

            session['user_id'] = worker_id
            session['user_type'] = 'worker'
            session['user_name'] = full_name

            return jsonify({"success": True, "redirect": "/worker-dashboard"})

        elif user_type == "shop":
            shop_name = request.form.get("shop_name")
            password = request.form.get("password")
            mobile_number = request.form.get("mobile_number")
            email = request.form.get("email", "")
            primary_skill = request.form.get("primary_skill")
            additional_skills = request.form.get("additional_skills", "")
            address = request.form.get("address")
            city = request.form.get("city")
            pincode = request.form.get("pincode")
            description = request.form.get("description", "")
            worker_list_str = request.form.get("worker_list", "")
            worker_list = [w.strip() for w in worker_list_str.split(",") if w.strip()]

            for worker in workers:
                if worker.mobile_number == mobile_number:
                    return jsonify({"success": False, "message": "Mobile number already registered"}), 400

            worker_id = f"W{worker_counter[0]:03d}"
            worker_counter[0] += 1

            shop = Worker(
                worker_id, shop_name, password, mobile_number, email, 0,
                address, city, pincode, primary_skill, additional_skills,
                0, description, True, "", is_shop=True, shop_name=shop_name,
                worker_list=worker_list
            )
            workers.append(shop)

            session['user_id'] = worker_id
            session['user_type'] = 'shop'
            session['user_name'] = shop_name

            return jsonify({"success": True, "redirect": "/shop-dashboard"})

    return render_template("signup.html")

@app.route("/customer-dashboard")
def customer_dashboard():
    if 'user_id' not in session or session['user_type'] != 'customer':
        return redirect(url_for('login_page'))
    
    customer_id = session['user_id']
    customer = next((c for c in customers if c.customer_id == customer_id), None)
    
    if not customer:
        return redirect(url_for('login_page'))
    
    return render_template("customer_dashboard.html", user=customer, ads=advertisements)

@app.route("/worker-dashboard")
def worker_dashboard():
    if 'user_id' not in session or session['user_type'] != 'worker':
        return redirect(url_for('login_page'))
    
    worker_id = session['user_id']
    worker = next((w for w in workers if w.worker_id == worker_id), None)
    
    if not worker:
        return redirect(url_for('login_page'))
    
    return render_template("worker_dashboard.html", user=worker, ads=advertisements)

@app.route("/shop-dashboard")
def shop_dashboard():
    if 'user_id' not in session or session['user_type'] != 'shop':
        return redirect(url_for('login_page'))
    
    worker_id = session['user_id']
    shop = next((w for w in workers if w.worker_id == worker_id), None)
    
    if not shop:
        return redirect(url_for('login_page'))
    
    return render_template("shop_dashboard.html", user=shop, ads=advertisements)

# ============================================================
# SHOP API ROUTES
# ============================================================

@app.route("/api/shop/<shop_id>", methods=["GET"])
def get_shop_profile(shop_id):
    shop = next(
        (w for w in workers if w.worker_id == shop_id and w.is_shop),
        None
    )

    if shop is None:
        return jsonify({
            "success": False,
            "message": "Shop not found."
        }), 404

    shop_data = shop.to_dict()

    shop_ratings = [
        r for r in ratings
        if r.worker_id == shop.worker_id
    ]

    if shop_ratings:
        shop_data["average_rating"] = round(
            sum(r.rating for r in shop_ratings) / len(shop_ratings),
            1
        )
        shop_data["number_of_ratings"] = len(shop_ratings)
    else:
        shop_data["average_rating"] = None
        shop_data["number_of_ratings"] = 0

    return jsonify({
        "success": True,
        "shop": shop_data
    })


@app.route("/api/shop/<shop_id>/team", methods=["GET"])
def get_shop_team(shop_id):
    shop = next(
        (w for w in workers if w.worker_id == shop_id and w.is_shop),
        None
    )

    if shop is None:
        return jsonify({
            "success": False,
            "message": "Shop not found."
        }), 404

    team = []

    for worker_name in shop.worker_list:
        team.append({
            "name": worker_name,
            "shop_id": shop.worker_id
        })

    return jsonify({
        "success": True,
        "team": team
    })


@app.route("/api/shop/<shop_id>/team", methods=["POST"])
def update_shop_team(shop_id):
    shop = next(
        (w for w in workers if w.worker_id == shop_id and w.is_shop),
        None
    )

    if shop is None:
        return jsonify({
            "success": False,
            "message": "Shop not found."
        }), 404

    data = request.get_json(silent=True) or {}

    worker_list = data.get("worker_list")

    if not isinstance(worker_list, list):
        return jsonify({
            "success": False,
            "message": "worker_list must be a list."
        }), 400

    shop.worker_list = [
        str(worker).strip()
        for worker in worker_list
        if str(worker).strip()
    ]

    return jsonify({
        "success": True,
        "message": "Team updated.",
        "worker_list": shop.worker_list
    })


@app.route("/api/shop/<shop_id>/stats", methods=["GET"])
def get_shop_stats(shop_id):
    shop = next(
        (w for w in workers if w.worker_id == shop_id and w.is_shop),
        None
    )

    if shop is None:
        return jsonify({
            "success": False,
            "message": "Shop not found."
        }), 404

    shop_bookings = [
        b for b in bookings
        if b.worker_id == shop_id
    ]

    completed = [
        b for b in shop_bookings
        if b.status == "COMPLETED"
    ]

    pending = [
        b for b in shop_bookings
        if b.status == "PENDING"
    ]

    accepted = [
        b for b in shop_bookings
        if b.status == "ACCEPTED"
    ]

    shop_ratings = [
        r for r in ratings
        if r.worker_id == shop_id
    ]

    average_rating = None

    if shop_ratings:
        average_rating = round(
            sum(r.rating for r in shop_ratings) / len(shop_ratings),
            1
        )

    return jsonify({
        "success": True,
        "stats": {
            "total_bookings": len(shop_bookings),
            "pending_bookings": len(pending),
            "accepted_bookings": len(accepted),
            "completed_bookings": len(completed),
            "team_members": len(shop.worker_list),
            "products_services": len(shop.products_services),
            "portfolio_photos": len(shop.portfolio_photos),
            "subscriptions": len([
                s for s in subscriptions
                if s.worker_id == shop_id
            ]),
            "average_rating": average_rating,
            "number_of_ratings": len(shop_ratings)
        }
    })


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('index'))

# ============================================================
# API ROUTES
# ============================================================

@app.route("/api/workers", methods=["GET"])
def find_workers():
    service = request.args.get("service")

    if not service:
        return jsonify({"success": False, "message": "Please provide a service."}), 400

    matching_workers = []

    for worker in workers:
        if worker.primary_skill.lower() == service.lower() and worker.available:
            worker_data = worker.to_dict()

            worker_ratings = [r for r in ratings if r.worker_id == worker.worker_id]

            if len(worker_ratings) == 0:
                worker_data["average_rating"] = None
                worker_data["number_of_ratings"] = 0
            else:
                total = sum(r.rating for r in worker_ratings)
                worker_data["average_rating"] = round(total / len(worker_ratings), 1)
                worker_data["number_of_ratings"] = len(worker_ratings)

            worker_data["reviews"] = [
                {"rating": r.rating, "review": r.review}
                for r in worker_ratings
                if r.review.strip() != ""
            ]

            matching_workers.append(worker_data)

    return jsonify({"success": True, "workers": matching_workers})

@app.route("/api/book", methods=["POST"])
def create_booking():
    data = request.form

    customer_id = data.get("customer_id")
    worker_id = data.get("worker_id")
    date = data.get("date")

    problem_photo = ""
    if 'problem_photo' in request.files:
        file = request.files['problem_photo']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"{booking_counter[0]}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            problem_photo = filename

    customer = next((c for c in customers if c.customer_id == customer_id), None)
    if customer is None:
        return jsonify({"success": False, "message": "Customer not found."}), 404

    worker = next((w for w in workers if w.worker_id == worker_id), None)
    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    if not worker.available:
        return jsonify({"success": False, "message": "Worker is currently unavailable."}), 400

    booking_id = f"B{booking_counter[0]:03d}"
    booking_counter[0] += 1

    booking = Booking(booking_id, customer_id, worker_id, worker.primary_skill, date, "PENDING", problem_photo)
    bookings.append(booking)

    return jsonify({
        "success": True,
        "message": "Booking created.",
        "booking": booking.to_dict()
    })

@app.route("/api/bookings/customer/<customer_id>", methods=["GET"])
def customer_bookings(customer_id):
    result = []

    for booking in bookings:
        if booking.customer_id == customer_id:
            booking_data = booking.to_dict()

            worker = next((w for w in workers if w.worker_id == booking.worker_id), None)
            if worker:
                booking_data["worker_name"] = worker.full_name

            result.append(booking_data)

    return jsonify({"success": True, "bookings": result})

@app.route("/api/bookings/worker/<worker_id>", methods=["GET"])
def worker_bookings(worker_id):
    result = []

    for booking in bookings:
        if booking.worker_id == worker_id:
            booking_data = booking.to_dict()

            customer = next((c for c in customers if c.customer_id == booking.customer_id), None)
            if customer:
                booking_data["customer_name"] = customer.full_name

            result.append(booking_data)

    return jsonify({"success": True, "bookings": result})

@app.route("/api/booking/<booking_id>/accept", methods=["POST"])
def accept_booking(booking_id):
    booking = next((b for b in bookings if b.booking_id == booking_id), None)

    if booking is None:
        return jsonify({"success": False, "message": "Booking not found."}), 404

    booking.status = "ACCEPTED"

    return jsonify({
        "success": True,
        "message": "Booking accepted.",
        "booking": booking.to_dict()
    })

@app.route("/api/booking/<booking_id>/reject", methods=["POST"])
def reject_booking(booking_id):
    booking = next((b for b in bookings if b.booking_id == booking_id), None)

    if booking is None:
        return jsonify({"success": False, "message": "Booking not found."}), 404

    booking.status = "REJECTED"

    return jsonify({
        "success": True,
        "message": "Booking rejected.",
        "booking": booking.to_dict()
    })

@app.route("/api/booking/<booking_id>/complete", methods=["POST"])
def complete_booking(booking_id):
    booking = next((b for b in bookings if b.booking_id == booking_id), None)

    if booking is None:
        return jsonify({"success": False, "message": "Booking not found."}), 404

    if booking.status != "ACCEPTED":
        return jsonify({"success": False, "message": "Only accepted bookings can be completed."}), 400

    booking.status = "COMPLETED"

    return jsonify({
        "success": True,
        "message": "Work marked as completed.",
        "booking": booking.to_dict()
    })

@app.route("/api/rating", methods=["POST"])
def add_rating():
    data = request.get_json()

    booking_id = data.get("booking_id")
    customer_id = data.get("customer_id")
    rating_value = data.get("rating")
    review = data.get("review", "")

    booking = next((b for b in bookings if b.booking_id == booking_id), None)
    if booking is None:
        return jsonify({"success": False, "message": "Booking not found."}), 404

    if booking.status != "COMPLETED":
        return jsonify({"success": False, "message": "Work must be completed before rating."}), 400

    if booking.customer_id != customer_id:
        return jsonify({"success": False, "message": "You cannot rate this booking."}), 403

    for existing_rating in ratings:
        if existing_rating.booking_id == booking_id:
            return jsonify({"success": False, "message": "This booking has already been rated."}), 400

    try:
        rating_value = int(rating_value)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Rating must be a number."}), 400

    if rating_value < 1 or rating_value > 5:
        return jsonify({"success": False, "message": "Rating must be between 1 and 5."}), 400

    rating_id = f"R{rating_counter[0]:03d}"
    rating_counter[0] += 1

    rating = Rating(rating_id, booking_id, customer_id, booking.worker_id, rating_value, review)
    ratings.append(rating)

    return jsonify({
        "success": True,
        "message": "Rating submitted.",
        "rating": rating.to_dict()
    })

@app.route("/api/ratings/worker/<worker_id>", methods=["GET"])
def get_worker_ratings(worker_id):
    worker_ratings = [r for r in ratings if r.worker_id == worker_id]

    if len(worker_ratings) == 0:
        return jsonify({
            "success": True,
            "average_rating": None,
            "number_of_ratings": 0,
            "ratings": []
        })

    total = sum(r.rating for r in worker_ratings)
    average = total / len(worker_ratings)

    return jsonify({
        "success": True,
        "average_rating": round(average, 1),
        "number_of_ratings": len(worker_ratings),
        "ratings": [r.to_dict() for r in worker_ratings]
    })

@app.route("/api/worker/<worker_id>/availability", methods=["POST"])
def change_availability(worker_id):
    worker = next((w for w in workers if w.worker_id == worker_id), None)

    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    data = request.get_json()

    if "available" not in data:
        return jsonify({"success": False, "message": "Availability value required."}), 400

    worker.available = bool(data["available"])

    return jsonify({"success": True, "available": worker.available})

@app.route("/api/worker/<worker_id>/earnings", methods=["GET"])
def worker_earnings(worker_id):
    completed_bookings = [
        b for b in bookings
        if b.worker_id == worker_id and b.status == "COMPLETED"
    ]

    return jsonify({
        "success": True,
        "message": "Payment functionality will be added later.",
        "completed_jobs": len(completed_bookings),
        "earnings": 0
    })

@app.route("/api/upload/portfolio", methods=["POST"])
def upload_portfolio():
    worker_id = request.form.get("worker_id")

    if 'portfolio_photo' not in request.files:
        return jsonify({"success": False, "message": "No photo uploaded."}), 400

    file = request.files['portfolio_photo']

    if not file or not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file type."}), 400

    worker = next((w for w in workers if w.worker_id == worker_id), None)
    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    filename = secure_filename(file.filename)
    filename = f"portfolio_{worker_id}_{len(worker.portfolio_photos)}_{filename}"
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    worker.portfolio_photos.append(filename)

    return jsonify({
        "success": True,
        "message": "Portfolio photo uploaded.",
        "photo": filename,
        "photos": worker.portfolio_photos
    })

@app.route("/api/portfolio/<worker_id>", methods=["GET"])
def get_portfolio(worker_id):
    worker = next((w for w in workers if w.worker_id == worker_id), None)

    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    return jsonify({"success": True, "photos": worker.portfolio_photos})

@app.route("/api/product/add", methods=["POST"])
def add_product():
    worker_id = request.form.get("worker_id")
    product_name = request.form.get("product_name")
    product_description = request.form.get("product_description")
    product_price = request.form.get("product_price", "")

    if not worker_id or not product_name:
        return jsonify({"success": False, "message": "Worker ID and Product Name required."}), 400

    worker = next((w for w in workers if w.worker_id == worker_id), None)
    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    product_photo = ""
    if 'product_photo' in request.files:
        file = request.files['product_photo']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"product_{worker_id}_{len(worker.products_services)}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            product_photo = filename

    product = {
        "product_id": len(worker.products_services),
        "product_name": product_name,
        "product_description": product_description,
        "product_price": product_price,
        "product_photo": product_photo
    }

    worker.products_services.append(product)

    ad_id = f"AD{ad_counter[0]:03d}"
    ad_counter[0] += 1

    ad = Advertisement(
        ad_id,
        worker_id,
        worker.full_name if not worker.is_shop else worker.shop_name,
        worker.primary_skill,
        product_description,
        product_photo,
        product_name,
        product_price
    )

    advertisements.append(ad)

    return jsonify({
        "success": True,
        "message": "Product/Service added.",
        "product": product,
        "products": worker.products_services
    })

@app.route("/api/products/<worker_id>", methods=["GET"])
def get_products(worker_id):
    worker = next((w for w in workers if w.worker_id == worker_id), None)

    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    return jsonify({"success": True, "products": worker.products_services})

@app.route("/api/ads/homepage", methods=["GET"])
def get_homepage_ads():
    if len(advertisements) == 0:
        return jsonify({"success": True, "ads": []})

    skills = list(set([ad.primary_skill for ad in advertisements]))
    homepage_ads = []

    for skill in skills:
        skill_ads = [ad for ad in advertisements if ad.primary_skill == skill]
        random_ads = random.sample(skill_ads, min(10, len(skill_ads)))
        homepage_ads.extend(random_ads)

    return jsonify({"success": True, "ads": [ad.to_dict() for ad in homepage_ads]})

@app.route("/api/subscription/create", methods=["POST"])
def create_subscription():
    data = request.get_json()

    customer_id = data.get("customer_id")
    worker_id = data.get("worker_id")
    plan_name = data.get("plan_name")
    plan_description = data.get("plan_description")
    plan_price = data.get("plan_price")
    plan_duration = data.get("plan_duration")

    if not all([customer_id, worker_id, plan_name, plan_price, plan_duration]):
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    customer = next((c for c in customers if c.customer_id == customer_id), None)
    if customer is None:
        return jsonify({"success": False, "message": "Customer not found."}), 404

    worker = next((w for w in workers if w.worker_id == worker_id), None)
    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    subscription_id = f"SUB{subscription_counter[0]:03d}"
    subscription_counter[0] += 1

    start_date = datetime.now().strftime("%Y-%m-%d")

    if plan_duration == "1 month":
        end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    elif plan_duration == "3 months":
        end_date = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")
    elif plan_duration == "6 months":
        end_date = (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")
    elif plan_duration == "1 year":
        end_date = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
    else:
        end_date = start_date

    subscription = Subscription(
        subscription_id,
        worker_id,
        customer_id,
        plan_name,
        plan_description,
        plan_price,
        plan_duration,
        "ACTIVE",
        start_date,
        end_date
    )

    subscriptions.append(subscription)

    return jsonify({
        "success": True,
        "message": "Subscription created.",
        "subscription": subscription.to_dict()
    })

@app.route("/api/subscriptions/customer/<customer_id>", methods=["GET"])
def get_customer_subscriptions(customer_id):
    customer_subs = [s for s in subscriptions if s.customer_id == customer_id]

    result = []
    for sub in customer_subs:
        sub_data = sub.to_dict()
        worker = next((w for w in workers if w.worker_id == sub.worker_id), None)
        if worker:
            sub_data["worker_name"] = worker.full_name if not worker.is_shop else worker.shop_name
        result.append(sub_data)

    return jsonify({"success": True, "subscriptions": result})

@app.route("/api/subscriptions/worker/<worker_id>", methods=["GET"])
def get_worker_subscriptions(worker_id):
    worker_subs = [s for s in subscriptions if s.worker_id == worker_id]

    result = []
    for sub in worker_subs:
        sub_data = sub.to_dict()
        customer = next((c for c in customers if c.customer_id == sub.customer_id), None)
        if customer:
            sub_data["customer_name"] = customer.full_name
        result.append(sub_data)

    return jsonify({"success": True, "subscriptions": result})

@app.route("/api/subscription/<subscription_id>/cancel", methods=["POST"])
def cancel_subscription(subscription_id):
    subscription = next((s for s in subscriptions if s.subscription_id == subscription_id), None)

    if subscription is None:
        return jsonify({"success": False, "message": "Subscription not found."}), 404

    subscription.status = "CANCELLED"

    return jsonify({
        "success": True,
        "message": "Subscription cancelled.",
        "subscription": subscription.to_dict()
    })

@app.route("/api/subscription-plans/<worker_id>", methods=["GET"])
def get_subscription_plans(worker_id):
    worker = next((w for w in workers if w.worker_id == worker_id), None)

    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    plans = [
        {
            "plan_id": "plan_1",
            "plan_name": "Basic Maintenance",
            "plan_description": f"{worker.primary_skill} maintenance once a month",
            "plan_price": "₹999",
            "plan_duration": "1 month"
        },
        {
            "plan_id": "plan_2",
            "plan_name": "Quarterly Care",
            "plan_description": f"Full {worker.primary_skill} service quarterly",
            "plan_price": "₹2499",
            "plan_duration": "3 months"
        },
        {
            "plan_id": "plan_3",
            "plan_name": "Half-Yearly Combo",
            "plan_description": f"Complete {worker.primary_skill} solutions every 2 months",
            "plan_price": "₹4499",
            "plan_duration": "6 months"
        },
        {
            "plan_id": "plan_4",
            "plan_name": "Annual Premium",
            "plan_description": f"Priority {worker.primary_skill} service with 4 visits",
            "plan_price": "₹7999",
            "plan_duration": "1 year"
        }
    ]

    return jsonify({"success": True, "plans": plans})

@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host="0.0.0.0", port=port, debug=False)