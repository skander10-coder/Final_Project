from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

app.config["SECRET_KEY"] = "secret"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///mydb.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Gemini API Key (from .env file)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

CORS(app, 
     origins=["http://localhost:5173"],  
     supports_credentials=True,           
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

login_manager = LoginManager(app)

from stage import routes
from stage import models