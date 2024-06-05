export default function UserPhoto({ id, time, url, userId }: PhotoLog) {
  return (
    <div>
      <img
        src={url}
        alt={url}
        className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
      />
    </div>
  );
}
