import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Studic",
    description: "Learn about Studic, a practical learning platform for coding, IGNOU students and downloadable educational resources.",
    alternates: { canonical: "/about" },
};

export default function About() {
    return (
        <div className="max-w-6xl mx-auto px-2">
            {/* Hero Section */}
            <section className="my-2 py-6 bg-gradient-to-t from-background to-transparent backdrop-blur-md">
                <div className="container mx-auto text-center px-4">
                    <h1 className="text-4xl font-bold">About Me</h1>
                    <p className="mt-4 text-lg">
                        Welcome to <span className="font-semibold">Studic</span>, your destination for BCA, coding tutorials, and educational resources.
                    </p>
                </div>
            </section>

            {/* About Section */}
            <section className="my-2 py-4 bg-gradient-to-l from-background to-transparent backdrop-blur-md">
                <div className="container mx-auto px-4 space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold ">Who Am I?</h2>
                        <p className="mt-4">
                            I am <span className="font-semibold">Siddharth Sharma</span>, a passionate educator and content creator. Through my YouTube channel and website, I focus on helping students of IGNOU, especially those pursuing <span className="font-semibold">BCA</span>, enhance their coding and academic skills. Occasionally, I also explore other courses like <span className="italic">BAG</span> and <span className="italic">BCOM</span>, ensuring students across disciplines can benefit.
                        </p>
                    </div>

                    <div className="shadow rounded-lg p-6">
                        <h3 className="text-xl font-bold">What You’ll Find Here</h3>
                        <ul className="mt-4 space-y-2 list-disc list-inside">
                            <li>Comprehensive coding tutorials tailored for IGNOU students.</li>
                            <li>Detailed explanations of BCA syllabus topics.</li>
                            <li>Downloadable PDFs of notes and blog summaries.</li>
                            <li>Content for other IGNOU courses like BAG and BCOM.</li>
                            <li>Affordable educational resources starting at just ₹5.</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-bold">Vision</h3>
                        <p className="mt-4">
                            My goal is to make education accessible and affordable for all, ensuring every student can excel in their academics and coding journey. Whether you are preparing for your BCA exams or learning new programming skills, <span className="font-semibold">Studic</span> is here to guide you every step of the way.
                        </p>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="my-2 py-6 bg-gradient-to-b from-background to-transparent backdrop-blur-md">
                <div className="container mx-auto text-center px-4">
                    <h3 className="text-2xl font-bold">Check Out My Latest Content</h3>
                    <p className="mt-4">
                        Explore detailed blogs and notes from my YouTube videos. Unlock exclusive PDFs for just ₹5-10 and take your learning to the next level!
                    </p>
                    <button className="mt-6 px-6 py-2 font-semibold rounded shadow-md shadow-background">
                        Browse Blogs
                    </button>
                </div>
            </section>
        </div>
    );
}
