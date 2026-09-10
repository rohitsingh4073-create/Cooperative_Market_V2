import os
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory
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
# SERVE STATIC FILES
# ============================================================

@app.route("/")
def serve_website():
    return send_from_directory(".", "index.html")

@app.route("/script.js")
def serve_javascript():
    return send_from_directory(".", "script.js")

@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ============================================================
# CUSTOMER SIGNUP
# ============================================================

@app.route("/signup/customer", methods=["POST"])
def signup_customer():
    data = request.json

    required_fields = ["full_name", "password", "mobile_number", "address", "pincode"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required."}), 400

    for customer in customers:
        if customer.mobile_number == data["mobile_number"]:
            return jsonify({"success": False, "message": "Mobile number already registered."}), 400

    customer_id = f"C{customer_counter[0]:03d}"
    customer_counter[0] += 1

    customer = Customer(
        customer_id,
        data["full_name"],
        data["password"],
        data["mobile_number"],
        data.get("email", ""),
        data["address"],
        data["pincode"]
    )

    customers.append(customer)

    return jsonify({
        "success": True,
        "message": "Customer account created.",
        "customer": customer.to_dict()
    })

# ============================================================
# WORKER SIGNUP
# ============================================================

@app.route("/signup/worker", methods=["POST"])
def signup_worker():
    data = request.json

    required_fields = ["full_name", "password", "mobile_number", "age", "current_address", "city", "pincode", "primary_skill", "years_of_experience"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required."}), 400

    for worker in workers:
        if worker.mobile_number == data["mobile_number"]:
            return jsonify({"success": False, "message": "Mobile number already registered."}), 400

    worker_id = f"W{worker_counter[0]:03d}"
    worker_counter[0] += 1

    worker = Worker(
        worker_id,
        data["full_name"],
        data["password"],
        data["mobile_number"],
        data.get("email", ""),
        data["age"],
        data["current_address"],
        data["city"],
        data["pincode"],
        data["primary_skill"],
        data.get("additional_skills", ""),
        data["years_of_experience"],
        data.get("description", ""),
        True,
        data.get("preferred_working_hours", ""),
        is_shop=False,
        shop_name=""
    )

    workers.append(worker)

    return jsonify({
        "success": True,
        "message": "Worker account created.",
        "worker": worker.to_dict()
    })

# ============================================================
# SHOP SIGNUP
# ============================================================

@app.route("/signup/shop", methods=["POST"])
def signup_shop():
    data = request.json

    required_fields = ["shop_name", "password", "mobile_number", "primary_skill", "address", "city", "pincode"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required."}), 400

    for worker in workers:
        if worker.mobile_number == data["mobile_number"]:
            return jsonify({"success": False, "message": "Mobile number already registered."}), 400

    worker_id = f"W{worker_counter[0]:03d}"
    worker_counter[0] += 1

    shop = Worker(
        worker_id,
        data["shop_name"],
        data["password"],
        data["mobile_number"],
        data.get("email", ""),
        age=0,
        current_address=data["address"],
        city=data["city"],
        pincode=data["pincode"],
        primary_skill=data["primary_skill"],
        additional_skills=data.get("additional_skills", ""),
        years_of_experience=0,
        description=data.get("description", ""),
        available=True,
        preferred_working_hours="",
        is_shop=True,
        shop_name=data["shop_name"],
        worker_list=data.get("worker_list", [])
    )

    workers.append(shop)

    return jsonify({
        "success": True,
        "message": "Shop account created.",
        "shop": shop.to_dict()
    })

# ============================================================
# LOGIN
# ============================================================

@app.route("/login", methods=["POST"])
def login():
    data = request.json

    mobile_number = data.get("mobile_number")
    password = data.get("password")

    for customer in customers:
        if customer.mobile_number == mobile_number and customer.password == password:
            return jsonify({
                "success": True,
                "user_type": "customer",
                "user": customer.to_dict()
            })

    for worker in workers:
        if worker.mobile_number == mobile_number and worker.password == password:
            user_type = "shop" if worker.is_shop else "worker"
            return jsonify({
                "success": True,
                "user_type": user_type,
                "user": worker.to_dict()
            })

    return jsonify({"success": False, "message": "Invalid mobile number or password."}), 401

# ============================================================
# FIND WORKERS
# ============================================================

@app.route("/workers", methods=["GET"])
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

# ============================================================
# CREATE BOOKING
# ============================================================

@app.route("/book", methods=["POST"])
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

# ============================================================
# CUSTOMER BOOKINGS
# ============================================================

@app.route("/bookings/customer/<customer_id>", methods=["GET"])
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

# ============================================================
# WORKER BOOKINGS
# ============================================================

@app.route("/bookings/worker/<worker_id>", methods=["GET"])
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

# ============================================================
# ACCEPT BOOKING
# ============================================================

@app.route("/booking/<booking_id>/accept", methods=["POST"])
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

# ============================================================
# REJECT BOOKING
# ============================================================

@app.route("/booking/<booking_id>/reject", methods=["POST"])
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

# ============================================================
# COMPLETE BOOKING
# ============================================================

@app.route("/booking/<booking_id>/complete", methods=["POST"])
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

# ============================================================
# ADD RATING
# ============================================================

@app.route("/rating", methods=["POST"])
def add_rating():
    data = request.json

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

# ============================================================
# GET WORKER RATINGS
# ============================================================

@app.route("/ratings/worker/<worker_id>", methods=["GET"])
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

# ============================================================
# CHANGE WORKER AVAILABILITY
# ============================================================

@app.route("/worker/<worker_id>/availability", methods=["POST"])
def change_availability(worker_id):
    worker = next((w for w in workers if w.worker_id == worker_id), None)

    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    data = request.json

    if "available" not in data:
        return jsonify({"success": False, "message": "Availability value required."}), 400

    worker.available = bool(data["available"])

    return jsonify({"success": True, "available": worker.available})

# ============================================================
# WORKER EARNINGS
# ============================================================

@app.route("/worker/<worker_id>/earnings", methods=["GET"])
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

# ============================================================
# UPLOAD PORTFOLIO
# ============================================================

@app.route("/upload/portfolio", methods=["POST"])
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

# ============================================================
# GET PORTFOLIO
# ============================================================

@app.route("/portfolio/<worker_id>", methods=["GET"])
def get_portfolio(worker_id):
    worker = next((w for w in workers if w.worker_id == worker_id), None)

    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    return jsonify({"success": True, "photos": worker.portfolio_photos})

# ============================================================
# ADD PRODUCT
# ============================================================

@app.route("/product/add", methods=["POST"])
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

    # Create advertisement
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

# ============================================================
# GET PRODUCTS
# ============================================================

@app.route("/products/<worker_id>", methods=["GET"])
def get_products(worker_id):
    worker = next((w for w in workers if w.worker_id == worker_id), None)

    if worker is None:
        return jsonify({"success": False, "message": "Worker not found."}), 404

    return jsonify({"success": True, "products": worker.products_services})

# ============================================================
# GET HOMEPAGE ADS
# ============================================================

@app.route("/ads/homepage", methods=["GET"])
def get_homepage_ads():
    import random

    if len(advertisements) == 0:
        return jsonify({"success": True, "ads": []})

    skills = list(set([ad.primary_skill for ad in advertisements]))
    homepage_ads = []

    for skill in skills:
        skill_ads = [ad for ad in advertisements if ad.primary_skill == skill]
        random_ads = random.sample(skill_ads, min(10, len(skill_ads)))
        homepage_ads.extend(random_ads)

    return jsonify({"success": True, "ads": [ad.to_dict() for ad in homepage_ads]})

# ============================================================
# CREATE SUBSCRIPTION
# ============================================================

@app.route("/subscription/create", methods=["POST"])
def create_subscription():
    data = request.json

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

# ============================================================
# GET CUSTOMER SUBSCRIPTIONS
# ============================================================

@app.route("/subscriptions/customer/<customer_id>", methods=["GET"])
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

# ============================================================
# GET WORKER SUBSCRIPTIONS
# ============================================================

@app.route("/subscriptions/worker/<worker_id>", methods=["GET"])
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

# ============================================================
# CANCEL SUBSCRIPTION
# ============================================================

@app.route("/subscription/<subscription_id>/cancel", methods=["POST"])
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

# ============================================================
# GET SUBSCRIPTION PLANS
# ============================================================

@app.route("/subscription-plans/<worker_id>", methods=["GET"])
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

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        debug=True
    )
