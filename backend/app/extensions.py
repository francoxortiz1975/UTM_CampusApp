from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
import sqlite3

DATABASE = "db.sqlite3"

sqlalchemy = SQLAlchemy()
bcrypt = Bcrypt()
