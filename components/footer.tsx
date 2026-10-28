
"use client";

import { useDataStore } from "@/store";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  FileText,
  GraduationCap,
  Mail,
  Package,
  ShieldCheck,
} from "lucide-react";
import {
  FaGithub,
  FaLinkedin,
  FaTelegram,
  FaYoutube,
} from "react-icons/fa";
import StudicLogo from "./logo";

const Footer = () => {
  const [isMounted, setIsMounted] = useState(false);
  const ft = useDataStore<boolean>("footer", true)();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !ft?.data) return null;

  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: "Explore",
      links: [
        { label: "Home", href: "/", icon: GraduationCap },
        { label: "Courses", href: "/courses", icon: BookOpen },
        { label: "Blogs & Articles", href: "/blogs", icon: FileText },
        { label: "Digital Products", href: "/products", icon: Package },
      ],
    },
    {
      title: "Information",
      links: [
        { label: "About Us", href: "/about", icon: FileText },
        { label: "Contact Us", href: "/contact", icon: Mail },
        { label: "Privacy Policy", href: "/privacy", icon: ShieldCheck },
        { label: "Terms & Conditions", href: "/tnc", icon: FileText },
      ],
    },
  ];

  const socialLinks = [
    {
      label: "YouTube",
      href: "https://youtube.com/ignouStudyCenter",
      icon: FaYoutube,
      hover: "hover:text-red-600",
    },
    {
      label: "Telegram",
      href: "https://telegram.me/ignou_Study_Channel",
      icon: FaTelegram,
      hover: "hover:text-sky-500",
    },
    {
      label: "GitHub",
      href: "https://github.com/PanditSiddharth",
      icon: FaGithub,
      hover: "hover:text-gray-900 dark:hover:text-white",
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com/in/sidsharma0",
      icon: FaLinkedin,
      hover: "hover:text-blue-600",
    },
  ];

  return (
    <footer className="relative mt-16 border-t border-gray-200/70 text-gray-600 dark:border-white/10 dark:text-gray-400">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <StudicLogo className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white" />

            <p className="mt-4 text-sm leading-7">
              Your space to learn, explore, and grow. Discover educational
              courses, helpful articles, and digital learning resources
              with Studic.
            </p>

            <Link
              href="/courses"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
            >
              Start learning <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* Explore and Information */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h3>

              <ul className="space-y-4">
                {section.links.map((link) => {
                  const Icon = link.icon;

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-2 text-sm transition hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Icon
                          size={16}
                          className="shrink-0 opacity-70 transition group-hover:opacity-100"
                        />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Social links */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Follow Us
            </h3>

            <p className="mt-3 text-sm leading-6">
              Stay connected for learning resources, updates, and new content.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className={`text-2xl transition-transform hover:-translate-y-0.5 ${social.hover}`}
                  >
                    <Icon />
                  </Link>
                );
              })}
            </div>

            <Link
              href="https://github.com/PanditSiddharth/studic"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:hover:text-blue-400"
            >
              <Code2 size={16} />
              Explore Studic on GitHub
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200/70 pt-6 text-center text-xs sm:flex-row dark:border-white/10">
          <p>© {currentYear} Studic. All rights reserved.</p>

          <p className="inline-flex items-center gap-1.5">
            Made for curious minds
            <GraduationCap size={15} className="text-blue-600" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
