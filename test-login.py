import urllib.request
import json
import ssl

def handle_request(req):
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, context=ctx) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return None, str(e)

base_url = 'http://localhost:3000/api/v1'

req1 = urllib.request.Request(f'{base_url}/auth/login', method='POST')
req1.add_header('Content-Type', 'application/json')
data = json.dumps({"email": "admin@test.com", "password": "Secret123!"}).encode('utf-8')
req1.data = data
status, body = handle_request(req1)
print('POST /auth/login', status, body)
