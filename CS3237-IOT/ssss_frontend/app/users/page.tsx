"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import LeftTitle from "../_components/common/LeftTitle";
import UserCard from "../_components/users/UserCard";

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    try {
      axios.get("http://localhost:3000/users").then((res) => {
        console.log(res.data);
        setUsers(res.data);
      });
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-2">
      <LeftTitle title="/users" />
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        {users &&
          users.map((user) => {
            return <UserCard key={user.id} {...user} />;
          })}
      </div>
    </main>
  );
}
