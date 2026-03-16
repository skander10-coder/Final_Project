from stage import db , login_manager
from flask_login import UserMixin

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