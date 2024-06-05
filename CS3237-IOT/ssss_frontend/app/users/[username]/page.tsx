"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import LeftTitle from "../../_components/common/LeftTitle";
import { useEffect, useState } from "react";
import axios from "axios";
import UserPhoto from "../../_components/users/UserPhoto";
import StyledButton from "../../_components/common/StyledButton";

export default function UserPage() {
  const router = useRouter();
  const pathname = usePathname();
  const username = pathname.split("/")[2];
  const [userPhotos, setUserPhotos] = useState<PhotoLog[] | null>(null); //Change this to user photos
  useEffect(() => {
    try {
      axios.get(`http://localhost:3000/photo_logs/${username}`).then((res) => {
        console.log(res.data);
        setUserPhotos(res.data);
      });
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-2">
      <LeftTitle title={`/users/${username}`} />

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        {userPhotos &&
          userPhotos.map((photo) => {
            return <UserPhoto key={photo.id} {...photo} />;
          })}
      </div>
      <StyledButton
        label="Add Photo"
        onClick={() => {
          router.push(`/users/${username}/addPhoto`);
        }}
      />
    </main>
  );
}
