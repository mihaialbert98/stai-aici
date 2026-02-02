'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-200 mb-2">Eroare</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Ceva nu a funcționat corect</h2>
      <p className="text-gray-500 mb-6">A apărut o eroare neașteptată. Te rugăm să încerci din nou.</p>
      <button onClick={reset} className="btn-primary">Încearcă din nou</button>
    </div>
  );
}
