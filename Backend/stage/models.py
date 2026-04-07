from stage import db , login_manager
from flask_login import UserMixin
from datetime import datetime


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model , UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120) , unique=True , nullable=False)
    password = db.Column(db.String(120) , nullable = False)
    role = db.Column(db.String(20) , nullable = False)

    full_name = db.Column(db.String(100) , nullable = True)
    company_name = db.Column(db.String(100) , nullable = True) 
    
    
    def __repr__(self):
        return f"User('{self.full_name}' , '{self.company_name}' , '{self.email}' , '{self.role}')"
    

class StudentProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    skills = db.Column(db.JSON, default=[])
    github_url = db.Column(db.String(200))          
    level = db.Column(db.String(20))                  # L1, L2, L3, M1, M2
    major = db.Column(db.String(100))      
    bio = db.Column(db.Text)                         
    university = db.Column(db.String(100))           
    phone_number = db.Column(db.String(20))         
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    

class CompanyProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    description = db.Column(db.Text)
    logo_url = db.Column(db.String(200))
    website = db.Column(db.String(200))
    location = db.Column(db.String(100))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AdminProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    phone_number = db.Column(db.String(20))
    department = db.Column(db.String(100))  
    university = db.Column(db.String(100))  
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InternshipOffer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    required_skills = db.Column(db.JSON)
    location = db.Column(db.String(100))
    duration = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)  # 🔥 جديد
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    company = db.relationship('User', backref='offers')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'required_skills': self.required_skills,
            'location': self.location,
            'duration': self.duration,
            'company_name': self.company.company_name if self.company else None,
            'is_active': self.is_active,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat()
        }


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('internship_offer.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    offer = db.relationship('InternshipOffer', backref='applications')
    student = db.relationship('User', backref='applications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'offer_id': self.offer_id,
            'offer_title': self.offer.title if self.offer else None,
            'offer_company': self.offer.company.company_name if self.offer and self.offer.company else None,
            'student_id': self.student_id,
            'student_name': self.student.full_name or self.student.email if self.student else None,
            'status': self.status,
            'applied_at': self.applied_at.isoformat()
        }
        
        



class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')
    is_read = db.Column(db.Boolean, default=False)
    related_application_id = db.Column(db.Integer, nullable=True)
    action_url = db.Column(db.String(200), nullable=True)  # 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'related_application_id': self.related_application_id,
            'action_url': self.action_url,  # 
            'created_at': self.created_at.isoformat(),
            'time_ago': self.get_time_ago()
        }
    
    def get_time_ago(self):
        now = datetime.utcnow()
        diff = now - self.created_at
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600} hour{'s' if diff.seconds // 3600 > 1 else ''} ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60} minute{'s' if diff.seconds // 60 > 1 else ''} ago"
        else:
            return "Just now"
        




class InternshipAgreement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('application.id'), unique=True, nullable=False)
    
    pdf_url = db.Column(db.String(200))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    generated_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    
    
    application = db.relationship('Application', backref='agreement')
    admin = db.relationship('User', foreign_keys=[generated_by])