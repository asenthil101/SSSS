#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// WiFi configuration
const char* ssid = "Rocha";
const char* password = "Rocha123";

// RFID configuration
#define SS_PIN 5
#define RST_PIN 0
MFRC522 rfid(SS_PIN, RST_PIN); // Instance of the class
MFRC522::MIFARE_Key key;

String nuidPICCStr = "";
String lastTacStr = "";
String server = "http://192.168.146.6:3000";

// Initializes the RFID reader
void setupRFID() {
  SPI.begin(); // Initialize SPI bus
  rfid.PCD_Init(); // Initialize MFRC522

  // Set the key to the default MIFARE key
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }
  Serial.println(F("RFID setup completed."));
}

// Connects to WiFi with the given ssid and password
void connectToWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(F("."));
  }
  Serial.println(F("Connected to WiFi."));
  WiFi.setHostname("c3test");
}

void setup() {
  Serial.begin(9600);
  connectToWiFi();
  setupRFID();
}

void loop() {
  handleCard();
}

// Sends the card number to a server endpoint
void sendCardNumber(const String& cardNumber) {
  HTTPClient http;
  http.begin(server + "/registerCard");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> jsonDocument;
  jsonDocument["cardNumber"] = cardNumber;
  String requestBody;
  serializeJson(jsonDocument, requestBody);

  int httpResponseCode = http.POST(requestBody);
  if (httpResponseCode > 0) {
    Serial.println("Server Response: " + http.getString());
  } else {
    Serial.printf("HTTP POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// Handles card detection and processing
void handleCard() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return; // Exit if no new card is present or if the card's serial couldn't be read
  }

  // Check if the PICC is of Classic MIFARE type
  MFRC522::PICC_Type piccType = rfid.PICC_GetType(rfid.uid.sak);
  if (piccType != MFRC522::PICC_TYPE_MIFARE_MINI &&  
      piccType != MFRC522::PICC_TYPE_MIFARE_1K &&
      piccType != MFRC522::PICC_TYPE_MIFARE_4K) {
    Serial.println(F("Your tag is not of type MIFARE Classic."));
    return;
  }

  Serial.println(F("A new card has been detected."));
  readNUID();
  compareAndSendNUID();

  rfid.PICC_HaltA(); // Halt PICC
  rfid.PCD_StopCrypto1(); // Stop encryption on PCD
}

// Reads the NUID from the card and prints it
void readNUID() {
  nuidPICCStr = "";
  for (byte i = 0; i < 4; i++) {
    nuidPICCStr += (rfid.uid.uidByte[i] < 0x10 ? "0" : "") + String(rfid.uid.uidByte[i], HEX);
  }
  nuidPICCStr.toUpperCase();
  Serial.print(F("The NUID tag is: "));
  Serial.println(nuidPICCStr);
}

// Compares the new NUID with the last one and sends it to the server if different
void compareAndSendNUID() {
  if (nuidPICCStr != lastTacStr) {
    Serial.println(F("Sending NUID to the server."));
    sendCardNumber(nuidPICCStr);
    lastTacStr = nuidPICCStr;
  } else {
    Serial.println(F("Duplicate card read detected."));
  }
}

// Helper routine to dump a byte array as hex values to Serial
void printHex(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], HEX);
  }
}

// Helper routine to dump a byte array as dec values to Serial
void printDec(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], DEC);
  }
}