"use client";

import { useState } from "react";
import LeftTitle from "../_components/common/LeftTitle";
import TextInput from "../_components/common/TextInput";
import StyledButton from "../_components/common/StyledButton";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const register = async () => {
    try {
      await axios.post("http://localhost:3000/user", {
        //Change this to make more secure
        username: username,
        phoneNumber: phoneNumber,
      });
    } catch (err) {
      alert("Error registering user");
      return;
    }
    router.push(`/`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-2">
      <LeftTitle title="/singup" />
      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-900 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
      <TextInput
        label="Username"
        placeholder="Enter username"
        onChange={(event) => setUsername(event.target.value)}
        value={username}
      />
      <TextInput
        label="Phone Number"
        placeholder="Enter phone number"
        onChange={(event) => setPhoneNumber(event.target.value)}
        value={phoneNumber}
      />

      <StyledButton
        label="Sign up"
        onClick={register}
        disabled={username === "" || phoneNumber === ""}
      />
    </main>
  );
}
