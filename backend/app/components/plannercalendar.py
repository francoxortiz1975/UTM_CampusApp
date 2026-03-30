from datetime import datetime

from ..extensions import sqlalchemy


class PlannerCalendar(sqlalchemy.Model):
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id"),
        unique=True,
        nullable=False,
    )
    calendar_text = sqlalchemy.Column(sqlalchemy.Text, nullable=False)
    updated_at = sqlalchemy.Column(
        sqlalchemy.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    @classmethod
    def get_by_user_id(cls, user_id: int):
        return cls.query.filter_by(user_id=user_id).first()

    @classmethod
    def save_for_user(cls, user_id: int, calendar_text: str):
        record = cls.get_by_user_id(user_id)

        if record is None:
            record = cls(user_id=user_id, calendar_text=calendar_text)
            sqlalchemy.session.add(record)
        else:
            record.calendar_text = calendar_text
            record.updated_at = datetime.utcnow()

        sqlalchemy.session.commit()
        return record

    def to_dict(self):
        return {
            "calendar_text": self.calendar_text,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
