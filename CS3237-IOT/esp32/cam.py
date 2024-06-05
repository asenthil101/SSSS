import network
import time
import urequests as requests
import machine
import esp32

# Set your Wi-Fi credentials
SSID = 'YourWiFiSSID'
PASSWORD = 'YourWiFiPassword'

# Set the web server URL where you want to upload the photo
UPLOAD_URL = 'http://your-web-server.com/upload_photo_endpoint'  # Replace with your actual URL

# Initialize Wi-Fi connection
sta = network.WLAN(network.STA_IF)
sta.active(True)
sta.connect(SSID, PASSWORD)

# Wait for Wi-Fi connection
while not sta.isconnected():
    pass

# Initialize the camera
camera = esp32.ESP32Camera()
camera.init()

# Capture a photo
photo = camera.capture()

# Prepare the photo data for HTTP POST
files = {'photo': ('photo.jpg', photo)}

# Upload the photo to the web server as multipart form data
response = requests.post(UPLOAD_URL, files=files)

# Check the server response
if response.status_code == 200:
    print('Photo uploaded successfully')
else:
    print('Failed to upload photo')

# Clean up resources
camera.deinit()
sta.disconnect()
