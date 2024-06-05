# Create me a simple flask endpoint that returns  hello world
import flask
import json

app = flask.Flask(__name__)

@app.route('/')
def hello_world():
    return {"username": "procha"}

if __name__ == '__main__':
    app.run()

# Run the app
# python main.py



# from flask import Flask, jsonify
# from flask import request
# from datetime import datetime
# from flask_sqlalchemy import SQLAlchemy
# import boto3 


# db = SQLAlchemy()

# client = boto3.client('s3')

# class User(db.Model):
#     __tablename__ = 'User'
#     id = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     username = db.Column(db.String(80), unique=True, nullable=False)
#     registeredAt = db.Column(db.DateTime, default=datetime.utcnow)
#     active = db.Column(db.Boolean, default=True)
#     photos = db.relationship('PhotoLog', backref='user', lazy=True)

# class PhotoLog(db.Model):
#     __tablename__ = 'PhotoLog'
#     id = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     url = db.Column(db.String(200), unique=True, nullable=False)
#     time = db.Column(db.DateTime, default=datetime.utcnow)
#     userId = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=True)


# app = Flask(__name__)
# app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://rocha:123@localhost:5432/iot"
# db.init_app(app)

# def get_users_photos():
#     users = User.query.all()
#     result = []

#     for user in users:
#         user_data = {
#             "username": user.username,
#             "registeredAt": user.registeredAt,
#             "active": user.active,
#             "photos": [{"photo_id": photo.id, "url": "https://iotsecuresystem.s3.amazonaws.com/"+photo.url, "time": photo.time} for photo in user.photos]
#         }
#         result.append(user_data)
#     return result

# @app.route('/photo_logs')
# def photo_logs():
    
#     result = get_users_photos()
#     return jsonify(result)

# @app.route('/', methods=['POST'])
# def create():
#     url = request.json['url']
#     print("URL: ", url)
#     # Get the file form s3
#     client.download_file('iotsecuresystem', url, 'image.jpg')
#     print("Downloaded")
#     return jsonify({'username': url})



# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
#     app.run(debug=True)

