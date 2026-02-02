import Header from '../../components/Header';

export default function Parking() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-10">
        <h1 className="text-3xl font-bold mb-4">Parking Availability</h1>
        <p>Display available parking spaces here.</p>
      </div>
    </div>
  );
}
