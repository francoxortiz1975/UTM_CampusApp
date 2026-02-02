import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-6 bg-white shadow">
      <h1 className="text-2xl font-bold">Campus Dashboard</h1>
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Sign In
      </button>
    </header>
  );
}
