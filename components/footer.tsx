"use client"
import { useDataStore } from '@/store'
import { Dot } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { FaGithub, FaLinkedin, FaTelegram, FaYoutube } from 'react-icons/fa'

const Footer = () => {
  const [isMounted, setIsMounted] = useState(false);
  const ft = useDataStore<boolean>("footer", true)();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    ft?.data && <div className='max-w-6xl mx-auto px-2'>
      {/* Footer */}
      <footer className="py-8">
        <div className="container mx-auto text-center flex flex-col items-center">

          <h3 className="text-lg font-bold">Follow Us</h3>
          <div className="mt-4 flex justify-center space-x-6">
            <Link target="_blank" href={"https://youtube.com/ignouStudyCenter"}>
              <FaYoutube className="text-2xl hover:text-red-600 cursor-pointer" />
            </Link>
            <Link target="_blank" href={"https://telegram.me/ignou_Study_Channel"}>
              <FaTelegram className="text-2xl hover:text-blue-700 cursor-pointer" />
            </Link>
            <Link target="_blank" href={"https://github.com/panditsiddharth"}>
              <FaGithub className="text-2xl hover:text-black cursor-pointer" />
            </Link>
            <Link target="_blank" href={"https://linkedin.com/in/sidsharma0"}>
              <FaLinkedin className="text-2xl hover:text-blue-600 cursor-pointer" />
            </Link>
          </div>

          <div className='flex gap-1 mt-3'>
            <Link href={"/about"} className='text-gray-400'>
              About Us
            </Link>
            <Dot />
            <a href="/privacy" className='text-gray-400'>
              Privacy Policy
            </a>
            <Dot />
            <Link href={"/tnc"} className='text-gray-400'>
              Terms & Conditions
            </Link>
          </div>
          <p className="mt-4 text-gray-400">© 2024 Studic All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Footer