interface TextInputProps {
  label: string;
  placeholder: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
}
export default function TextInput({
  label,
  placeholder,
  onChange,
  value,
}: TextInputProps) {
  return (
    <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
      {" "}
      {/* Adjust width and padding */}
      <label
        className="block text-gray-600 dark:text-gray-400 font-mono text-sm"
        htmlFor="input"
      >
        {label}
      </label>
      <input
        id="input"
        type="text"
        className="border-2 border-gray-300 dark:border-darkgray-400 rounded-md p-2 mt-2 focus:outline-none focus:ring focus:border-blue-400 dark:bg-darkgray-700 dark:text-gray-100"
        placeholder={placeholder}
        onChange={(event) => onChange(event)}
        value={value}
      />
    </div>
  );
}
