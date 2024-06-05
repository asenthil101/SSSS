from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask import Flask, jsonify, request
import urllib.request
import face_recognition
import json
from json import JSONEncoder
import numpy



class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, numpy.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)



db = SQLAlchemy()
prev_database = None

class User(db.Model):
    __tablename__ = 'User'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    registeredAt = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)
    photos = db.relationship('PhotoLog', backref='user', lazy=True)
    faceEmbeddings = db.Column(db.JSON, nullable=True)

class PhotoLog(db.Model):
    __tablename__ = 'PhotoLog'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    url = db.Column(db.String(200), unique=True, nullable=False)
    time = db.Column(db.DateTime, default=datetime.utcnow)
    userId = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://rocha:123@localhost:5432/iot"
db.init_app(app)


def check_for_face(url):
    url_res = urllib.request.urlopen(url)
    img = face_recognition.load_image_file(url_res)
    unknown_face_encodings = face_recognition.face_encodings(img)
    if not unknown_face_encodings:
        return False
    return True

def predict(database ,url):
    url_res = urllib.request.urlopen(url)
    img = face_recognition.load_image_file(url_res)
    unknown_face_encodings = face_recognition.face_encodings(img)
    if not unknown_face_encodings:
        return "No faces found in the image."
    results = []
    for person_name, encodings in database.items():
        for encoding in unknown_face_encodings:
            match = face_recognition.compare_faces(encodings, encoding)
            if any(match):
                results.append(person_name)
    return results


@app.route('/', methods=['POST'])
def init():
    # # Get the new photo from the request body "url"
    url =  request.json['url']
    print(url)
    # # Check if the photo has a face
    if not check_for_face(url):
        print("No face detected check_for_face")
        return jsonify({"message": "No face detected"}), 400
   

    users = User.query.all()
    database = {}
    # Iterate the photos each one is a user
    for user in users:
        if user.faceEmbeddings:
            database[user.id] = json.loads(user.faceEmbeddings)
        else:
            database[user.id] = []
    result = predict(database,url)
    if not result:
        return jsonify({"username": "unknown"}), 400
    else:
        # Get the user id from the database
        user = User.query.filter_by(id=result[0]).first()
        # Add the embeding to the user
        # addEmbeddingToUser(user.username)
        return jsonify({"label": result[0]}), 200


@app.route('/newPhoto', methods=['POST'])
def newPhoto():
    print("adding new")
    print(request)
    #recive username
    usr = request.json['username']
    return addEmbeddingToUser(usr)

def addEmbeddingToUser(usr):
    user = User.query.filter_by(username=usr).first()
    if not user:
        print("User not found")
        return jsonify({"message": "User not found"}), 400
    new_photo = PhotoLog.query.filter_by(userId=user.id).order_by(PhotoLog.createdAt.desc()).first()
    faceEm = user.faceEmbeddings

    if not faceEm:
        faceEm = []
    else:
        faceEm = json.loads(faceEm)

    if new_photo:
        print("adding new photo")
        url_res = urllib.request.urlopen("https://iotsecuresystem.s3.amazonaws.com/" + new_photo.url)
        img = face_recognition.load_image_file(url_res)
        faceEm.append(face_recognition.face_encodings(img)[0])
        user.faceEmbeddings = json.dumps(faceEm, cls=NumpyArrayEncoder)
        db.session.commit()
        return jsonify({"message": "Photo added"}), 200
    else:
        print("No photos found")
        return jsonify({"message": "No photos found"}), 400

    

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(port=8000,debug=True)