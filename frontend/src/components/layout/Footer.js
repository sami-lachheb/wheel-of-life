export default function Footer() {
  return (
    <footer className="bg-primary text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Wheel of Life</h3>
            <p className="text-gray-300">
              Your journey to balanced living through structured reflection and coaching.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-gold">Home</a></li>
              <li><a href="/onboarding" className="text-gray-300 hover:text-gold">Get Started</a></li>
              <li><a href="/dashboard" className="text-gray-300 hover:text-gold">Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-gray-300">
              Questions or feedback? Reach out to our team.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/20 text-center text-gray-400">
          <p>© 2026 Wheel of Life. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
