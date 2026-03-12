"use client"
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-t from-pink-500/5 via-background to-transparent backdrop-blur-xl">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-4 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-8 my-2 mx-auto max-w-6xl bg-gradient-to-b from-pink-500/5 via-background to-transparent">
        <div className="container mx-auto px-4 space-y-8">
          <div className="shadow rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Name and email address when you create an account</li>
                <li>Payment information when you make a purchase</li>
                <li>Information about your usage of our services</li>
                <li>Device information and IP address</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process your transactions</li>
                <li>Send you technical notices and updates</li>
                <li>Respond to your comments and questions</li>
                <li>Improve our services</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
              <p>We do not sell or rent your personal information to third parties. We may share your information:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>With service providers who assist in our operations</li>
                <li>When required by law</li>
                <li>To protect our rights and safety</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
              <p>We use cookies and similar tracking technologies to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Remember your preferences</li>
                <li>Understand how you use our services</li>
                <li>Improve your experience</li>
                <li>Provide targeted advertising</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <div className="mt-2">
                <p>Email: mynmss3@gmail.com</p>
                <p>Website: www.studic.in</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
