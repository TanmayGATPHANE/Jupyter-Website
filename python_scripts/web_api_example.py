# Web Scraping and API Exampleeeee
import requests
import json
from datetime import datetime

class WebAPIExample:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_json_data(self, url):
        """Fetch JSON data from an API"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data: {e}")
            return None
    
    def get_github_user_info(self, username):
        """Get GitHub user information"""
        url = f"https://api.github.com/users/{username}"
        data = self.fetch_json_data(url)
        
        if data:
            print(f"GitHub User: {username}")
            print("-" * 30)
            print(f"Name: {data.get('name', 'N/A')}")
            print(f"Bio: {data.get('bio', 'N/A')}")
            print(f"Public Repos: {data.get('public_repos', 0)}")
            print(f"Followers: {data.get('followers', 0)}")
            print(f"Following: {data.get('following', 0)}")
            print(f"Created: {data.get('created_at', 'N/A')}")
            print(f"Profile URL: {data.get('html_url', 'N/A')}")
        
        return data
    
    def get_random_fact(self):
        """Get a random fact from an API"""
        url = "https://uselessfacts.jsph.pl/random.json?language=en"
        data = self.fetch_json_data(url)
        
        if data:
            print("Random Fact:")
            print("-" * 20)
            print(data.get('text', 'No fact available'))
        
        return data
    
    def get_weather_info(self, city="London"):
        """Get weather information (using a free API)"""
        # Note: This is a placeholder - you'd need an actual API key for real weather data
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            'q': city,
            'appid': 'your_api_key_here',  # Replace with actual API key
            'units': 'metric'
        }
        
        print(f"Weather API Example for {city}")
        print("-" * 30)
        print("Note: This example requires a valid API key from OpenWeatherMap")
        print("Visit: https://openweathermap.org/api to get your free API key")
        
        # Simulate weather data
        simulated_data = {
            'name': city,
            'main': {
                'temp': 22.5,
                'feels_like': 24.1,
                'humidity': 65
            },
            'weather': [
                {'main': 'Clouds', 'description': 'partly cloudy'}
            ],
            'wind': {'speed': 3.6}
        }
        
        print(f"Temperature: {simulated_data['main']['temp']}°C")
        print(f"Feels like: {simulated_data['main']['feels_like']}°C")
        print(f"Humidity: {simulated_data['main']['humidity']}%")
        print(f"Condition: {simulated_data['weather'][0]['description']}")
        print(f"Wind Speed: {simulated_data['wind']['speed']} m/s")
        
        return simulated_data
    
    def parse_json_data(self, json_string):
        """Parse and pretty print JSON data"""
        try:
            data = json.loads(json_string)
            print("Parsed JSON Data:")
            print("-" * 20)
            print(json.dumps(data, indent=2))
            return data
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return None
    
    def save_data_to_file(self, data, filename):
        """Save data to a JSON file"""
        try:
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Data saved to {filename}")
        except Exception as e:
            print(f"Error saving file: {e}")

def demonstrate_web_apis():
    """Demonstrate various web API interactions"""
    print("Web API Demonstration")
    print("=" * 40)
    
    api_client = WebAPIExample()
    
    # Example 1: GitHub API
    print("\n1. GitHub User Information:")
    github_data = api_client.get_github_user_info("octocat")
    
    # Example 2: Random Fact API
    print("\n2. Random Fact:")
    fact_data = api_client.get_random_fact()
    
    # Example 3: Weather API (simulated)
    print("\n3. Weather Information:")
    weather_data = api_client.get_weather_info("New York")
    
    # Example 4: JSON parsing
    print("\n4. JSON Parsing Example:")
    sample_json = '{"name": "John", "age": 30, "skills": ["Python", "JavaScript", "SQL"]}'
    parsed_data = api_client.parse_json_data(sample_json)
    
    # Example 5: Save data
    if github_data:
        api_client.save_data_to_file(github_data, "github_user_data.json")

def create_sample_api_response():
    """Create a sample API response for testing"""
    sample_response = {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "data": {
            "users": [
                {"id": 1, "name": "Alice", "email": "alice@example.com"},
                {"id": 2, "name": "Bob", "email": "bob@example.com"},
                {"id": 3, "name": "Charlie", "email": "charlie@example.com"}
            ],
            "total_count": 3,
            "page": 1,
            "per_page": 10
        }
    }
    
    print("Sample API Response:")
    print(json.dumps(sample_response, indent=2))
    return sample_response

if __name__ == "__main__":
    demonstrate_web_apis()
    print("\n" + "=" * 40)
    create_sample_api_response()
