class User:
    """Simple user class holding essential user details."""

    id: int
    username: str
    email: str
    password: str

    def __init__(self, user_id: int, username: str, email: str, password: str) -> None:
        self.id = user_id
        self.username = username
        self.email = email
        self.password = password
