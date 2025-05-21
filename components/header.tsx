import { MicroscopeIcon } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-green-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MicroscopeIcon className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Siaga Malaria Nusantara</h1>
              <p className="text-xs md:text-sm">
                AI-powered malaria detection system
              </p>
            </div>
          </div>
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#about" className="hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:underline">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
