"use client";

import React from "react";

const testimonials = [
  { name: "Julien M.", role: "Directeur B2B, TechCorp", text: "Nos réunions internationales sont enfin productives. La qualité vidéo est irréprochable.", lang: "🇫🇷" },
  { name: "Sarah J.", role: "Global Head of Sales", text: "We close deals faster. It's simply the best platform for international teams.", lang: "🇺🇸" },
  { name: "Yuki T.", role: "Operations Manager", text: "素晴らしいプラットフォームです。コミュニケーションの壁がなくなりました。", lang: "🇯🇵" },
  { name: "Elena G.", role: "Co-founder", text: "Implementamos esta solución en toda la empresa. Increíblemente estable.", lang: "🇪🇸" },
  { name: "Chen W.", role: "CTO", text: "基础设施非常强大，视频质量令人惊叹。", lang: "🇨🇳" },
  { name: "Omar K.", role: "Public Sector", text: "حل مثالي للتواصل الحكومي المؤسسي. أمان وموثوقية عالية.", lang: "🇦🇪" },
  { name: "Hans B.", role: "Project Lead", text: "Perfekt für unsere verteilten Teams in Europa.", lang: "🇩🇪" },
  { name: "Luca R.", role: "Agency Owner", text: "Design pulito e qualità eccezionale. I nostri clienti lo adorano.", lang: "🇮🇹" },
];

export function TestimonialMarquee() {
  return (
    <div className="relative flex overflow-x-hidden bg-gray-50 py-16 border-y border-gray-100">
      <div className="animate-marquee flex whitespace-nowrap">
        {[...testimonials, ...testimonials].map((t, i) => (
          <div key={i} className="mx-4 flex-none w-[400px] p-8 rounded-2xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition duration-300 whitespace-normal">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">{t.lang}</div>
              <div>
                <h4 className="font-bold text-gray-900">{t.name}</h4>
                <p className="text-gray-500 text-sm font-medium">{t.role}</p>
              </div>
            </div>
            <p className="text-gray-700 text-base leading-relaxed">"{t.text}"</p>
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
    </div>
  );
}