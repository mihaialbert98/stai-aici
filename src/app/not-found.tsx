import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Pagina nu a fost găsită</h2>
      <p className="text-gray-500 mb-6">Pagina pe care o cauți nu există sau a fost mutată.</p>
      <Link href="/" className="btn-primary">Înapoi la pagina principală</Link>
    </div>
  );
}
