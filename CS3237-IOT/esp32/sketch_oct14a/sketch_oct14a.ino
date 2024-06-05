#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "Arduino.h"
#include "ESP32MQTTClient.h"
#include <ArduinoJson.h>

#define FLASH_PIN 4
#define HTTPCLIENT_DEFAULT_TCP_TIMEOUT (50000)

//IMPORTANT EACH CAMARA HAS OWN ID
const int id = 1;

// Replace with your network credentials
const char *ssid = "Rocha";
const char *password = "Rocha123";
String httpServer = "http://192.168.83.6:3000";

// MQTT
char *server = "mqtt://192.168.83.6:1883";
String baseTopic = "photo_log/";
String subscribeTopic = baseTopic + "take_picture/" + String(id);
String publishTopic = baseTopic + "person_in_picture/" + String(id);
ESP32MQTTClient mqttClient;

volatile bool isSendingPhoto = false;
camera_fb_t *fb = NULL;


void setup_mqtt() {
  // Initialize device.
  log_i();
  log_i("setup, ESP.getSdkVersion(): ");
  log_i("%s", ESP.getSdkVersion());

  mqttClient.enableDebuggingMessages();

  mqttClient.setURI(server);
  mqttClient.enableLastWillMessage("lwt", "I am going offline");
  mqttClient.setKeepAlive(70);
}

void connect_to_wifi_own() {

  WiFi.begin(ssid, password);
  WiFi.setHostname("c3test");
}

void setup() {
  Serial.begin(115200);
  setup_mqtt();
  connect_to_wifi_own();

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;


  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 5;
    config.fb_count = 1;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 6;
    config.fb_count = 1;
  }

  // Initialize the camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  pinMode(FLASH_PIN, OUTPUT);
  digitalWrite(FLASH_PIN, LOW);  // Make sure the flash is off initially

  delay(5000);
  //Publish readings
  mqttClient.loopStart();
  while (mqttClient.isConnected() == false) {
    Serial.print(F("."));
    delay(500);
  };
}

void takePhoto(const String &payload) {
  if (isSendingPhoto) {
        Serial.println("Still sending previous photo, skipping this capture");
        return;
    }

  Serial.println("Taking photo...");

  // Turn on the flash
  digitalWrite(FLASH_PIN, HIGH);

  
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  Serial.printf("Captured a photo with width %dpx and height %dpx!\n", fb->width, fb->height);

  // Turn off the flash after capturing
  digitalWrite(FLASH_PIN, LOW);

  // Send the image to the server
  sendPhoto(fb->buf, fb->len);

  // Return the frame buffer back to the driver for reuse
  esp_camera_fb_return(fb);
}

void onConnectionEstablishedCallback(esp_mqtt_client_handle_t client) {
  if (mqttClient.isMyTurn(client))  // can be omitted if only one client
  {
    Serial.println("CONECTED ");
    mqttClient.subscribe(subscribeTopic, takePhoto);
  }
}

esp_err_t handleMQTT(esp_mqtt_event_handle_t event) {
  mqttClient.onEventCallback(event);
  return ESP_OK;
}

void loop() {
  //Void for now
}

void sendPhoto(uint8_t *data, size_t size) {
    isSendingPhoto = true;
    HTTPClient http;
    http.setTimeout(60000);
    http.begin(httpServer + "/photo_log");
    http.addHeader("Content-Type", "multipart/form-data; boundary=boundary");

    String header = "--boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"photo.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
    String footer = "\r\n--boundary--\r\n";

    uint8_t *totalPayload = new uint8_t[header.length() + size + footer.length()];
    memcpy(totalPayload, header.c_str(), header.length());
    memcpy(totalPayload + header.length(), data, size);

    // Return the frame buffer back to the driver for reuse
    esp_camera_fb_return(fb);

    memcpy(totalPayload + header.length() + size, footer.c_str(), footer.length());

    http.setConnectTimeout(60000);
    int httpResponseCode = http.POST(totalPayload, header.length() + size + footer.length());
    delete[] totalPayload;

   if (httpResponseCode > 0) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    const char *username = doc["username"];
    const char *cardNumber = doc["cardNumber"];

    if (username) {
      Serial.printf("[HTTP] Extracted username: %s\n", username);
      mqttClient.publish(publishTopic,cardNumber, 0, false);
    } else {
      mqttClient.publish(publishTopic, "unknown", 0, false);
      Serial.println("[HTTP] Failed to extract username from the response.");
    }

  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

    http.end();
    isSendingPhoto = false;
}