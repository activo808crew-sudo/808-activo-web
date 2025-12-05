import React, { useState, useEffect } from 'react';
import { TebexService } from './services/tebex';
import { AnalyticsService } from './services/analytics';

// --- ICONS ---
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const IconCart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>;
const IconLoading = () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const IconChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
const IconChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;

export default function ShopModal({ isOpen, onClose }) {
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null); // ID of item being processed
    const [username, setUsername] = useState(localStorage.getItem("tebex_username") || "");
    const [showLogin, setShowLogin] = useState(!localStorage.getItem("tebex_username"));
    const [showDiscordStep, setShowDiscordStep] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem("tebex_cart");
        return saved ? JSON.parse(saved) : [];
    });
    const [showCart, setShowCart] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [showFeatured, setShowFeatured] = useState(true); // Show featured by default
    const [featuredPackages, setFeaturedPackages] = useState([]);

    useEffect(() => {
        if (isOpen) {
            loadStore();
        }
    }, [isOpen]);

    useEffect(() => {
        localStorage.setItem("tebex_cart", JSON.stringify(cart));
    }, [cart]);

    const loadStore = async () => {
        setLoading(true);
        const data = await TebexService.getStoreListing();

        // Restructure categories to nest subcategories
        const categoriesMap = {};
        const topLevelCategories = [];

        // First pass: create a map of all categories
        data.forEach(cat => {
            categoriesMap[cat.id] = { ...cat, subcategories: [] };
        });

        // Second pass: nest subcategories under parents
        data.forEach(cat => {
            if (cat.parent && cat.parent.id) {
                // This is a subcategory
                if (categoriesMap[cat.parent.id]) {
                    categoriesMap[cat.parent.id].subcategories.push(categoriesMap[cat.id]);
                }
            } else {
                // This is a top-level category
                topLevelCategories.push(categoriesMap[cat.id]);
            }
        });

        console.log('Processed categories:', topLevelCategories);
        setCategories(topLevelCategories);

        // Extract featured packages (get packages from all categories)
        const allPackages = [];
        const extractPackages = (cats) => {
            cats.forEach(cat => {
                if (cat.packages && cat.packages.length > 0) {
                    allPackages.push(...cat.packages);
                }
                if (cat.subcategories && cat.subcategories.length > 0) {
                    extractPackages(cat.subcategories);
                }
            });
        };
        extractPackages(topLevelCategories);

        // Fetch featured stats from DB
        let featured = [];
        try {
            const featuredStats = await AnalyticsService.getFeaturedItems();
            if (featuredStats && featuredStats.length > 0) {
                // Map stats to actual package objects
                featured = featuredStats
                    .map(stat => allPackages.find(p => String(p.id) === String(stat.item_id)))
                    .filter(p => p !== undefined);
            }
        } catch (e) {
            console.warn("Could not fetch featured stats", e);
        }

        // Fallback to order if no DB stats or not enough data
        if (featured.length === 0) {
            featured = allPackages
                .sort((a, b) => (a.order || 999) - (b.order || 999))
                .slice(0, 6);
        }

        setFeaturedPackages(featured);

        if (topLevelCategories.length > 0) {
            setActiveCategory(topLevelCategories[0]);
        }
        setLoading(false);
    };

    const handleCategoryClick = (cat) => {
        setActiveCategory(cat);
        setShowFeatured(false); // Switch to category view
    };

    const handleFeaturedClick = () => {
        setShowFeatured(true);
    };

    const toggleCategory = (catId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    const addToCart = (item) => {
        // Track event
        AnalyticsService.trackEvent(username, 'add_to_cart', item);

        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                // Check for quantity limit
                if (item.disable_quantity) {
                    alert("Este artículo solo se puede comprar una vez por pedido.");
                    return prevCart;
                }

                return prevCart.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, {
                id: item.id,
                name: item.name,
                price: item.total_price,
                currency: item.currency,
                image: item.image,
                disable_quantity: item.disable_quantity, // Store this flag
                quantity: 1
            }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCart(prevCart => {
            const item = prevCart.find(i => i.id === itemId);
            if (item && item.disable_quantity && quantity > 1) {
                return prevCart; // Do not allow increasing > 1
            }

            return prevCart.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            );
        });
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío");
            return;
        }

        setProcessing("checkout");
        try {
            // 1. Create Basket
            const returnUrl = window.location.href;
            const cancelUrl = window.location.href;
            const basket = await TebexService.createBasket(returnUrl, cancelUrl, username);

            // 2. Add all items from cart
            let updatedBasket = basket;
            for (const item of cart) {
                for (let i = 0; i < item.quantity; i++) {
                    updatedBasket = await TebexService.addToBasket(basket.ident, item.id);
                }
            }


            // 3. Clear cart and redirect to Checkout
            if (updatedBasket.links && updatedBasket.links.checkout) {
                setCart([]);
                localStorage.removeItem("tebex_cart");
                window.location.href = updatedBasket.links.checkout;
            } else {
                console.error("No checkout link found");
                alert("Error al procesar la compra. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Checkout failed", error);
            alert(`Ocurrió un error al procesar el pago: ${error.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const user = e.target.username.value.trim();
        if (user) {
            setUsername(user);
            localStorage.setItem("tebex_username", user);
            setShowLogin(false);
            setShowDiscordStep(true); // Show Discord step after username

            // Track login
            AnalyticsService.trackLogin(user);
        }
    };

    const handleDiscordConnect = () => {
        // Open Discord auth in new window
        window.open(
            "https://ident.tebex.io/discord/?return=https://808-tebex.tebex.io/checkout",
            "_blank",
            "width=600,height=700"
        );
        // Continue to shop
        setShowDiscordStep(false);
    };

    const handleSkipDiscord = () => {
        setShowDiscordStep(false);
    };

    const handleLogout = () => {
        setUsername("");
        localStorage.removeItem("tebex_username");
        setShowLogin(true);
        setShowDiscordStep(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#0f0b1e] w-full max-w-5xl h-[80vh] rounded-2xl border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#130b24]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                            <IconCart />
                        </div>
                        <h2 className="text-2xl font-bold font-mono text-white">TIENDA 808</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {!showLogin && (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400 font-mono">Hola, <span className="text-white font-bold">{username}</span></span>
                                    <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 underline">Salir</button>
                                </div>
                                <button
                                    onClick={() => setShowCart(!showCart)}
                                    className="relative text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    <IconCart />
                                    {getCartCount() > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {getCartCount()}
                                        </span>
                                    )}
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                        >
                            <IconX />
                        </button>
                    </div>
                </div>

                {showLogin ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gaming-bg">
                        <div className="bg-[#130b24] p-8 rounded-2xl border border-purple-500/30 shadow-2xl max-w-md w-full text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">Identifícate</h3>
                            <p className="text-gray-400 mb-6 text-sm">Ingresa tu nombre de usuario de Minecraft para continuar.</p>
                            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Ej: Steve"
                                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none font-mono"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    ENTRAR A LA TIENDA
                                </button>
                            </form>
                        </div>
                    </div>
                ) : showDiscordStep ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gaming-bg">
                        <div className="bg-[#130b24] p-8 rounded-2xl border border-purple-500/30 shadow-2xl max-w-md w-full text-center">
                            <div className="mb-4 flex justify-center">
                                <svg className="w-16 h-16 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Conecta tu Discord</h3>
                            <p className="text-gray-400 mb-6 text-sm">Conecta tu cuenta de Discord para recibir automáticamente tus rangos en el servidor después de tu compra.</p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDiscordConnect}
                                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                    CONECTAR CON DISCORD
                                </button>
                                <button
                                    onClick={handleSkipDiscord}
                                    className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 rounded-lg transition-colors border border-white/10"
                                >
                                    OMITIR Y CONTINUAR
                                </button>
                            </div>
                            <p className="text-gray-500 text-xs mt-4">Puedes conectar tu Discord más tarde durante el proceso de pago.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar */}
                        <aside className="w-64 bg-[#0a0319] border-r border-white/5 p-4 overflow-y-auto hidden md:block">
                            {loading ? (
                                <div className="text-center text-gray-500 py-4">Cargando...</div>
                            ) : (
                                <nav className="space-y-1">
                                    {/* Destacados Button */}
                                    <button
                                        onClick={handleFeaturedClick}
                                        className={`w-full text-left px-4 py-3 rounded-lg font-mono text-sm transition-all mb-3 ${showFeatured
                                            ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/50 shadow-lg'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                            }`}
                                    >
                                        ⭐ DESTACADOS
                                    </button>

                                    <div className="border-t border-white/10 my-2"></div>

                                    {categories.map((cat) => (
                                        <div key={cat.id}>
                                            <div className="flex items-center">
                                                {cat.subcategories && cat.subcategories.length > 0 && (
                                                    <button
                                                        onClick={() => toggleCategory(cat.id)}
                                                        className="p-1 hover:bg-white/5 rounded"
                                                    >
                                                        {expandedCategories[cat.id] ? <IconChevronDown /> : <IconChevronRight />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleCategoryClick(cat)}
                                                    className={`flex-1 text-left px-4 py-3 rounded-lg font-mono text-sm transition-all ${!cat.subcategories?.length && activeCategory?.id === cat.id && !showFeatured
                                                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    {cat.name}
                                                </button>
                                            </div>
                                            {/* Subcategories */}
                                            {expandedCategories[cat.id] && cat.subcategories && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {cat.subcategories.map((subcat) => (
                                                        <button
                                                            key={subcat.id}
                                                            onClick={() => handleCategoryClick(subcat)}
                                                            className={`w-full text-left px-4 py-2 rounded-lg font-mono text-xs transition-all ${activeCategory?.id === subcat.id && !showFeatured
                                                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                }`}
                                                        >
                                                            {subcat.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                            )}
                        </aside>

                        {/* Cart Sidebar */}
                        {showCart && (
                            <aside className="w-80 bg-[#0a0319] border-r border-white/5 p-4 overflow-y-auto flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-bold">Carrito</h3>
                                    <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white">
                                        <IconX />
                                    </button>
                                </div>

                                {cart.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                        Tu carrito está vacío
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 space-y-3 overflow-y-auto">
                                            {cart.map((item) => (
                                                <div key={item.id} className="bg-[#130b24] rounded-lg p-3 border border-white/5">
                                                    <div className="flex gap-3">
                                                        {item.image && (
                                                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                                        )}
                                                        <div className="flex-1">
                                                            <h4 className="text-white text-sm font-bold line-clamp-1">{item.name}</h4>
                                                            <p className="text-purple-400 text-xs font-mono">{item.price} {item.currency}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                    className="bg-white/5 hover:bg-white/10 text-white w-6 h-6 rounded flex items-center justify-center text-sm"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="text-white text-xs w-8 text-center">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    className={`bg-white/5 hover:bg-white/10 text-white w-6 h-6 rounded flex items-center justify-center text-sm ${item.disable_quantity ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    disabled={item.disable_quantity}
                                                                >
                                                                    +
                                                                </button>
                                                                <button
                                                                    onClick={() => removeFromCart(item.id)}
                                                                    className="ml-auto text-red-400 hover:text-red-300 p-1"
                                                                >
                                                                    <IconTrash />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-gray-400 text-sm">Total:</span>
                                                <span className="text-white font-bold font-mono">
                                                    {getTotalPrice().toFixed(2)} {cart[0]?.currency || "USD"}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleCheckout}
                                                disabled={processing === "checkout"}
                                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                {processing === "checkout" ? (
                                                    <>
                                                        <IconLoading />
                                                        PROCESANDO...
                                                    </>
                                                ) : (
                                                    "PROCEDER AL PAGO"
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </aside>
                        )}

                        {/* Main Content */}
                        <main className="flex-1 p-6 overflow-y-auto bg-gaming-bg">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <IconLoading />
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Category Selector */}
                                    <div className="md:hidden mb-6 overflow-x-auto pb-2 flex gap-2">
                                        <button
                                            onClick={handleFeaturedClick}
                                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${showFeatured
                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                : 'border-gray-700 text-gray-400'
                                                }`}
                                        >
                                            ⭐ DESTACADOS
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategoryClick(cat)}
                                                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${activeCategory?.id === cat.id && !showFeatured
                                                    ? 'bg-purple-600 border-purple-600 text-white'
                                                    : 'border-gray-700 text-gray-400'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>

                                    {showFeatured ? (
                                        <>
                                            <div className="mb-8">
                                                <h3 className="text-2xl font-bold text-white mb-2">⭐ Paquetes Destacados</h3>
                                                <p className="text-gray-400 text-sm">Los paquetes más populares de nuestra tienda</p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {featuredPackages.map((item) => (
                                                    <div key={item.id}
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-[#130b24] rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all group hover:-translate-y-1 shadow-lg flex flex-col cursor-pointer"
                                                    >
                                                        <div className="h-40 bg-gray-800 relative overflow-hidden">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">NO IMAGE</div>
                                                            )}
                                                            {/* Hover Overlay */}
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                                                                <span className="text-white font-bold text-xs text-center px-2 uppercase tracking-wider border border-white/30 py-1 rounded bg-black/40">Click para info</span>
                                                            </div>
                                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded z-20">
                                                                ⭐ POPULAR
                                                            </div>
                                                        </div>
                                                        <div className="p-4 flex flex-col flex-1 relative">
                                                            <h3 className="font-bold text-white mb-1 line-clamp-1" title={item.name}>{item.name}</h3>
                                                            <div className="flex items-end gap-2 mb-4">
                                                                <span className="text-xl font-mono text-purple-400">
                                                                    {item.total_price} {item.currency}
                                                                </span>
                                                            </div>
                                                            <div className="mt-auto">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        addToCart(item);
                                                                    }}
                                                                    className="w-full py-2 bg-white/5 hover:bg-purple-600 hover:text-white text-gray-300 rounded-lg font-mono text-sm font-bold transition-all border border-white/10 hover:border-purple-500 flex justify-center items-center gap-2"
                                                                >
                                                                    AÑADIR AL CARRITO
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {featuredPackages.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                                    <p>No hay paquetes destacados disponibles.</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {activeCategory?.packages?.map((item) => (
                                                    <div key={item.id}
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-[#130b24] rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all group hover:-translate-y-1 shadow-lg flex flex-col cursor-pointer"
                                                    >
                                                        <div className="h-40 bg-gray-800 relative overflow-hidden">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">NO IMAGE</div>
                                                            )}
                                                            {/* Hover Overlay */}
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                                                                <span className="text-white font-bold text-xs text-center px-2 uppercase tracking-wider border border-white/30 py-1 rounded bg-black/40">Click para info</span>
                                                            </div>
                                                            {item.sales_tax > 0 && ( // Just a placeholder logic for 'sale' or similar if API provides it
                                                                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-20">
                                                                    HOT
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-4 flex flex-col flex-1 relative">
                                                            <h3 className="font-bold text-white mb-1 line-clamp-1" title={item.name}>{item.name}</h3>
                                                            <div className="flex items-end gap-2 mb-4">
                                                                <span className="text-xl font-mono text-purple-400">
                                                                    {item.total_price} {item.currency}
                                                                </span>
                                                            </div>
                                                            <div className="mt-auto">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        addToCart(item);
                                                                    }}
                                                                    className="w-full py-2 bg-white/5 hover:bg-purple-600 hover:text-white text-gray-300 rounded-lg font-mono text-sm font-bold transition-all border border-white/10 hover:border-purple-500 flex justify-center items-center gap-2"
                                                                >
                                                                    AÑADIR AL CARRITO
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {(!activeCategory?.packages || activeCategory.packages.length === 0) && (
                                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                                    <p>No hay items disponibles en esta categoría.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </main>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#0a0319] flex justify-between items-center text-xs font-mono text-gray-500">
                    <div className="flex gap-4">
                        <button className="hover:text-purple-400 transition-colors">Términos y Condiciones</button>
                        <button className="hover:text-purple-400 transition-colors">Política de Privacidad</button>
                    </div>
                    <div>
                        Powered by <strong>Tebex</strong>
                    </div>
                </div>
            </div>

            {/* Item Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSelectedItem(null)}
                    ></div>
                    <div className="relative bg-[#130b24] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-purple-500/30 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/10 text-white rounded-full transition-colors"
                        >
                            <IconX />
                        </button>

                        {/* Image Section */}
                        <div className="w-full md:w-1/2 bg-gray-900 relative">
                            {selectedItem.image ? (
                                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono">NO IMAGE</div>
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                            <h2 className="text-3xl font-bold text-white mb-2">{selectedItem.name}</h2>
                            <div className="text-2xl font-mono text-purple-400 mb-6">
                                {selectedItem.total_price} {selectedItem.currency}
                            </div>

                            <div className="prose prose-invert prose-sm mb-8 flex-1 overflow-y-auto custom-scrollbar">
                                <div dangerouslySetInnerHTML={{ __html: selectedItem.description }} />
                            </div>

                            <button
                                onClick={() => {
                                    if (selectedItem.disable_quantity && cart.some(i => i.id === selectedItem.id)) {
                                        return; // Already in cart
                                    }
                                    addToCart(selectedItem);
                                    setSelectedItem(null);
                                }}
                                disabled={selectedItem.disable_quantity && cart.some(i => i.id === selectedItem.id)}
                                className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 ${selectedItem.disable_quantity && cart.some(i => i.id === selectedItem.id)
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-purple-500/25'
                                    }`}
                            >
                                <IconCart />
                                {selectedItem.disable_quantity && cart.some(i => i.id === selectedItem.id)
                                    ? "YA EN EL CARRITO"
                                    : "AÑADIR AL CARRITO"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
