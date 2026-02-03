class StatusReport:
    """A simple class that implements status reports, with the information of the users that created them"""
    id: int
    username: str
    status: int
    time: str
    
    def __init__(self, status_id: int, username: str, status: int, time: str) -> None:
        self.id = status_id
        self.username = username
        self.status = status
        self.time = time
