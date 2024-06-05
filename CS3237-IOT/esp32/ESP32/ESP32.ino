#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#include "Arduino.h"
#include "ESP32MQTTClient.h"
#include "esp_camera.h"
// #include <LCD_I2C.h>
#include <ESP32Servo.h>
#include <MFRC522.h>
#include <SPI.h>
// LED


//Id for the corresponding!!
const int id = 1;

// WiFi and MQTT configuration
const char* ssid = "Rocha";
const char* password = "Rocha123";
String httpServer = "http://192.168.83.6:3000";

char *server = "mqtt://192.168.83.6:1883";
String baseTopic = "photo_log/";
String subscribeTopic = baseTopic + "person_in_picture/" + String(id);
String publishTopic = baseTopic + "take_picture/" + String(id);

ESP32MQTTClient mqttClient;

// Button configuration
#define SWITCH 4
byte state = LOW;
byte lastButtonState = LOW;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;

// RFID configuration
#define SS_PIN 5
#define RST_PIN 0
MFRC522 rfid(SS_PIN, RST_PIN); // Instance of the class
MFRC522::MIFARE_Key key; 

byte nuidPICC[4];
byte knownTac[4] = {68,41,92,200};

String nuidPICCStr = "";
String knownTacStr = "";

// Servo configuration
int APin = 16;
ESP32PWM pwm;
int freq = 50;

// Safe
bool KNOW = true;
bool safeOpen = false;       // Initialize safe state as closed
unsigned long openTime = 0;  // Variable to store the time the safe was opened
const unsigned long openDuration = 10000;

// Led configuration
#define PIN 15
#define NUMPIXELS 12
LiquidCrystal_I2C lcd(0x27,2,1,0,4,5,6,7,3, POSITIVE);
unsigned long pixelPrevious = 0;   // Previous Pixel Millis
int pixelInterval = 50;            // Pixel Interval (ms)
uint16_t pixelNumber = NUMPIXELS;  // Total Number of Pixels

void setup_mqtt(){
    log_i();
    log_i("setup, ESP.getSdkVersion(): ");
    log_i("%s", ESP.getSdkVersion());
    mqttClient.enableDebuggingMessages();
    mqttClient.setURI(server);
    mqttClient.enableLastWillMessage("lwt", "I am going offline");
    mqttClient.setKeepAlive(30);
}

void setup_servo() {
  pwm.attachPin(APin, freq, 10);  // 1KHz 8 bit
  pwm.write(0);
}

void setup_led() {
  lcd.begin (16,2);
  lcd.setBacklight(HIGH);
  lcd.setCursor(0,0);
  lcd.print("Setup Complete");
}

void setup_rfid() {
  SPI.begin(); // Init SPI bus
  rfid.PCD_Init(); // Init MFRC522 

  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }

  Serial.println(F("RFID setup cmpleted"));
  // Serial.println(F("This code scan the MIFARE Classsic NUID."));
  // Serial.print(F("Using the following key:"));
  // printHex(key.keyByte, MFRC522::MF_KEY_SIZE);
}

void connect_to_wifi_own(){
    WiFi.begin(ssid, password);
    WiFi.setHostname("c3test");
}

void onMessageReceived(const String &payload) {
    // This function will be called when a message is received on "photo_log/person_in_picture"
    lcd.clear();
    lcd.setCursor(0,0);
    if(payload == "00000000"){
      lcd.print("No access!");
    }else{
      lcd.print("Scan card!");
    }
    
    Serial.println(payload);
    updateTac(payload);
}

void setup() {
    Serial.begin(9600);
    pinMode(SWITCH, INPUT_PULLUP);
    delay(1000);
    setup_rfid();
    setup_servo();

    // // // lcd.begin(); // If you are using more I2C devices using the Wire library use lcd.begin(false)
    // // //              // this stop the library(LCD_I2C) from calling Wire.begin()
    // // // lcd.backlight();
    
    // Setup MQTT and WiFi
    setup_mqtt();
    connect_to_wifi_own();
    
    // Connect to MQTT
    mqttClient.loopStart();
    while (mqttClient.isConnected() == false) {
        Serial.print(F("."));
        delay(500);
    }
   
    setup_led();
}

void loop() {
    // lcd.print("     Hello"); // You can make spaces using well... spaces
    int reading = digitalRead(SWITCH);
    if (reading != lastButtonState) {
        lastDebounceTime = millis();
    }
    if ((millis() - lastDebounceTime) > debounceDelay) {
        if (reading != state) {
            state = reading;
            if (state == HIGH) {
                Serial.println("sending");
                lcd.clear();
                lcd.setCursor(0,0);
                lcd.print("Taking picture.");
                mqttClient.publish(publishTopic, "Button Pressed", 0, false);
            }
        }
    }
    lastButtonState = reading;

    // Check if the safe has been open for more than 10 seconds and close it
  if (safeOpen && (millis() - openTime > openDuration)) {
    Serial.println("TIMEOUT: CLOSE THE SAFE");
    closeSafe();
  }

    handleCard();
}

esp_err_t handleMQTT(esp_mqtt_event_handle_t event)
{
    mqttClient.onEventCallback(event);
    return ESP_OK;
}

void onConnectionEstablishedCallback(esp_mqtt_client_handle_t client)
{
    if (mqttClient.isMyTurn(client)) // can be omitted if only one client
    {
      Serial.println("CONECTED ");
       // Subscribe to the topic
      mqttClient.subscribe(subscribeTopic, onMessageReceived);
    }
}

void updateTac(const String payload) {
  // Payload contains the new card ID as a string
  if (payload.length() == 8) {
    for (int i = 0; i < 4; i++) {
      knownTac[i] =
          strtol(payload.substring(i * 2, (i * 2) + 2).c_str(), NULL, 16);
    }

    Serial.println("Updated knownTac array with the new card ID.");
    Serial.print("knownTac: ");
    for (int i = 0; i < 4; i++) {
      Serial.print(knownTac[i], HEX);
      Serial.print(" ");
    }
  } else {
    Serial.println(
        "Invalid payload format. The payload should be 8 characters long (4 "
        "bytes in hexadecimal).");
  }
}

void handleCard() {
  // Look for new cards
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  // Serial.print(F("PICC type: "));
  MFRC522::PICC_Type piccType = rfid.PICC_GetType(rfid.uid.sak);
  // Serial.println(rfid.PICC_GetTypeName(piccType));

  // Check is the PICC of Classic MIFARE type
  if (piccType != MFRC522::PICC_TYPE_MIFARE_MINI &&
      piccType != MFRC522::PICC_TYPE_MIFARE_1K &&
      piccType != MFRC522::PICC_TYPE_MIFARE_4K) {
    Serial.println(F("Your tag is not of type MIFARE Classic."));
    return;
  }

  // Store NUID into nuidPICC array
  for (byte i = 0; i < 4; i++) {
    nuidPICC[i] = rfid.uid.uidByte[i];
  }

  Serial.println(F("The NUID tag is:"));
  Serial.print(F("In hex: "));
  printHex(rfid.uid.uidByte, rfid.uid.size);
  Serial.println();
  Serial.print(F("In dec: "));
  printDec(rfid.uid.uidByte, rfid.uid.size);
  Serial.println();

  for (int i = 0; i < 4; i++) {
    if (knownTac[i] != nuidPICC[i]) {
      KNOW = false;
      Serial.println("KNOW is False");
      break;
    } else {
      KNOW = true;
      Serial.println("KNOW is True");
    }
  }

  // Halt PICC
  rfid.PICC_HaltA();

  // Stop encryption on PCD
  rfid.PCD_StopCrypto1();

  // Convert knownTac from byte array to String
  String knownTacStr = "";
  for (int i = 0; i < sizeof(knownTac); i++) {
    if (knownTac[i] < 0x10) knownTacStr += "0";  // Add leading zero for single digit hex
    knownTacStr += String(knownTac[i], HEX);     // Convert byte to hex string
  }
  knownTacStr.toUpperCase();
  Serial.println(knownTacStr);

  String readID = "";
  for (int i = 0; i < sizeof(nuidPICC); i++) {
    if (nuidPICC[i] < 0x10) readID += "0";  // Add leading zero for single digit hex
    readID += String(nuidPICC[i], HEX);     // Convert byte to hex string
  }

  readID.toUpperCase();
  Serial.println(readID);


  if (KNOW) {
    Serial.print("OPEN THE SAFE");
    if (!safeOpen) {
      Serial.println("OPEN");
      // Call api of logs
      openSafe();
      login(knownTacStr); // Use knownTacStr here
    } else {
      Serial.println("CLOSE THE SAFE");
      closeSafe();
    }
  } else {
    sendStolenCard(readID);
    Serial.print("Call api of stolen");
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Unknown ID");
    lcd.setCursor(0,1);
    lcd.print("No Access!");
    Serial.print("UnKNOW ID. NO ACCESS");
  }
}
void sendStolenCard(String cardNumber) {
  HTTPClient http;
  http.begin(httpServer + "/stolenCard"); // Replace with your server address
  http.addHeader("Content-Type", "application/json");

  // Create JSON object with the card number
  StaticJsonDocument<200> jsonDocument;
  jsonDocument["cardNumber"] = cardNumber;
  String requestBody;
  serializeJson(jsonDocument, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Server Response: " + response);
  } else {
    Serial.printf("HTTP POST... failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

void login(String cardNumber) {
  HTTPClient http;
  http.begin(httpServer + "/loginLog"); // Replace with your server address
  http.addHeader("Content-Type", "application/json");

  // Create JSON object with the card number
  StaticJsonDocument<200> jsonDocument;
  jsonDocument["cardNumber"] = cardNumber;
  String requestBody;
  serializeJson(jsonDocument, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Server Response: " + response);
  } else {
    Serial.printf("HTTP POST... failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

/**
 * Helper routine to dump a byte array as hex values to Serial. 
 */
void printHex(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], HEX);
  }
}

/**
 * Helper routine to dump a byte array as dec values to Serial.
 */
void printDec(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], DEC);
  }
}

void openSafe() {
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Safe open!");
  safeOpen = true;
  openTime = millis();  // Set the time the safe was opened
  pwm.writeScaled(0.04);
  delay(1000);
}

void closeSafe() {
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Safe closed!");
  safeOpen = false;
  pwm.writeScaled(0.1);
  delay(1000);
}


