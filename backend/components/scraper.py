import requests
from bs4 import BeautifulSoup

def scrape_data():
    url = "https://example.com"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    items = [el.text for el in soup.select("h2.title")]  # Example selector
    return items