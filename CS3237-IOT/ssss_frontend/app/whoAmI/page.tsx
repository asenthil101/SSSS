"use client";

import { useEffect, useRef, useState } from "react";

import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import LeftTitle from "../_components/common/LeftTitle";
import StyledButton from "../_components/common/StyledButton";

export default function WhoIAm() {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [photoTaken, setPhotoTaken] = useState<boolean>(false);
  const [cardState, setCardState] = useState<"correct" | "incorrect" | null>();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStream(stream);
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  };

  const addPhoto = async () => {
    //Take photo
    setPhotoTaken(true);
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    }
    const data = canvas.toDataURL("image/jpeg");
    const blob = await (await fetch(data)).blob();
    var bodyFormData = new FormData();
    bodyFormData.append("file", blob);
    //Upload photo send blob in form data
    try {
      const res = await axios.post(
        `http://localhost:3000/photo_log`,
        bodyFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data) {
        setPerson(res.data.username);
      }
      if (cardState === "correct") {
        await axios.post(`http://localhost:3000/loginLog`, {
          username: res.data.username,
        });
      } else if (cardState === "incorrect") {
        await axios.post(`http://localhost:3000/stolenCard`, {
          username: res.data.username,
        });
      }
    } catch (err) {
      setPerson("unknown");
      return;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-2">
      <LeftTitle title={`whoAmI`} />
      {!person ? (
        photoTaken ? (
          <></>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto md:w-2/3 max-w-xl rounded-xl"
            ></video>
            <div className="flex gap-2">
              <StyledButton
                label="Fake Correct Card"
                onClick={() => setCardState("correct")}
              />
              <StyledButton
                label="Fake Incorrect Card"
                onClick={() => setCardState("incorrect")}
              />
              <StyledButton
                label="Dont fake"
                onClick={() => setCardState(null)}
              />
            </div>
            <StyledButton
              label="Add Photo"
              onClick={addPhoto}
              disabled={cameraStream === null}
            />
          </>
        )
      ) : person === "unknown" ? (
        <div className="bg-red-500 text-white p-2 rounded-xl bo">
          Person not identified
        </div>
      ) : (
        <div className="bg-[#7CD58B] text-white p-2 rounded-xl h-40 flex items-center justify-center">
          <h1 className="text-3xl font-bold">Welcome back: {person}</h1>
        </div>
      )}
    </main>
  );
}
