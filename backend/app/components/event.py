from ..extensions import sqlalchemy

class Event(sqlalchemy.Model):
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    name = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    org = sqlalchemy.Column(sqlalchemy.String(100), nullable=False)
    date = sqlalchemy.Column(sqlalchemy.String(50), nullable=False)
    location = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)
    desc = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)
    status = sqlalchemy.Column(sqlalchemy.Integer, nullable=False) #0 is accepted event, 1 is pending review
    time = sqlalchemy.Column(sqlalchemy.String(6), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "org": self.org,
            "date": self.date,
            "time": self.time,
            "location": self.location,
            "desc": self.desc,
            "status": self.status,
        }
    
    def add(self):
        sqlalchemy.session.add(self)

    def commit(self):
        sqlalchemy.session.commit()
    
    def save(self):
        self.add()
        self.commit()

    @classmethod
    def get_pending_events(cls):
        return cls.query.filter_by(status=1).all()
    
    @classmethod
    def get_by_id(cls, event_id):
        return cls.query.filter_by(id=event_id).first()

    @classmethod
    def get_by_month_and_accepted(cls, month):
        """
        month: string like '01', '02', ..., '12'
        """
        return cls.query.filter(
            cls.status == 0,
            cls.date.like(f"%-{month}-%")
        ).all()

    @classmethod
    def delete_by_id(cls, event_id: int) -> bool:
        """Deletes the event with the given ID. Returns True if deleted, False if not found."""
        event = cls.query.get(event_id)
        if not event:
            return False
        sqlalchemy.session.delete(event)
        sqlalchemy.session.commit()
        return True