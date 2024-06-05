import React from "react";

interface TextInputProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
}

export default function StyledButton({
  label,
  onClick,
  disabled,
}: TextInputProps) {
  return (
    <button
      className="bg-blue-400 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-700 text-white dark:text-gray-900 font-mono text-sm px-4 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-400 dark:focus:ring-blue-600 "
      onClick={() => onClick()}
      disabled={disabled}
      style={{ border: "1px solid black" }} // TODO: remove this
    >
      {label}
    </button>
  );
}
