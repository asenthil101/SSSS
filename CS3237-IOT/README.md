# IoT Secure System API Documentation

The IoT Secure System is an integrated platform designed to securely recognize and log individuals using facial recognition technology. Here's how the various components come together:

Backend with Node.js
Purpose: This is the main API server, responsible for handling user registrations, storing photo logs, and interfacing with Amazon S3 to store photos.
Features:
User Registration and Management: Users can be registered, retrieved, and deleted. Each user is identified uniquely, facilitating precise photo log association.
Photo Logs: Photos can be uploaded either as known or unknown entities. Known photos are associated with registered users, while unknown photos are sent to the ML server for identification.
Amazon S3: Photos are stored on Amazon S3, ensuring scalability and reliability.
Health Check Endpoint: A simple endpoint to ensure the server's health.
Location: Found in the ssss_api folder.
Machine Learning Server with Python and Flask
Purpose: This server is responsible for analyzing uploaded photos to determine the presence of a face and match it against known registered users.
Features:
Face Detection: Uses OpenCV's CascadeClassifier to detect faces in photos.
Face Recognition: Matches detected faces against a database of known users using the LBPH face recognizer.
Database Interaction: Uses Flask-SQLAlchemy to interact with a PostgreSQL database for user and photo log data.
Endpoint: Processes the photo and returns the recognized user's identity or an "unknown" response.
ESP32 Main Controller
Purpose: Acts as the primary user interface for the IoT system.
Features:
User Interaction: A button allows users to trigger photo-taking events.
MQTT Communication: Connects to an MQTT server to receive commands and publish events.
ESP32 Camera Module
Purpose: Captures images for processing.
Features:
Image Capture: Integrated camera takes photos when prompted.
Image Processing: Processes images and sends them to the server for facial recognition.
MQTT Communication: Subscribes to commands from the main ESP32 controller and publishes image results.
Frontend with Next.js
Purpose: Provides an interactive user interface for the IoT Secure System.

## Backend API

Welcome to the IoT Secure System API, a Node.js backend application using NestJS framework to manage users and photo logs for an IoT-based secure system.

### Directory Structure

```
ssss_api/
│
├── src/
│ ├── photo_logs.service.ts
│ ├── user.service.ts
│ ├── app.controller.ts
│ └── ... (other src files and folders)
│
└── package.json
```

### Setup and Run

#### Prerequisites:

- Node.js
- npm

### Installation:

Navigate to the ssss_api folder:

```
cd ssss_api
```

Then, install the required packages:

```
npm install
```

Running the Server:

For development:

```
npm run start:dev
```

### API Endpoints

#### Health Check

Endpoint: /health
Method: GET
Description: Check the health status of the API.

#### User Management

**Register a New User**

Endpoint: /user
Method: POST
Body: User details in JSON format.
Description: Register a new authorized user.

**Get All Users**

Endpoint: /users
Method: GET
Description: Retrieve a list of all registered users.
**Get a Single User**

Endpoint: /user/:id
Method: GET
Description: Retrieve details of a single user by their ID.
**Delete a User**

Endpoint: /user/:id
Method: DELETE
Description: Set the 'deleted' flag for a user without actually removing them from the database.
Photo Logs Management
**Create a New Photo Log of a Known Person**

Endpoint: /photo_log/:username
Method: POST
Body: Image file.
Description: Create a new photo log entry for a known person.
**Create a New General Photo Log**

Endpoint: /photo_log
Method: POST
Body: Image file.
Description: Create a new photo log entry and use ML model to identify the person in the photo.
Get All Photo Logs for a User

Endpoint: /photo_logs/:username
Method: GET
Description: Retrieve all photo logs associated with a specific user.
**Get a Single Photo Log**

Endpoint: /photo_log/:id
Method: GET
Description: Retrieve details of a single photo log by its ID.
**Delete a Photo Log**

Endpoint: /photo_log/:id
Method: DELETE
Description: Delete a specific photo log entry and its corresponding photo from the S3 storage.

### Technology Stack

Framework: NestJS
Database: Prisma (based on the usage of @prisma/client)
Cloud Storage: Amazon S3 (using @aws-sdk/client-s3)

### Environment Variables

Make sure to set up the following environment variables for the application:

AWS_ACCESS_KEY_ID: Your AWS access key ID.
AWS_SECRET_ACCESS_KEY: Your AWS secret access key.

## Machine learning model

Welcome to the IoT Secure System ML API, a Flask-based backend application that uses computer vision techniques to identify faces in photos and match them against registered users.

```
ml_api/
│
├── haarcascade_frontalface_default.xml
│
└── main.py

```

## Setup and Run

Prerequisites:

- Python
- pip
  Installation:

```
pip install flask flask_sqlalchemy cv2 PIL numpy matplotlib requests
```

Running the Server:

```
python main.py
```

## API Endpoints

**Face Identification**
Endpoint: /
Method: POST
Body: JSON containing the URL of the photo to be analyzed ({"url": "YOUR_PHOTO_URL"}).
Description: Analyzes the given photo to identify if it contains a face of a known user.
Technical Overview
Face Detection: Utilizes OpenCV's CascadeClassifier with Haar cascades to detect faces in photos.
Face Recognition: Uses OpenCV's LBPH (Local Binary Patterns Histogram) face recognizer.
Database: Uses Flask-SQLAlchemy to interact with a PostgreSQL database, storing user and photo log data.

### Utility Functions

getRecognizer(): Trains the LBPH face recognizer using registered user photos.
check_for_face(path): Checks if a photo contains a face.
confidenceofNewImage(face_recognizer, url): Determines the confidence level of a face in a photo against known users.
get_users_photos(): Fetches the photos of all registered users from the database.

### Environment Variables & Configuration

Make sure to set up the SQLAlchemy database URI in the app.config['SQLALCHEMY_DATABASE_URI'] line. The current configuration is set to a PostgreSQL database, but you can modify this as needed.

## ESP32 and ESP32Cam Documentation

This document outlines the implementation and setup of the ESP32 and ESP32Cam modules for the IoT Secure System.

### Directory Structure

```
esp32_project/
│
├── main_esp32.ino
│
└── main_esp32cam.ino
```

### ESP32 Main Controller

This module is responsible for handling user interactions with the IoT system. It communicates with the server through MQTT.

### ESP32 Camera Module

This module is responsible for capturing images through the camera, processing them, and communicating with the server.

- Make sure to correctly configure your WiFi and MQTT settings (ssid, password, server, subsribeTopic, publishTopic).
- The camera is configured to capture images when the button is pressed and send them to the server.
- Images are processed to detect and recognize faces, and the results are communicated back to the server.

## Frontend

Welcome to the frontend of the IoT Secure System. This user interface is built using the powerful Next.js framework, which is a React framework best known for its server-side rendering capabilities.

### Features

- User Authentication: Take a photo and send it to the server for processing so see if the user is a registered user.
- Photo Upload and Display: Users can upload photos, which are then processed by the backend to identify known faces.
- Register: Users can register new users to the system.
- Dashboard: Users can view all registered users and their photo logs.
