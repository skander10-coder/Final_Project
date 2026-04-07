from stage import app, db, bcrypt
from flask import request, jsonify , send_file , send_from_directory
from flask_login import login_user, logout_user, login_required, current_user
from stage.models import User , InternshipOffer , Application , StudentProfile , CompanyProfile , AdminProfile , Notification , InternshipAgreement
from sqlalchemy import Unicode, cast



from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os
from datetime import datetime

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
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'name': user.full_name or user.company_name
        }})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route("/api/check-auth")
def check_auth():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'user': {
            'id': current_user.id,
            'email': current_user.email,
            'role': current_user.role,
            'name': current_user.full_name or current_user.company_name
        }})
    return jsonify({'authenticated': False})

@app.route("/api/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify({'success': True})




# ===================== INTERNSHIP OFFERS =====================






@app.route("/api/company/internships", methods=["POST"])
def create_internship():
    
    
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('description'):
        return jsonify({'success': False, 'message': 'Title and description are required'}), 400
    
    offer = InternshipOffer(
        company_id=current_user.id,
        title=data['title'],
        description=data['description'],
        required_skills=data.get('required_skills', []),
        location=data.get('location'),
        duration=data.get('duration'),
        is_active=True,
        is_approved=False,  
    )
    
    db.session.add(offer)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Internship offer created successfully. Waiting for admin approval.'
    }), 201




@app.route("/api/company/internships", methods=["GET"])
def get_company_internships():
    from stage.models import InternshipOffer
    
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    offers = InternshipOffer.query.filter_by(company_id=current_user.id).order_by(InternshipOffer.created_at.desc()).all()
    
    offers_list = []
    for offer in offers:
        offers_list.append({
            'id': offer.id,
            'title': offer.title,
            'description': offer.description,
            'required_skills': offer.required_skills,
            'location': offer.location,
            'duration': offer.duration,
            'is_active': offer.is_active,
            'created_at': offer.created_at.isoformat()
        })
    
    return jsonify({
        'success': True,
        'offers': offers_list
    })



@app.route("/api/company/internships/<int:offer_id>", methods=["DELETE"])
def delete_internship(offer_id):
    
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    offer = InternshipOffer.query.get(offer_id)
    
    if not offer:
        return jsonify({'success': False, 'message': 'Offer not found'}), 404
    
    if offer.company_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db.session.delete(offer)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Offer deleted successfully'})



# Update internship (Company only)
@app.route("/api/company/internships/<int:offer_id>", methods=["PUT"])
def update_internship(offer_id):

    
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    offer = InternshipOffer.query.get(offer_id)
    
    if not offer:
        return jsonify({'success': False, 'message': 'Offer not found'}), 404
    
    if offer.company_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    if 'title' in data:
        offer.title = data['title']
    if 'description' in data:
        offer.description = data['description']
    if 'required_skills' in data:
        offer.required_skills = data['required_skills']
    if 'location' in data:
        offer.location = data['location']
    if 'duration' in data:
        offer.duration = data['duration']
    if 'is_active' in data:
        offer.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Offer updated successfully'
    })
    
    
    
    # Get all active internships for students




@app.route("/api/student/internships", methods=["GET"])
def get_student_internships():
    
    offers = InternshipOffer.query.filter_by(is_active=True, is_approved=True).order_by(InternshipOffer.created_at.desc()).all()
    
    offers_list = []
    for offer in offers:
        offers_list.append({
            'id': offer.id,
            'title': offer.title,
            'description': offer.description,
            'required_skills': offer.required_skills,
            'location': offer.location,
            'duration': offer.duration,
            'company_name': offer.company.company_name if offer.company else 'Unknown',
            'created_at': offer.created_at.isoformat()
        })
    
    return jsonify({
        'success': True,
        'offers': offers_list
    })




    

#######################################################################################

# Student: Apply for internship
@app.route("/api/student/internships/<int:offer_id>/apply", methods=["POST"])
def apply_for_internship(offer_id):
    
    
    if not current_user.is_authenticated or current_user.role != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    profile = StudentProfile.query.filter_by(user_id=current_user.id).first()
    if not profile or not profile.skills or not profile.university or not profile.level or not profile.major:
        return jsonify({
            'success': False, 
            'message': 'Please complete your CV first before applying'
        }), 400
    
    offer = InternshipOffer.query.get(offer_id)
    if not offer:
        return jsonify({'success': False, 'message': 'Offer not found'}), 404
    
    
    existing = Application.query.filter_by(
        offer_id=offer_id,
        student_id=current_user.id
    ).first()
    
    if existing:
        return jsonify({'success': False, 'message': 'You have already applied for this internship'}), 400
    
    application = Application(
        offer_id=offer_id,
        student_id=current_user.id,
        status='pending'
    )
    
    db.session.add(application)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Application submitted successfully',
        'application': application.to_dict()
    })


# Company: Get applications for company's offers
@app.route("/api/company/applications", methods=["GET"])
def get_company_applications():
    from stage.models import InternshipOffer, Application
    
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    offers = InternshipOffer.query.filter_by(company_id=current_user.id).all()
    offer_ids = [offer.id for offer in offers]
    
    applications = Application.query.filter(Application.offer_id.in_(offer_ids)).order_by(Application.applied_at.desc()).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })


# Company: Update application status (accept/reject)
# @app.route("/api/company/applications/<int:application_id>", methods=["PUT"])
# def update_application_status(application_id):
#     from stage.models import Application, InternshipOffer
    
#     if not current_user.is_authenticated or current_user.role != 'company':
#         return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
#     application = Application.query.get(application_id)
#     if not application:
#         return jsonify({'success': False, 'message': 'Application not found'}), 404
    
#     # التحقق من أن هذا العرض يخص هذه الشركة
#     offer = InternshipOffer.query.get(application.offer_id)
#     if offer.company_id != current_user.id:
#         return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
#     data = request.get_json()
#     new_status = data.get('status')
    
#     if new_status not in ['accepted', 'rejected']:
#         return jsonify({'success': False, 'message': 'Invalid status'}), 400
    
#     application.status = new_status
#     db.session.commit()
    
#     return jsonify({
#         'success': True,
#         'message': f'Application {new_status} successfully',
#         'application': application.to_dict()
#     })


# Student: Get my applications
@app.route("/api/student/applications", methods=["GET"])
def get_student_applications():
    if not current_user.is_authenticated or current_user.role != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    applications = Application.query.filter_by(student_id=current_user.id).order_by(Application.applied_at.desc()).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })
    
    
    
    
@app.route("/api/company/applications/<int:application_id>", methods=["PUT"])
def update_application_status(application_id):
    
    
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    application = Application.query.get(application_id)
    if not application:
        return jsonify({'success': False, 'message': 'Application not found'}), 404
    
    
    offer = InternshipOffer.query.get(application.offer_id)
    if offer.company_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['accepted', 'rejected']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400
    
    application.status = new_status
    db.session.commit()
    
    # ========== send notifications==========
    

    student = User.query.get(application.student_id)
    company_name = current_user.company_name or current_user.full_name
    offer_title = offer.title
    
    if new_status == 'accepted':
        
        admins = User.query.filter_by(role='admin').all()
        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                title="📢 New Acceptance",
                message=f"{company_name} has accepted student {student.full_name} for '{offer_title}'. Please review and validate.",
                type="info",
                related_application_id=application_id
            )
            db.session.add(notification)
        
        
        notification = Notification(
            user_id=application.student_id,
            title="✅ Application Accepted",
            message=f"Your application for '{offer_title}' at {company_name} has been accepted. Waiting for admin validation.",
            type="success",
            related_application_id=application_id
        )
        db.session.add(notification)
        
    elif new_status == 'rejected':
        
        notification = Notification(
            user_id=application.student_id,
            title="❌ Application Rejected",
            message=f"Your application for '{offer_title}' at {company_name} has been rejected.",
            type="error",
            related_application_id=application_id
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Application {new_status} successfully',
        'application': application.to_dict()
    })
    
    
    
    
# ===================== ADMIN APPROVAL =====================


@app.route("/api/admin/pending-offers", methods=["GET"])
def get_pending_offers():
    from stage.models import InternshipOffer
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    offers = InternshipOffer.query.filter_by(is_approved=False, is_active=True).order_by(InternshipOffer.created_at.desc()).all()
    
    offers_list = []
    for offer in offers:
        offers_list.append({
            'id': offer.id,
            'title': offer.title,
            'description': offer.description,
            'required_skills': offer.required_skills,
            'location': offer.location,
            'duration': offer.duration,
            'company_name': offer.company.company_name if offer.company else 'Unknown',
            'created_at': offer.created_at.isoformat()
        })
    
    return jsonify({
        'success': True,
        'offers': offers_list
    })



@app.route("/api/admin/approve-offer/<int:offer_id>", methods=["PUT"])
def approve_offer(offer_id):
    from stage.models import InternshipOffer
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    offer = InternshipOffer.query.get(offer_id)
    
    if not offer:
        return jsonify({'success': False, 'message': 'Offer not found'}), 404
    
    offer.is_approved = True
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Offer "{offer.title}" approved successfully'
    })



@app.route("/api/admin/reject-offer/<int:offer_id>", methods=["DELETE"])
def reject_offer(offer_id):
    from stage.models import InternshipOffer
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    offer = InternshipOffer.query.get(offer_id)
    
    if not offer:
        return jsonify({'success': False, 'message': 'Offer not found'}), 404
    

    db.session.delete(offer)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Offer "{offer.title}" rejected and deleted'
    })
    
    


@app.route("/api/admin/validate/<int:application_id>", methods=["POST"])
def validate_application(application_id):
    from stage.models import InternshipAgreement, Application, InternshipOffer, User
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    import os
    from datetime import datetime
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    application = Application.query.get(application_id)
    if not application:
        return jsonify({'success': False, 'message': 'Application not found'}), 404
    
    if application.status != 'accepted':
        return jsonify({'success': False, 'message': 'Application not in accepted status'}), 400
    
    # جلب البيانات
    offer = InternshipOffer.query.get(application.offer_id)
    student = User.query.get(application.student_id)
    company = User.query.get(offer.company_id)
    
    # إنشاء مجلد PDF
    pdf_dir = os.path.join(os.path.dirname(__file__), 'static', 'pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    # اسم الملف
    filename = f"agreement_{application_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(pdf_dir, filename)
    
    # ========== توليد PDF ==========
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    # عنوان
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, "INTERNSHIP AGREEMENT")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Stag.io - Internship Management Platform")
    c.line(50, height - 80, width - 50, height - 80)
    
    # 1. الأطراف
    y = height - 110
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "1. PARTIES")
    y -= 25
    c.setFont("Helvetica", 11)
    c.drawString(70, y, f"Company: {company.company_name or company.full_name}")
    y -= 20
    c.drawString(70, y, f"Student: {student.full_name or student.email}")
    y -= 20
    c.drawString(70, y, f"Email: {student.email}")
    
    # 2. تفاصيل التدريب
    y -= 30
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "2. INTERNSHIP DETAILS")
    y -= 25
    c.setFont("Helvetica", 11)
    c.drawString(70, y, f"Title: {offer.title}")
    y -= 20
    c.drawString(70, y, f"Duration: {offer.duration}")
    y -= 20
    c.drawString(70, y, f"Location: {offer.location or 'Remote'}")
    y -= 20
    skills_text = ', '.join(offer.required_skills) if offer.required_skills else 'Not specified'
    c.drawString(70, y, f"Required Skills: {skills_text}")
    
    # 3. الشروط
    y -= 30
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "3. TERMS AND CONDITIONS")
    y -= 25
    c.setFont("Helvetica", 10)
    c.drawString(70, y, "The student agrees to complete the internship as described above.")
    y -= 18
    c.drawString(70, y, "The company agrees to provide proper supervision and training.")
    y -= 18
    c.drawString(70, y, "The student shall maintain confidentiality of company information.")
    y -= 18
    c.drawString(70, y, "Both parties agree to comply with the internship program guidelines.")
    
    # تذييل
    y = 80
    c.setFont("Helvetica", 9)
    c.drawString(50, y, f"Generated on: {datetime.now().strftime('%B %d, %Y')}")
    c.drawString(50, y - 15, f"Generated by: {current_user.full_name or current_user.email}")
    c.drawString(50, y - 30, "This agreement is electronically generated and valid without signature.")
    
    c.save()
    
    # حفظ في قاعدة البيانات
    pdf_url = f"/static/pdfs/{filename}"
    agreement = InternshipAgreement.query.filter_by(application_id=application_id).first()
    if not agreement:
        agreement = InternshipAgreement(application_id=application_id)
        db.session.add(agreement)
    
    agreement.pdf_url = pdf_url
    agreement.generated_at = datetime.utcnow()
    agreement.generated_by = current_user.id
    
    # تحديث حالة الطلب
    application.status = 'validated'
    db.session.commit()
    
    # ========== إرسال الإشعارات مع رابط PDF الكامل ==========
    base_url = request.host_url.rstrip('/')
    full_pdf_url = f"{base_url}{pdf_url}"
    
    # 1. إشعار للطالب مع رابط التحميل
    notification1 = Notification(
        user_id=student.id,
        title="📄 Internship Agreement Ready",
        message=f"Your internship agreement for '{offer.title}' has been generated. Click to download.",
        type="success",
        related_application_id=application_id,
        action_url=full_pdf_url
    )
    db.session.add(notification1)
    
    # 2. إشعار للشركة مع رابط التحميل
    notification2 = Notification(
        user_id=company.id,
        title="📄 Internship Agreement Generated",
        message=f"The internship agreement for student {student.full_name} has been generated. Click to download.",
        type="success",
        related_application_id=application_id,
        action_url=full_pdf_url
    )
    db.session.add(notification2)
    
    # 3. إشعار للإدارة (تأكيد)
    notification3 = Notification(
        user_id=current_user.id,
        title="✅ PDF Generated",
        message=f"PDF agreement for {student.full_name} - {company.company_name} has been generated and sent.",
        type="success",
        related_application_id=application_id
    )
    db.session.add(notification3)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Application validated and PDF generated',
        'pdf_url': full_pdf_url,
        'application': application.to_dict()
    })
    
    
@app.route("/api/admin/reject-application/<int:application_id>", methods=["POST"])
def reject_application(application_id):
    from stage.models import InternshipOffer, Application, User, Notification
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    application = Application.query.get(application_id)
    if not application:
        return jsonify({'success': False, 'message': 'Application not found'}), 404
    
    if application.status != 'accepted':
        return jsonify({'success': False, 'message': 'Application not in accepted status'}), 400
    
    data = request.get_json()
    reason = data.get('reason', 'No reason provided')
    
    # تحديث الحالة إلى rejected_by_admin
    application.status = 'rejected_by_admin'
    db.session.commit()
    
    # ========== إرسال الإشعارات ==========
    
    offer = InternshipOffer.query.get(application.offer_id)
    student = User.query.get(application.student_id)
    company = User.query.get(offer.company_id)
    company_name = company.company_name or company.full_name
    student_name = student.full_name or student.email
    offer_title = offer.title
    
    # 1. إشعار للطالب
    notification1 = Notification(
        user_id=student.id,
        title="❌ Agreement Rejected",
        message=f"Your internship agreement for '{offer_title}' at {company_name} has been rejected by administration. Reason: {reason}",
        type="error",
        related_application_id=application_id
    )
    db.session.add(notification1)
    
    # 2. إشعار للشركة
    notification2 = Notification(
        user_id=company.id,
        title="❌ Agreement Rejected",
        message=f"The internship agreement for student {student_name} has been rejected by administration. Reason: {reason}",
        type="error",
        related_application_id=application_id
    )
    db.session.add(notification2)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Application rejected by admin',
        'application': application.to_dict()
    })
    
    
# ===================== ADMIN: GET ACCEPTED APPLICATIONS =====================

@app.route("/api/admin/accepted-applications", methods=["GET"])
def get_accepted_applications():
    
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    
    applications = Application.query.filter_by(status='accepted').order_by(Application.applied_at.desc()).all()
    
    applications_list = []
    for app in applications:
        offer = InternshipOffer.query.get(app.offer_id)
        applications_list.append({
            'id': app.id,
            'student_id': app.student_id,
            'student_name': app.student.full_name or app.student.email,
            'offer_id': app.offer_id,
            'offer_title': offer.title if offer else 'Unknown',
            'offer_company': offer.company.company_name if offer and offer.company else 'Unknown',
            'status': app.status,
            'applied_at': app.applied_at.isoformat()
        })
    
    return jsonify({
        'success': True,
        'applications': applications_list
    })    
    

# ===================== STUDENT PROFILE (CV) =====================


@app.route("/api/student/profile", methods=["GET"])
def get_student_profile():
    if not current_user.is_authenticated or current_user.role != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    profile = StudentProfile.query.filter_by(user_id=current_user.id).first()
    
    if not profile:
        return jsonify({
            'success': True,
            'has_profile': False,
            'profile': None
        })
    
    return jsonify({
        'success': True,
        'has_profile': True,
        'profile': {
            'skills': profile.skills,
            'university': profile.university,
            'level': profile.level,
            'major': profile.major,
            'github_url': profile.github_url,
            'phone_number': profile.phone_number,
            'bio': profile.bio,
        }
    })



@app.route("/api/student/profile", methods=["POST"])
def update_student_profile():
    if not current_user.is_authenticated or current_user.role != 'student':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    
    required_fields = ['skills', 'university', 'level', 'major']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    profile = StudentProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.session.add(profile)
    
    
    profile.skills = data.get('skills', [])
    profile.university = data.get('university', '')
    profile.level = data.get('level', '')
    profile.major = data.get('major', '')
    profile.github_url = data.get('github_url', '')
    profile.phone_number = data.get('phone_number', '')
    profile.bio = data.get('bio', '')
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'CV saved successfully'
    })
    



# ===================== COMPANY PROFILE =====================


@app.route("/api/company/profile", methods=["GET"])
def get_company_profile():
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    profile = CompanyProfile.query.filter_by(user_id=current_user.id).first()

    if not profile:
        return jsonify({
            'success': True,
            'has_profile': False,
            'profile': None
        })

    return jsonify({
        'success': True,
        'has_profile': True,
        'profile': {
            'description': profile.description,
            'website': profile.website,
            'location': profile.location,
            'logo_url': profile.logo_url,
        }
    })


@app.route("/api/company/profile", methods=["POST"])
def update_company_profile():
    if not current_user.is_authenticated or current_user.role != 'company':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}

    required_fields = ['description', 'website', 'location']
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return jsonify({'success': False, 'message': f'{field} is required'}), 400

    profile = CompanyProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = CompanyProfile(user_id=current_user.id)
        db.session.add(profile)

    profile.description = data.get('description', '').strip()
    profile.website = data.get('website', '').strip()
    profile.location = data.get('location', '').strip()
    profile.logo_url = (data.get('logo_url') or '').strip() or None

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Profile saved successfully'
    })


# ===================== ADMIN PROFILE =====================


@app.route("/api/admin/profile", methods=["GET"])
def get_admin_profile():
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    profile = AdminProfile.query.filter_by(user_id=current_user.id).first()

    if not profile:
        return jsonify({
            'success': True,
            'has_profile': False,
            'profile': None
        })

    return jsonify({
        'success': True,
        'has_profile': True,
        'profile': {
            'phone_number': profile.phone_number,
            'department': profile.department,
            'university': profile.university,
        }
    })


@app.route("/api/admin/profile", methods=["POST"])
def update_admin_profile():
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}

    required_fields = ['phone_number', 'department', 'university']
    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return jsonify({'success': False, 'message': f'{field} is required'}), 400

    profile = AdminProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = AdminProfile(user_id=current_user.id)
        db.session.add(profile)

    profile.phone_number = data.get('phone_number', '').strip()
    profile.department = data.get('department', '').strip()
    profile.university = data.get('university', '').strip()

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Profile saved successfully'
    })


# ===================== NOTIFICATIONS =====================


@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    notifications = Notification.query.filter_by(user_id=current_user.id)\
        .order_by(Notification.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'notifications': [n.to_dict() for n in notifications.items],
        'total': notifications.total,
        'unread_count': Notification.query.filter_by(user_id=current_user.id, is_read=False).count(),
        'page': page,
        'pages': notifications.pages
    })


# جلب عدد الإشعارات غير المقروءة (للـ Header)
@app.route("/api/notifications/unread-count", methods=["GET"])
def get_unread_count():
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    
    return jsonify({
        'success': True,
        'unread_count': count
    })


# 
@app.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'success': False, 'message': 'Notification not found'}), 404
    
    if notification.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Marked as read'})



@app.route("/api/notifications/read-all", methods=["PUT"])
def mark_all_notifications_read():
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'All notifications marked as read'})



@app.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'success': False, 'message': 'Notification not found'}), 404
    
    if notification.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Notification deleted'})



def send_notification(user_id, title, message, notification_type='info', related_application_id=None, action_url=None):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        related_application_id=related_application_id,
        action_url=action_url
    )
    db.session.add(notification)
    db.session.commit()
    return notification



####PDF GENERATION###






    


@app.route("/api/download-pdf/<int:agreement_id>", methods=["GET"])
def download_pdf(agreement_id):
    
    
    agreement = InternshipAgreement.query.get(agreement_id)
    if not agreement:
        return jsonify({'success': False, 'message': 'Not found'}), 404
    
    return send_file(agreement.pdf_url, as_attachment=True)




@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)




# ===================== ADMIN: GET ALL STUDENTS =====================

@app.route("/api/admin/students", methods=["GET"])
def get_all_students():
    
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    students = User.query.filter_by(role='student').all()
    
    students_list = []
    for student in students:
        profile = StudentProfile.query.filter_by(user_id=student.id).first()
        students_list.append({
            'id': student.id,
            'name': student.full_name or student.email,
            'email': student.email,
            'university': profile.university if profile else None,
            'level': profile.level if profile else None,
            'major': profile.major if profile else None,
            'skills': profile.skills if profile else [],
            'created_at': profile.created_at.isoformat() if profile else None  # 🔥 من الـ Profile
        })
    
    
    students_list.sort(key=lambda x: x['created_at'] if x['created_at'] else '', reverse=True)
    
    return jsonify({
        'success': True,
        'students': students_list
    })
    
    
# ===================== ADMIN: GET ALL COMPANIES =====================

@app.route("/api/admin/companies", methods=["GET"])
def get_all_companies():
    
    
    if not current_user.is_authenticated or current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    companies = User.query.filter_by(role='company').all()
    
    companies_list = []
    for company in companies:
        profile = CompanyProfile.query.filter_by(user_id=company.id).first()
        companies_list.append({
            'id': company.id,
            'name': company.company_name or company.email,
            'email': company.email,
            'description': profile.description if profile else None,
            'location': profile.location if profile else None,
            'website': profile.website if profile else None,
            'created_at': profile.created_at.isoformat() if profile else None  # 🔥 من الـ Profile
        })
    
    
    companies_list.sort(key=lambda x: x['created_at'] if x['created_at'] else '', reverse=True)
    
    return jsonify({
        'success': True,
        'companies': companies_list
    })