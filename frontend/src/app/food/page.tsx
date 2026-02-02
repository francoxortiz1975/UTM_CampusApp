import Header from '../../components/Header';

export default function Food() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-10">
        <h1 className="text-3xl font-bold mb-4">Food Availability</h1>
        <p>Display available food options here.</p>
      </div>
    </div>
  );
}
