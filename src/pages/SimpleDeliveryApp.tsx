import React from 'react';

export default function SimpleDeliveryApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🎉 Party On Delivery</h1>
          <button 
            onClick={() => window.location.href = '/admin'}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Admin
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Austin's Premier Party Supply Delivery
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get your party essentials delivered in 30 minutes or less
          </p>
          
          {/* Category Tabs */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {[
              { name: 'Beer & Wine', icon: '🍺', color: 'from-amber-500 to-orange-600' },
              { name: 'Cocktails & Mixers', icon: '🍸', color: 'from-pink-500 to-rose-600' },
              { name: 'Party Supplies', icon: '🎈', color: 'from-green-500 to-emerald-600' }
            ].map((category, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-br ${category.color} p-6 rounded-xl text-white cursor-pointer transform hover:scale-105 transition-transform shadow-lg`}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold">{category.name}</h3>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg">
            Start Your Order
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-white/20 py-6 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} Party On Delivery | Austin, TX</p>
      </footer>
    </div>
  );
}