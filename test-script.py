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

# 1. POST Create
req1 = urllib.request.Request(f'{base_url}/public-reports', method='POST')
req1.add_header('Content-Type', 'application/json')
data = json.dumps({"nic": "901234567V"}).encode('utf-8')
req1.data = data
status, body = handle_request(req1)
print('POST /public-reports', status, body)

if status != 201:
    exit()

report_id = json.loads(body)['data']['report']['_id']

steps = [
    {"waterSource": "well"},
    {
      "location": {
        "district": "Colombo",
        "city": "Nugegoda",
        "coordinates": {"lat": 6.9, "lng": 79.8}
      }
    },
    {"testingMethod": "observation"},
    {"appearance": {"value": "clear", "notes": ""}, "turbidity": {"value": "clear"}}
]

for i, step in enumerate(steps):
    req = urllib.request.Request(f'{base_url}/public-reports/{report_id}', method='PATCH')
    req.add_header('Content-Type', 'application/json')
    req.data = json.dumps(step).encode('utf-8')
    status, body = handle_request(req)
    print(f'PATCH step {i}', status, body)

req2 = urllib.request.Request(f'{base_url}/public-reports/{report_id}/submit', method='POST')
req2.add_header('Content-Type', 'application/json')
status, body = handle_request(req2)
print('POST /submit', status, body)
