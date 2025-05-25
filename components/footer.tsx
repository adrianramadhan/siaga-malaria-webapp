import Link from "next/link";
import { MicroscopeIcon, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MicroscopeIcon className="h-6 w-6 text-green-600" />
              <span className="font-bold text-lg">Siaga Malaria Nusantara</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              AI-powered malaria detection system designed to support early
              diagnosis and treatment in Indonesia, especially in remote areas
              where access to traditional laboratory facilities is limited.
            </p>
            <p className="text-xs text-gray-500">
              Developed to support early malaria detection in Indonesia
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/#team"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Team
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                info@siagamalaria.id
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                +62 21 1234 5678
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Siaga Malaria Nusantara. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
