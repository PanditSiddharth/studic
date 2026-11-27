import React from 'react';
import { Card } from '@/components/ui/card';

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className=" p-4 rounded-xl shadow-none border-none">
        <div className="font-medium text-lg flex items-center h-10 p-2 rounded-md relative overflow-hidden">
          <p>loading</p>
          <div className="relative overflow-hidden ml-2 words">
            <div className="absolute inset-0 bg-gradient-to-t via-transparent z-20"></div>
            <div className="text-purple-500 animate-spin-words">
              <span className="block h-full word">images</span>
              <span className="block h-full word">content</span>
              <span className="block h-full word">data</span>
              <span className="block h-full word">images</span>
              <span className="block h-full word">content</span>
            </div>
          </div>
        </div>
      </Card>
      <style jsx>{`
        .words {
          position: relative;
        }
        .words::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            #212121 10%,
            transparent 30%,
            transparent 70%,
            #212121 90%
          );
          z-index: 20;
        }
        .word {
          display: block;
          height: 100%;
          padding-left: 6px;
          color: #956afa;
          animation: spinWords 4s infinite;
        }
        @keyframes spinWords {
          10% {
            transform: translateY(-102%);
          }
          25% {
            transform: translateY(-100%);
          }
          35% {
            transform: translateY(-202%);
          }
          50% {
            transform: translateY(-200%);
          }
          60% {
            transform: translateY(-302%);
          }
          75% {
            transform: translateY(-300%);
          }
          85% {
            transform: translateY(-402%);
          }
          100% {
            transform: translateY(-400%);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;