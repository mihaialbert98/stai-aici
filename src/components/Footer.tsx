import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold text-primary-700">
              StaiAici
            </Link>
            <p className="text-sm text-gray-500 mt-2">
              Platforma de cazare din Romania.
            </p>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/politica-confidentialitate" className="text-gray-500 hover:text-primary-600 transition">
                  Politica de confidentialitate
                </Link>
              </li>
              <li>
                <Link href="/termeni" className="text-gray-500 hover:text-primary-600 transition">
                  Termeni si conditii
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-500 hover:text-primary-600 transition">
                  Politica cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Copyright */}
          <div className="md:text-right">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} StaiAici. Toate drepturile rezervate.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Realizat de <span className="font-medium text-gray-500">ABT SOFTWARE HUB SRL</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
