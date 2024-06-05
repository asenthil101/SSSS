"use client";

import { useEffect, useRef, useState } from "react";

import axios from "axios";
import LeftTitle from "../../../_components/common/LeftTitle";
import StyledButton from "../../../_components/common/StyledButton";
import { usePathname, useRouter } from "next/navigation";

export default function AddPhoto() {
  const router = useRouter();
  const pathname = usePathname();
  const username = pathname.split("/")[2];
  const [cameraStream, setCameraStream] = useState<MediaStream | null>();
  const videoRef = useRef<HTMLVideoElement>(null);

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
      await axios.post(
        `http://localhost:3000/photo_log/${username}`,
        bodyFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (err) {
      alert("Error uploading photo");
      return;
    }
    router.push(`/users/${username}`);
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
      <LeftTitle title={`users/${username}/addPhoto`} />
      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-auto md:w-2/3 max-w-xl rounded-xl"
      ></video>
      <StyledButton
        label="Add Photo"
        onClick={addPhoto}
        disabled={cameraStream === null || username === ""}
      />
    </main>
  );
}
