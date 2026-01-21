import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, Clock, DollarSign } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
              Rent Professional Tools On Demand
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-blue-100">
              Get access to high-quality tools whenever you need them. No long-term commitments, just pay for what you use.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/tools"
                className="bg-white text-blue-600 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
              >
                Browse Tools
              </Link>
              <Link
                to="/signup"
                className="bg-blue-700 text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition border border-blue-500 text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Wrench className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quality Tools</h3>
            <p className="text-gray-600">
              All our tools are regularly maintained and inspected for quality
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Clock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Flexible Rental</h3>
            <p className="text-gray-600">
              Rent by the day with easy online booking and scheduling
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <DollarSign className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Affordable Prices</h3>
            <p className="text-gray-600">
              Competitive daily rates that save you money compared to buying
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
            <p className="text-gray-600">
              Safe and secure online payment with instant confirmation
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Select</h3>
              <p className="text-gray-600">
                Browse our catalog and choose the tool you need
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Book & Pay</h3>
              <p className="text-gray-600">
                Select your dates and complete secure payment online
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pick Up & Use</h3>
              <p className="text-gray-600">
                Pick up your tool and start your project
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Ready to Get Started?</h2>
          <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-blue-100">
            Join thousands of satisfied customers renting tools online
          </p>
          <Link
            to="/tools"
            className="bg-white text-blue-600 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition inline-block"
          >
            View All Tools
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
