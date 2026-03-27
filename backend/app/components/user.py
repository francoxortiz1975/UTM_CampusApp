from ..extensions import sqlalchemy, bcrypt

class User(sqlalchemy.Model):
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    email = sqlalchemy.Column(sqlalchemy.String(120), unique=True, nullable=False)
    password_hash = sqlalchemy.Column(sqlalchemy.String(128), nullable=False)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def add(self):
        sqlalchemy.session.add(self)

    def commit(self):
        sqlalchemy.session.commit()
    
    def save(self):
        self.add()
        self.commit()

