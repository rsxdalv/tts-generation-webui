from datetime import datetime


def generate_relative_date(date: datetime):
    now = datetime.now()
    diff = now - date
    if diff.days > 0:
        return f"{diff.days} days ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600} hours ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60} minutes ago"
    else:
        return f"{diff.seconds} seconds ago"