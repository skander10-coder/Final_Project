from stage import app, db, bcrypt
from flask import request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from stage.models import User

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'success': False, 'message': 'Email and password required'}), 400
    

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email exists'}), 400
    
    
    hashed = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    
    if data['role'] == 'student':
        user = User(
            email=data['email'],
            password=hashed,
            role='student',
            full_name=data.get('full_name')
        )
    else:
        user = User(
            email=data['email'],
            password=hashed,
            role='company',
            company_name=data.get('company_name')
        )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Account created!'})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and bcrypt.check_password_hash(user.password, data['password']):
        login_user(user)
        return jsonify({'success': True, 'user': {
            'email': user.email,
            'role': user.role,
            'name': user.full_name or user.company_name
        }})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route("/api/check-auth")
def check_auth():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'user': {
            'email': current_user.email,
            'role': current_user.role,
            'name': current_user.full_name or current_user.company_name
        }})
    return jsonify({'authenticated': False})

@app.route("/api/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify({'success': True})