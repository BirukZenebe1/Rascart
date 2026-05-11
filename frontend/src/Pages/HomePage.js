import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const looks = [
  {
    vibe: 'Executive Edge',
    pieces: [
      { label: 'Tailored Jacket', image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=600&q=80' },
      { label: 'Luxury Watch', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80' },
      { label: 'Leather Bag', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80' },
      { label: 'Premium Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  {
    vibe: 'Street Luxe',
    pieces: [
      { label: 'Graphic Hoodie', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80' },
      { label: 'Minimal Cap', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80' },
      { label: 'Crossbody Bag', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80' },
      { label: 'Chunky Trainers', image: 'https://images.unsplash.com/photo-1608666634759-4376010f863d?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  {
    vibe: 'Sport Elite',
    pieces: [
      { label: 'Performance Top', image: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=600&q=80' },
      { label: 'Training Shoes', image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80' },
      { label: 'Sport Watch', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80' },
      { label: 'Gym Duffle', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  {
    vibe: 'Weekend Modern',
    pieces: [
      { label: 'Soft Knit', image: 'https://images.unsplash.com/photo-1619785292559-77fe3f6d2fca?auto=format&fit=crop&w=600&q=80' },
      { label: 'Neutral Tote', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80' },
      { label: 'Slim Denim', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80' },
      { label: 'Casual Loafers', image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80' }
    ]
  }
];

const brandRows = [
  {
    speedClass: 'home-brand-track-forward',
    items: [
      { name: 'Nike', logo: 'https://cdn.simpleicons.org/nike/0f172a' },
      { name: 'Adidas', logo: 'https://cdn.simpleicons.org/adidas/0f172a' },
      { name: 'Puma', logo: 'https://cdn.simpleicons.org/puma/0f172a' },
      { name: 'New Balance', logo: 'https://cdn.simpleicons.org/newbalance/0f172a' },
      { name: 'Reebok', logo: 'https://cdn.simpleicons.org/reebok/0f172a' },
      { name: 'Under Armour', logo: 'https://cdn.simpleicons.org/underarmour/0f172a' },
      { name: 'ASICS', textOnly: true, wordmarkClass: 'brand-wordmark-asics' },
      { name: 'CONVERSE', textOnly: true, wordmarkClass: 'brand-wordmark-converse' }
    ]
  },
  {
    speedClass: 'home-brand-track-fast',
    items: [
      { name: 'CHANEL', textOnly: true, wordmarkClass: 'brand-wordmark-chanel' },
      { name: 'PRADA', textOnly: true, wordmarkClass: 'brand-wordmark-prada' },
      { name: 'Dior', logo: 'https://cdn.simpleicons.org/dior/0f172a' },
      { name: 'ZARA', textOnly: true, wordmarkClass: 'brand-wordmark-zara' },
      { name: "Levi's", textOnly: true, wordmarkClass: 'brand-wordmark-levis' },
      { name: 'BURBERRY', textOnly: true, wordmarkClass: 'brand-wordmark-burberry' },
      { name: 'The North Face', logo: 'https://cdn.simpleicons.org/thenorthface/0f172a' },
      { name: 'Lululemon', logo: 'https://cdn.simpleicons.org/lululemon/0f172a' }
    ]
  }
];

function HomePage() {
  const [lookIndex, setLookIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const currentLook = looks[lookIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setLookIndex((prev) => (prev + 1) % looks.length);
    }, 3400);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -18;
    setTilt({ x, y });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-cyan-50 to-slate-100">
      <section className="relative overflow-hidden">
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
                <div className="home-fit-core">
                  <p className="home-fit-overline">AI Fit Composer</p>
                  <p className="home-fit-title">{currentLook.vibe}</p>
                  <p className="home-fit-subtitle">Live accessories and apparel rotation</p>
                </div>
                <div className="home-fashion-grid">
                  {currentLook.pieces.map((piece, index) => (
                    <div
                      key={`${currentLook.vibe}-${piece.label}`}
                      className={`home-piece-card home-piece-${index + 1}`}
                      style={{ animationDelay: `${index * 0.25}s` }}
                    >
                      <img src={piece.image} alt={piece.label} className="home-piece-image" loading="lazy" />
                      <span className="home-piece-label">{piece.label}</span>
                    </div>
                  ))}
                </div>
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
            <div className="flex items-center justify-end gap-3 mb-4">
              <span className="inline-flex items-center rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-semibold text-cyan-700">
                Always in motion
              </span>
            </div>

            <div className="space-y-3">
              {brandRows.map((group, rowIndex) => (
                <div key={rowIndex} className="home-brand-lane">
                  <div className={`home-brand-track ${group.speedClass}`}>
                    {[...group.items, ...group.items].map((brand, index) => (
                      <div key={`${rowIndex}-${brand.name}-${index}`} className="home-brand-logo-card" title={brand.name} aria-label={brand.name}>
                        {brand.textOnly ? (
                          <span className={`home-brand-text-only ${brand.wordmarkClass || ''}`}>{brand.name}</span>
                        ) : (
                          <img src={brand.logo} alt={brand.name} className="home-brand-logo-img" loading="lazy" />
                        )}
                      </div>
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
