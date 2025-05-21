export function Footer() {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Siaga Malaria Nusantara. All
            rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Developed to support early malaria detection in Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
