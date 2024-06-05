import Image from "next/image";
import RoutingCard from "./_components/common/RoutingCard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Introduction to Internet of Things &nbsp;
          <code className="font-mono font-bold">(CS3217)</code>
        </p>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <h1 className="text-4xl">Smart Secure Safe System</h1>
      </div>
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <RoutingCard
          title="Add Vault"
          description="Add a new vault"
          href="/vault"
        />
        <RoutingCard
          title="Who am I?"
          description="Test your face recognition"
          href="/whoAmI"
        />
        <RoutingCard
          title="Sign up"
          description="Sign up a new user to the database"
          href="/signup"
        />
        <RoutingCard
          title="Dashboard"
          description="See information about the system"
          href="/dashboard"
        />
        <RoutingCard
          title="Users"
          description="See the users in the system and their photos"
          href="/users"
        />
      </div>
    </main>
  );
}
