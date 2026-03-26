from ..extensions import sqlalchemy

class Event(sqlalchemy.Model):
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    name = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    date = sqlalchemy.Column(sqlalchemy.String(50), nullable=False)
    location = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "date": self.date,
            "location": self.location
        }
    
    def add(self):
        sqlalchemy.session.add(self)

    def commit(self):
        sqlalchemy.session.commit()
    
    def save(self):
        self.add()
        self.commit()