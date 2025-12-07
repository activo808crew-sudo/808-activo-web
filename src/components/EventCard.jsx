import React, { useState, useRef } from 'react';

const EventCard = ({ image, startDate, startTime, title, desc, xMult = 10, yMult = 6 }) => {
    const ref = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setOffset({ x, y });
    };

    // Date formatting logic
    let dateBadge = null;
    if (startDate) {
        const d = new Date(startDate);
        // Format: "VIERNES 25"
        const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
        const dayNum = d.toLocaleDateString('es-ES', { day: 'numeric' });
        dateBadge = `${dayName} ${dayNum}`;
    }

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={() => setOffset({ x: 0, y: 0 })}
            className="relative w-[85vw] md:w-96 bg-[#130b24] rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-2 aspect-[4/5]"
            style={{
                transform: `translate3d(${offset.x * xMult}px, ${offset.y * yMult}px, 0)`,
                transition: 'transform 120ms linear',
            }}
        >
            <div className={`absolute inset-0 bg-black/40 z-0`}></div>
            <div className="relative w-full h-full z-10 flex flex-col justify-end">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                <img src={image} alt={title} className="w-full h-full object-cover absolute inset-0 z-0" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    {/* Date Formatting Style "VIERNES 25" */}
                    {dateBadge && (
                        <span className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-2 bg-purple-600 shadow-lg shadow-purple-900/50">
                            {dateBadge} {startTime ? `• ${startTime.substring(0, 5)}` : ''}
                        </span>
                    )}
                    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-300 text-sm">{desc}</p>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
