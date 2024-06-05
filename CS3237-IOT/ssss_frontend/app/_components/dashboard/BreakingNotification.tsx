import { useEffect } from "react";
import Image from "next/image";
import axios from "axios";

interface BreakingNotificationProps {
  breakingLog: BreakingData;
}

const BreakingNotification = ({ breakingLog }: BreakingNotificationProps) => {
  const deleteLog = async () => {
    await axios.delete(`http://localhost:3000/breaking_log/${breakingLog.id}`);
    window.location.reload();
  };

  const isUnknown = breakingLog.url.includes("unknown");
  const subject = isUnknown
    ? "Unidentified Subject"
    : `Stolen Card: ${breakingLog.url.split("/")[1]}`;

  return (
    <div
      className={`flex flex-col shadow-lg overflow-hidden rounded-lg border-l-8 ${
        isUnknown ? "border-red-400" : "border-yellow-400"
      } ${isUnknown ? "bg-red-100" : "bg-yellow-100"}`}
    >
      {/* Image Section */}
      <div className="relative w-full h-40">
        <Image
          className="object-contain"
          src={`https://iotsecuresystem.s3.amazonaws.com/${breakingLog.url}`}
          layout="fill"
          alt="breaking"
        />
      </div>

      {/* Info Section */}
      <div className="p-4 flex-grow">
        <h3 className="text-xl font-medium mb-2">{subject}</h3>
        {breakingLog.userId && (
          <p className="text-gray-700 text-sm">User ID: {breakingLog.userId}</p>
        )}
        <p className="text-gray-500 text-sm mt-1">Time: {breakingLog.time}</p>
      </div>

      {/* Action Section */}
      <div className="border-t p-4">
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded px-4 py-2 transition-colors"
          onClick={deleteLog}
        >
          Delete Log
        </button>
      </div>
    </div>
  );
};

export default BreakingNotification;
