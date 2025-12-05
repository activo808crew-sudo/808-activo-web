import React, { useEffect, useState } from 'react';

const ParallaxBackground = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Calculate normalized mouse position (-1 to 1)
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none bg-[#0a0319]">
            <div
                className="absolute inset-[-50px] bg-cover bg-center opacity-20 blur-sm transition-transform duration-100 ease-out"
                style={{
                    backgroundImage: 'url("https://i.imgur.com/CF1kg1Y.jpeg")',
                    transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
                }}
            />
            {/* Overlay to ensure text readability if needed, though opacity handles most of it */}
            <div className="absolute inset-0 bg-[#0a0319]/50" />
        </div>
    );
};

export default ParallaxBackground;
