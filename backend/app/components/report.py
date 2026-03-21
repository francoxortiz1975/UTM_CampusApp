from datetime import datetime
from ..extensions import sqlalchemy
from sqlalchemy import func


class Report(sqlalchemy.Model):
    """
    Model representing a user report stored in the database.
    Each report is linked to a user and timestamped so it can be
    queried by month, weekday, and time.
    """

    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    user_id = sqlalchemy.Column(
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("user.id"),
        nullable=False,
    )
    title = sqlalchemy.Column(sqlalchemy.String(200), nullable=False)
    content = sqlalchemy.Column(sqlalchemy.Text, nullable=True)
    created_at = sqlalchemy.Column(
        sqlalchemy.DateTime, nullable=False, default=datetime.now
    )

    # ── helpers ──────────────────────────────────────────────

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
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "month": self.created_at.month,
            "weekday": self.created_at.strftime("%A"),
            "time": self.created_at.strftime("%H:%M"),
        }

    # ── fast query function ──────────────────────────────────

    @staticmethod
    def query_reports(month=None, weekday=None, time_start=None, time_end=None, user_id=None, title=None, location=None):
        """
        Perform a fast, indexed-friendly query on reports.

        Parameters
        ----------
        month : int | None
            Calendar month (1–12).
        weekday : int | None
            Day of the week as an integer.
            0 = Sunday, 1 = Monday, …, 6 = Saturday
        time_start : str | None
            Lower bound of the time window, inclusive ("08:00").
        time_end : str | None
            Upper bound of the time window, inclusive ("17:00").
        user_id : int | None
            If provided, only return reports belonging to this user.

        Returns
        -------
        list[Report]
            A list of Report objects matching all supplied filters.
        """
        query = Report.query

        # Filter by user if specified
        if user_id is not None:
            query = query.filter(Report.user_id == user_id)

        # Filter by month (1-12) — SQLite: strftime('%m', col) returns '01'..'12'
        if month is not None:
            query = query.filter(
                func.cast(func.strftime("%m", Report.created_at), sqlalchemy.Integer) == month
            )
        # Filter by weekday (0=Sun … 6=Sat) — SQLite: strftime('%w', col)
        if weekday is not None:
            query = query.filter(
                func.cast(func.strftime("%w", Report.created_at), sqlalchemy.Integer) == weekday
            )
        # Filter by time window — compare 'HH:MM' strings (lexicographic order works)
        if time_start is not None:
            query = query.filter(
                func.strftime("%H:%M", Report.created_at) >= time_start
            )
        if time_end is not None:
            query = query.filter(
                func.strftime("%H:%M", Report.created_at) <= time_end
            )
        if title is not None:
            query = query.filter(Report.title.contains(title))
        if location is not None:
            if title == 'gym' or title == 'parking':
                query = query.filter(func.json_extract(Report.content, "$.location") == location)
            elif title == 'food':
                query = query.filter(func.json_extract(Report.content, "$.restaurant_id") == location)
        # Order newest first for convenience
        query = query.order_by(Report.created_at.desc())
        return query.all()
