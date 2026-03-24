export default function Footer() {
  return (
    <footer className="bg-white border-t py-16 mt-10">
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="col-span-2">
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <i className="ri-briefcase-4-fill text-white text-xl"></i>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
              <i className="ri-sparkling-fill text-[9px] text-yellow-800"></i>
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">JobTracker</h3>
            <span className="text-xs font-medium text-indigo-500 -mt-1">AI Powered</span>
          </div>
        </div>
        <p className="text-gray-600">AI-powered job application tracking.</p>
      </div>

      <div>
        <h4 className="font-semibold mb-4">Product</h4>
        <ul className="space-y-3 text-gray-600">
          <li>Features</li>
          <li>About</li>
          <li>API</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-4">Support</h4>
        <ul className="space-y-3 text-gray-600">
          <li>Help Center</li>
          <li>Contact</li>
          <li>Privacy</li>
        </ul>
      </div>
    </div>

    <div className="border-t mt-12 pt-8 text-center text-gray-500">
      © 2024 JobTracker AI. All rights reserved.
    </div>
  </footer>
  );
}
