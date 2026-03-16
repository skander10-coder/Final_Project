from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_cors import CORS

app = Flask(__name__)

app.config["SECRET_KEY"] = "secret"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///mydb.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False



db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


CORS(app, 
     origins=["http://localhost:5173"],  
     supports_credentials=True,           
     methods=["GET", "POST", "PUT", "DELETE"])

login_manager = LoginManager(app)


from stage import routes
from stage import models