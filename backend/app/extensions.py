"""Application extensions initialization module.

Initializes SQLAlchemy, JWTManager, and CORS instances.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
