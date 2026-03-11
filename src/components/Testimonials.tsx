"use client";
import React from 'react';

const reviews = [
  { name: "Marie Dupont", lang: "🇫🇷", text: "La latence est inexistante. Notre équipe parle avec le Japon como s'ils étaient dans la même pièce.", img: "https://i.pravatar.cc/150?img=5", platform: "Twitter" },
  { name: "Kenji Sato", lang: "🇯🇵", text: "本当に素晴らしいツールです。翻訳の精度が高く、自然な声に驚きました。", img: "https://i.pravatar.cc/150?img=11", platform: "Instagram" },
  { name: "Sarah Connor", lang: "🇺🇸", text: "A game-changer for our B2B sales. The voice cloning is surprisingly natural.", img: "https://i.pravatar.cc/150?img=44", platform: "Twitter" },
  { name: "Ahmed Hassan", lang: "🇦🇪", text: "تطبيق رائع جداً، سهل التواصل مع عملائنا في أوروبا بشكل مذهل.", img: "https://i.pravatar.cc/150?img=15", platform: "Instagram" },
  { name: "Carlos Silva", lang: "🇧🇷", text: "Perfeito para nossas reuniões globais. O suporte é rápido e eficiente.", img: "https://i.pravatar.cc/150?img=8", platform: "Twitter" },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Ils communiquent sans frontières</h2>
        <p className="mt-4 text-lg text-gray-500">Approuvé par des équipes globales dans plus de 20 langues.</p>
      </div>

      {/* Animation Marquee (Défilement infini) */}
      <div className="flex space-x-6 animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused] w-max px-4">
        {[...reviews, ...reviews].map((review, i) => (
          <div key={i} className="w-80 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex-shrink-0 relative">
            <div className="flex items-center space-x-4 mb-4">
              <img src={review.img} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-1">
                  {review.name}
                  {/* Badge de certification */}
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </h4>
                <p className="text-sm text-gray-500">{review.lang} • via {review.platform}</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">"{review.text}"</p>
          </div>
        ))}
      </div>
    </section>
  );
}
