import Link from 'next/link';
import Header from '../components/Header';

export default function Home() {
    // NOTE (HALF): TEMP
    const apps = [
        { name: 'Food Availability', description: 'See which cafeterias are open.', href: '/food' },
        { name: 'Gym Availability', description: 'Check gym occupancy.', href: '/gym' },
        { name: 'Parking Availability', description: 'Find available parking.', href: '/parking' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
        <Header />

        {/* Title */}
        <section className="text-center mt-16 px-4 sm:px-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-800">
                Welcome to the Dashboard
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto">
                Quickly access real-time information about food, gym, and parking availability on campus.
            </p>
        </section>

        {/* Apps */}
        <main className="flex justify-center mt-16 px-4 sm:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl w-full">
            {apps.map((app) => (
                <Link
                key={app.name}
                href={app.href}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex flex-col justify-between"
                >
                <h2 className="text-2xl font-semibold mb-3 text-gray-800">{app.name}</h2>
                <p className="text-gray-600">{app.description}</p>
                </Link>
            ))}
            </div>
        </main>
        </div>
    );
}
