import Link from 'next/link';
import Header from '../components/Header';

export default function Home() {
  const apps = [
    { name: 'Food Availability', description: 'See which cafeterias are open.', href: '/food' },
    { name: 'Gym Availability', description: 'Check gym occupancy.', href: '/gym' },
    { name: 'Parking Availability', description: 'Find available parking.', href: '/parking' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="flex justify-center items-center mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {apps.map((app) => (
            <Link
              key={app.name}
              href={app.href}
              className="bg-white p-8 rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition"
            >
              <h2 className="text-xl font-semibold mb-2">{app.name}</h2>
              <p>{app.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
