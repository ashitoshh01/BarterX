import requests
import json
import asyncio
import websockets
import time

BASE_URL = "http://127.0.0.1:8000/api"
WS_URL = "ws://127.0.0.1:8000/ws/chat/"

EMAIL = "ashu@gmail.com"
PASSWORD = "vvvvvvvv"

def print_result(test_name, passed, msg=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{status} - {test_name}")
    if msg:
        print(f"   {msg}")

def test_login():
    res = requests.post(f"{BASE_URL}/login/", data={"email": EMAIL, "password": PASSWORD})
    if res.status_code == 200:
        return res.json()
    else:
        # It's possible the username is needed instead of email for simple jwt default, 
        # let's try username ashu or check how login works.
        pass
    return None

def test_public_leak():
    # Test items endpoint for coin_balance leak
    res = requests.get(f"{BASE_URL}/items/")
    if res.status_code == 200:
        items = res.json()
        if 'results' in items:
            items = items['results']
        if len(items) > 0:
            owner = items[0].get('owner', {})
            if 'coin_balance' in owner:
                print_result("Public coin_balance Leak", False, "coin_balance found in public serializer.")
            else:
                print_result("Public coin_balance Leak", True, "coin_balance securely removed.")
        else:
            print("No items to test for leak.")
    else:
        print("Failed to fetch items.")

async def test_websocket_timeout():
    try:
        async with websockets.connect(WS_URL) as ws:
            start_time = time.time()
            try:
                # Wait for up to 12 seconds to see if it closes
                await asyncio.wait_for(ws.recv(), timeout=12.0)
            except websockets.exceptions.ConnectionClosed as e:
                duration = time.time() - start_time
                if e.code == 4008:
                    print_result("WebSocket auth timeout (DoS protection)", True, f"Closed with 4008 after {duration:.2f}s")
                else:
                    print_result("WebSocket auth timeout (DoS protection)", False, f"Closed with {e.code} instead of 4008")
            except asyncio.TimeoutError:
                print_result("WebSocket auth timeout (DoS protection)", False, "Connection stayed open after 12s!")
    except Exception as e:
        print(f"WS error: {e}")

def main():
    print("Running Security Tests...\n")
    
    test_public_leak()
    
    # Run async websocket test
    asyncio.run(test_websocket_timeout())

    # Note: testing update_me or admin requires auth. Let's see if login works.
    tokens = test_login()
    if not tokens:
        # Fallback try username
        res = requests.post(f"{BASE_URL}/login/", data={"username": "ashu", "password": PASSWORD})
        if res.status_code == 200:
            tokens = res.json()
            
    if tokens:
        access_token = tokens.get('access')
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test update_me verification bypass
        res = requests.patch(f"{BASE_URL}/profile/update_me/", json={"is_verified": True}, headers=headers)
        if res.status_code == 200:
            user_data = requests.get(f"{BASE_URL}/profile/", headers=headers).json()
            if 'profile' in user_data and user_data['profile'].get('is_verified', False):
                print_result("update_me Verification Bypass", False, "User managed to self-verify!")
            else:
                print_result("update_me Verification Bypass", True, "is_verified ignored successfully.")
            
            user_id = user_data.get('id')
            if user_id:
                res = requests.post(f"{BASE_URL}/admin/users/{user_id}/manage/", json={"action": "suspend"}, headers=headers)
                if res.status_code == 403:
                    print_result("Admin Privilege Escalation (Self-suspend)", True, "Prevented with 403.")
                else:
                    print_result("Admin Privilege Escalation (Self-suspend)", False, f"Allowed! Status: {res.status_code}")
                
    else:
        print("\nCould not log in to test authenticated endpoints. Ensure credentials are correct.")

if __name__ == '__main__':
    main()
