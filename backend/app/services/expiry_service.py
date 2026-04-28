from datetime import date

def get_days_left(expiry_date):
    if expiry_date is None:
        return None
    return (expiry_date - date.today()).days

def get_food_status(days_left):
    if days_left is None:
        return "unknown"
    if days_left <= 1:
        return "expiring"
    if days_left <= 3:
        return "useSoon"
    return "fresh"