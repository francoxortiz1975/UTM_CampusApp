from datetime import datetime, timedelta
from flask import Blueprint, request, session
from ..extensions import sqlalchemy
from sqlalchemy import func

class LostAndFound(sqlalchemy.Model):
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id"),
        nullable=False,
    )
    item = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)
    desc = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)
    created_at = sqlalchemy.Column(
        sqlalchemy.DateTime, nullable=False, default=datetime.now
    )

    def add(self):
        sqlalchemy.session.add(self)

    def commit(self):
        sqlalchemy.session.commit()

    def save(self):
        self.add()
        self.commit()

    def to_dict(self):
        """report in a dictionary format"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "current_user_id": session.get("user_id"),
            "item": self.item,
            "desc": self.desc,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def get_all(cls):
        return cls.query.all()
    
    @classmethod
    def delete_older_than_week(cls):
        cutoff = datetime.now() - timedelta(days=7)

        old_items = cls.query.filter(cls.created_at < cutoff).all()
        old_item_ids = [item.id for item in old_items]

        if old_item_ids:
            Comments.query.filter(Comments.post_id.in_(old_item_ids)).delete(synchronize_session=False)

            cls.query.filter(cls.id.in_(old_item_ids)).delete(synchronize_session=False)

            sqlalchemy.session.commit()

    @classmethod
    def get_by_id(cls, entry_id):
        return cls.query.filter_by(id=entry_id).first()
    
    @classmethod
    def delete_by_id(cls, entry_id):
        entry = cls.query.filter_by(id=entry_id).first()

        if not entry:
            return False  # not found

        sqlalchemy.session.delete(entry)
        sqlalchemy.session.commit()
        return True

    @classmethod
    def update_by_id(cls, entry_id, item=None, desc=None):
        entry = cls.query.filter_by(id=entry_id).first()

        if not entry:
            return None  # not found

        if item is not None:
            entry.item = item

        if desc is not None:
            entry.desc = desc

        sqlalchemy.session.commit()
        return entry
    
class Comments(sqlalchemy.Model):
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True) #this comments id
    post_id = sqlalchemy.Column( #the post its on's id
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("lost_and_found.id"),
        nullable=False,
    )
    user_id = sqlalchemy.Column( #users id
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id"),
        nullable=False,
    )
    comment = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)
    created_at = sqlalchemy.Column(
        sqlalchemy.DateTime, nullable=False, default=datetime.now
    )

    def add(self):
        sqlalchemy.session.add(self)

    def commit(self):
        sqlalchemy.session.commit()

    def save(self):
        self.add()
        self.commit()

    def to_dict(self):
        """report in a dictionary format"""
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user_id": self.user_id,
            "current_user_id": session.get("user_id"),
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }
    
    @classmethod
    def get_all_by_post_id(cls, post_id):
        return cls.query.filter_by(post_id=post_id).all()
    
    @classmethod
    def delete_by_id(cls, entry_id):
        entry = cls.query.filter_by(id=entry_id).first()

        if not entry:
            return False  # not found

        sqlalchemy.session.delete(entry)
        sqlalchemy.session.commit()
        return True
