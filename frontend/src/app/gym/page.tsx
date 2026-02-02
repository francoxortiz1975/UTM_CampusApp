import Header from '../../components/Header';

export default function Gym() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-10">
        <h1 className="text-3xl font-bold mb-4">Gym Availability</h1>
        <p>Display gym schedule and occupancy here.</p>
      </div>
    </div>
  );
}
