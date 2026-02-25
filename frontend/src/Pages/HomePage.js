import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const looks = [
  { animal: '🦊', outfit: '🧥', shoes: '👟', accessory: '🕶️', vibe: 'Urban Fox Fit' },
  { animal: '🐼', outfit: '🧣', shoes: '👢', accessory: '🎒', vibe: 'Cozy Panda Layer' },
  { animal: '🐯', outfit: '🧢', shoes: '🥾', accessory: '⌚', vibe: 'Tiger Street Mode' },
  { animal: '🐨', outfit: '🧶', shoes: '👞', accessory: '👜', vibe: 'Koala Smart Casual' }
];

const orbitItems = ['👗', '👔', '👜', '👠', '🧥', '🧢', '💎', '🛍️'];
const brandRows = [
  {
    title: 'Street x Sport',
    speedClass: 'home-brand-track-fast',
    items: ['Nike', 'Balenciaga', 'Adidas', 'Prada', 'Puma', 'Moncler', 'ASICS', 'Gucci', 'New Balance', 'Dior']
  },
  {
    title: 'Luxury x Daily',
    speedClass: 'home-brand-track-slow',
    items: ['Zara', 'Louis Vuitton', 'Uniqlo', 'Burberry', 'Mango', 'Fendi', 'Levi’s', 'Versace', 'COS', 'Bottega Veneta']
  },
  {
    title: 'Outdoor x High-End',
    speedClass: 'home-brand-track-medium',
    items: ['The North Face', 'Loro Piana', 'Columbia', 'Off-White', 'Reebok', 'Givenchy', 'Lululemon', 'Saint Laurent', 'Vans', 'Kenzo']
  }
];

function HomePage() {
  const [lookIndex, setLookIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const currentLook = looks[lookIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setLookIndex((prev) => (prev + 1) % looks.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const floatingOrbits = useMemo(
    () =>
      orbitItems.map((item, index) => ({
        item,
        left: `${15 + (index % 4) * 22}%`,
        top: `${20 + Math.floor(index / 4) * 42}%`,
        delay: `${index * 0.4}s`
      })),
    []
  );

  const handleMouseMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -18;
    setTilt({ x, y });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-cyan-50 to-slate-100">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {floatingOrbits.map((entry) => (
            <span
              key={entry.item + entry.left}
              className="home-orbit-item"
              style={{ left: entry.left, top: entry.top, animationDelay: entry.delay }}
            >
              {entry.item}
            </span>
          ))}
        </div>

        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="uppercase tracking-[0.35em] text-cyan-700 text-xs font-bold mb-4">
                MERKATOAI FASHION LAB
              </p>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight">
                Dress the future.
                <span className="block text-cyan-700">Shop with living style AI.</span>
              </h1>
              <p className="mt-5 text-lg text-slate-700 max-w-xl">
                Play with dynamic looks, discover trending drops, and move from discovery to checkout in one flow.
                Every tap feels alive.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop" className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold shadow-lg">
                  Explore Shop
                </Link>
                <Link to="/style-questionnaire" className="inline-flex items-center rounded-xl border border-cyan-300 bg-cyan-50 px-6 py-3 text-cyan-800 font-semibold">
                  Build Style Profile
                </Link>
              </div>
            </div>

            <div className="relative">
              <div
                className="home-hero-stage"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTilt({ x: 0, y: 0 })}
                style={{
                  transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`
                }}
              >
                <div className="home-glow" />
                <div className="home-model">
                  <span className="home-animal">{currentLook.animal}</span>
                  <span className="home-outfit">{currentLook.outfit}</span>
                  <span className="home-shoes">{currentLook.shoes}</span>
                  <span className="home-accessory">{currentLook.accessory}</span>
                </div>
                <div className="home-vibe">{currentLook.vibe}</div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {looks.map((look, index) => (
                  <span
                    key={look.vibe}
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      lookIndex === index ? 'w-8 bg-cyan-600' : 'w-2.5 bg-slate-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-slate-500">Auto styling in motion</span>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm home-brand-showcase">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-700 font-bold mb-1">Brand Mix</p>
                <p className="text-sm text-slate-600">A live rotation of sport, street, luxury, and outdoor labels.</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-semibold text-cyan-700">
                Always in motion
              </span>
            </div>

            <div className="space-y-3">
              {brandRows.map((group) => (
                <div key={group.title} className="home-brand-lane">
                  <div className="home-brand-lane-label">{group.title}</div>
                  <div className={`home-brand-track ${group.speedClass}`}>
                    {[...group.items, ...group.items].map((brand, index) => (
                      <span key={`${group.title}-${brand}-${index}`} className="home-brand-pill">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
