import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Studic",
  description: "Contact the Studic team for help with courses, articles, products and your learner account.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 text-lg">
            Have questions or need assistance? Feel free to get in touch with us.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Send Us a Message
            </h2>
            <form className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Your Message
                </label>
                <textarea
                  id="message"
                  placeholder="Enter your message"
                  rows={4}
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Contact Details Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-blue-600 text-4xl mb-4">📧</div>
              <h3 className="text-lg font-bold">Email</h3>
              <p className="text-gray-600">i@sidsharma.in</p>
            </div>
            <div className="text-center">
              <div className="text-blue-600 text-4xl mb-4">📞</div>
              <h3 className="text-lg font-bold">Phone</h3>
              <p className="text-gray-600">+91 9876543210</p>
            </div>
            <div className="text-center">
              <div className="text-blue-600 text-4xl mb-4">📍</div>
              <h3 className="text-lg font-bold">Address</h3>
              <p className="text-gray-600">
                Banshigarhi, Lucknow, UP, India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} sid.in. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
