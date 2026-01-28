import json
import urllib.request
import urllib.parse
import urllib.error
import sys

BASE_URL = "http://localhost:8000"
TEST_USER = {"username": "test_frontend_integration", "password": "password123"}

def log(msg, success=True):
    icon = "[OK]" if success else "[FAIL]"
    print(f"{icon} {msg}")

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        if headers.get('Content-Type') == 'application/json':
            encoded_data = json.dumps(data).encode('utf-8')
        else:
            # Form data
            encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    else:
        encoded_data = None

    req = urllib.request.Request(url, data=encoded_data, method=method)
    
    for k, v in headers.items():
        req.add_header(k, v)

    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            response_body = response.read().decode('utf-8')
            try:
                json_data = json.loads(response_body)
            except:
                json_data = response_body
            return True, status, json_data
    except urllib.error.HTTPError as e:
        return False, e.code, e.read().decode('utf-8')
    except Exception as e:
        return False, 0, str(e)

def test_api():
    print("Starting API Integration Test (using urllib)...\n")
    
    # 1. Test Health/Root
    success, status, _ = make_request(f"{BASE_URL}/")
    if success:
        log(f"Backend is reachable ({BASE_URL}/)")
    else:
        log(f"Backend returned {status}", False)
        return

    # 2. Test Registration
    headers = {'Content-Type': 'application/json'}
    success, status, resp = make_request(f"{BASE_URL}/register", "POST", TEST_USER, headers)
    if success or status == 400: # 400 is fine if user already exists
        log("Registration endpoint works (/register)")
    else:
        log(f"Registration failed: {status} - {resp}", False)

    # 3. Test Login (Form Data)
    # No Content-Type json header makes it form-urlencoded by default in my helper if data is passed
    success, status, resp = make_request(f"{BASE_URL}/login", "POST", TEST_USER)
    
    token = None
    if success:
        token = resp.get("access_token")
        if token:
            log("Login successful & Token received (/login)")
        else:
            log("Login response missing access_token", False)
    else:
        log(f"Login failed: {status} - {resp}", False)

    if not token:
        print("\n⚠️ Cannot proceed with authenticated tests without token.")
        return

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 4. Test Get All Users
    success, status, users = make_request(f"{BASE_URL}/user", "GET", None, auth_headers)
    current_user_id = None
    
    if success and isinstance(users, list):
        log(f"Fetch Users successful - Found {len(users)} users (/user)")
        for u in users:
            if u.get('username') == TEST_USER['username']:
                current_user_id = u.get('id')
                break
    else:
        log(f"Fetch Users failed: {status}", False)

    # 5. Test Get Messages
    if current_user_id:
        # Test getting messages with self or user ID 1
        target_id = 1 if current_user_id != 1 else current_user_id
        endpoint = f"/messages/{current_user_id}/{target_id}"
        success, status, msgs = make_request(f"{BASE_URL}{endpoint}", "GET", None, auth_headers)
        
        if success:
            log(f"Fetch Messages successful ({endpoint})")
        else:
            log(f"Fetch Messages failed: {status}", False)
    else:
        log("Skipping message test (could not find current user ID)", False)

    print("\nTest Complete")

if __name__ == "__main__":
    test_api()
