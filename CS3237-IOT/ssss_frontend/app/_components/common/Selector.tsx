interface SelectInputProps {
  label: string;
  options: { value: string; label: string }[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  value?: string;
}

export default function SelectInput({
  label,
  options,
  onChange,
  value,
}: SelectInputProps) {
  return (
    <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
      {/* Adjust width and padding */}
      <label
        className="block text-gray-600 dark:text-gray-400 font-mono text-sm"
        htmlFor="select"
      >
        {label}
      </label>
      <select
        id="select"
        className="border-2 border-gray-300 dark:border-darkgray-400 rounded-md p-2 mt-2 focus:outline-none focus:ring focus:border-blue-400 dark:bg-darkgray-700 dark:text-gray-100"
        onChange={(event) => onChange(event)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
