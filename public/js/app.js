const { useState, useEffect, useCallback, useRef, createContext, useContext } = React;

const socket = io();

// ============ AUDIO CONTEXT ============
const AudioContext = createContext();

const useAudio = () => useContext(AudioContext);

// Sound effect URLs (using Web Audio API with oscillators as fallback)
// Sound effect URLs (using Web Audio API with oscillators as fallback)
const createAudioContext = () => {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtor) {
        console.warn('Web Audio API not supported (AudioContext not found).');
        return null;
    }

    if (typeof AudioCtor !== 'function') {
        console.warn('Web Audio API found but not a constructor. Type:', typeof AudioCtor);
        return null;
    }

    try {
        const ctx = new AudioCtor();
        console.log('AudioContext created successfully.');
        return ctx;
    } catch (e) {
        console.error('Failed to initialize AudioContext:', e);
        return null;
    }
};

const AudioProvider = ({ children }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [sfxEnabled, setSfxEnabled] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const audioContextRef = useRef(null);

    // Initialize AudioContext on first user interaction
    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = createAudioContext();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        // Add listeners for first user interaction
        const handleInteraction = () => {
            initAudio();
            // Remove listeners after first interaction
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('keydown', handleInteraction);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [initAudio]);

    const playSound = useCallback((type) => {
        if (isMuted || !sfxEnabled || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch (type) {
            case 'cardShuffle':
                // Quick shuffle sound
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
                break;

            case 'cardPlay':
                // Click/tap sound
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.1);
                break;

            case 'coins':
                // Coin/point sound - cheerful ascending
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, ctx.currentTime);
                oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
                break;

            case 'tozzolo':
                // Wooden knock sound
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(150, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.1);
                // Second knock
                setTimeout(() => {
                    if (isMuted || !sfxEnabled) return;
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.type = 'square';
                    osc2.frequency.setValueAtTime(130, ctx.currentTime);
                    osc2.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.05);
                    gain2.gain.setValueAtTime(0.25, ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.1);
                }, 120);
                break;

            case 'scopa':
                // Celebratory sweep sound
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
                break;

            case 'click':
                // UI click
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.05);
                break;

            case 'emote':
                // Cute pop for emote
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(500, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
                break;

            default:
                return;
        }
    }, [isMuted, sfxEnabled]);

    return (
        <AudioContext.Provider value={{ isMuted, setIsMuted, sfxEnabled, setSfxEnabled, playSound }}>
            {children}
        </AudioContext.Provider>
    );
};

// ============ SETTINGS PANEL ============
const SettingsPanel = ({ isOpen, onClose }) => {
    const { isMuted, setIsMuted, sfxEnabled, setSfxEnabled, playSound } = useAudio();

    if (!isOpen) return null;

    return (
        <div className="settings-panel">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">⚙️ Impostazioni</h3>
                <button onClick={onClose} className="text-white/60 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-4">
                {/* Master Audio Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{isMuted ? '🔇' : '🔊'}</span>
                        <span className="text-white text-sm">Audio</span>
                    </div>
                    <div
                        className={`toggle-switch ${!isMuted ? 'active' : ''}`}
                        onClick={() => {
                            setIsMuted(!isMuted);
                            if (isMuted) playSound('click');
                        }}
                    />
                </div>

                {/* SFX Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎵</span>
                        <span className="text-white text-sm">Effetti Sonori</span>
                    </div>
                    <div
                        className={`toggle-switch ${sfxEnabled && !isMuted ? 'active' : ''}`}
                        onClick={() => {
                            setSfxEnabled(!sfxEnabled);
                            if (!sfxEnabled) playSound('click');
                        }}
                    />
                </div>

                {/* Sound Test Buttons */}
                <div className="pt-3 border-t border-white/10">
                    <p className="text-white/50 text-xs mb-2">Test suoni:</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => playSound('cardPlay')}
                            className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                        >
                            🃏 Carta
                        </button>
                        <button
                            onClick={() => playSound('coins')}
                            className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                        >
                            💰 Punti
                        </button>
                        <button
                            onClick={() => playSound('tozzolo')}
                            className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                        >
                            👊 Tozzolo
                        </button>
                        <button
                            onClick={() => playSound('scopa')}
                            className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                        >
                            🧹 Scopa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ SETTINGS BUTTON ============
const SettingsButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isMuted, setIsMuted, playSound } = useAudio();

    return (
        <>
            <button
                className={`settings-btn ${isMuted ? 'muted' : ''}`}
                onClick={() => {
                    playSound('click');
                    setIsOpen(!isOpen);
                }}
            >
                <span className="text-xl">{isMuted ? '🔇' : '⚙️'}</span>
            </button>
            <SettingsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

// Suit symbols and colors
const SUIT_INFO = {
    denari: { symbol: '♦', code: 'D', color: '#FFD700', bgColor: '#FFF8DC', name: 'Denari' },
    coppe: { symbol: '♥', code: 'C', color: '#DC143C', bgColor: '#FFE4E6', name: 'Coppe' },
    bastoni: { symbol: '♣', code: 'B', color: '#228B22', bgColor: '#F0FFF0', name: 'Bastoni' },
    spade: { symbol: '♠', code: 'S', color: '#4169E1', bgColor: '#E6E6FA', name: 'Spade' }
};
const getCardImageSrc = (card) => {
    if (!card) return null;
    const suitCode = SUIT_INFO[card.suit]?.code || card.suit.charAt(0).toUpperCase();
    return `/assets/cards/${card.value}${suitCode}.webp`;
};

const getFigureName = (value) => {
    const names = { 8: 'Fante', 9: 'Cavallo', 10: 'Re' };
    return names[value] || null;
};

// Responsive card sizes
const useCardSize = () => {
    const [size, setSize] = useState({ width: 60, height: 90 });

    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            if (w < 400) setSize({ width: 45, height: 68 });
            else if (w < 640) setSize({ width: 55, height: 83 });
            else if (w < 768) setSize({ width: 65, height: 98 });
            else setSize({ width: 75, height: 113 });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return size;
};

// ============ EMOTES ============
const EMOTES = ['😎', '😡', '😂', '🤘'];

const FloatingEmote = ({ emoji, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return <div className="floating-emote">{emoji}</div>;
};

const EmoteButton = ({ onEmote }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { playSound } = useAudio();

    const handleEmoteClick = (emoji) => {
        playSound('emote');
        onEmote(emoji);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {isOpen && (
                <div className="emote-menu">
                    {EMOTES.map((emoji) => (
                        <button
                            key={emoji}
                            className="emote-btn"
                            onClick={() => handleEmoteClick(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => {
                    playSound('click');
                    setIsOpen(!isOpen);
                }}
                className="bg-gradient-to-r from-pink-500 to-orange-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
            >
                <span className="text-lg">😀</span>
            </button>
        </div>
    );
};

// ============ CHAT COMPONENT ============
const Chat = ({ isOpen, onToggle, onEmote }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const { playSound } = useAudio();

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => {
        socket.on('chatMessage', (data) => {
            setMessages(prev => [...prev, { ...data, id: Date.now(), type: 'message' }]);
            if (!isOpen) setUnreadCount(prev => prev + 1);
        });

        socket.on('notification', (data) => {
            if (data.type === 'playerJoined' || data.type === 'playerLeft') {
                setMessages(prev => [...prev, { id: Date.now(), type: 'system', message: data.message }]);
            }
        });

        return () => { socket.off('chatMessage'); };
    }, [isOpen]);

    useEffect(() => { scrollToBottom(); }, [messages]);
    useEffect(() => { if (isOpen) setUnreadCount(0); }, [isOpen]);

    const sendMessage = () => {
        if (!inputValue.trim()) return;
        playSound('click');
        socket.emit('chatMessage', { message: inputValue.trim() });
        setInputValue('');
    };

    if (!isOpen) {
        return (
            <div className="chat-container chat-minimized">
                <div className="flex gap-2">
                    <EmoteButton onEmote={onEmote} />
                    <button onClick={() => {
                        playSound('click');
                        onToggle();
                    }} className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform">
                        <span className="text-lg">💬</span>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-box">
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <span className="text-white font-bold text-sm flex items-center gap-1">💬 Chat</span>
                    <div className="flex items-center gap-2">
                        <EmoteButton onEmote={onEmote} />
                        <button onClick={onToggle} className="text-white/80 hover:text-white text-lg p-1">✕</button>
                    </div>
                </div>

                <div className="chat-messages p-2 space-y-1">
                    {messages.length === 0 && <p className="text-gray-500 text-center text-xs py-2">Nessun messaggio...</p>}
                    {messages.map(msg => (
                        <div key={msg.id} className="chat-message">
                            {msg.type === 'system' ? (
                                <p className="text-center text-gray-400 text-xs italic">{msg.message}</p>
                            ) : (
                                <div className="flex items-start gap-1">
                                    <span className="text-indigo-400 font-medium text-xs shrink-0">{msg.playerName}:</span>
                                    <span className="text-gray-200 text-xs break-words">{msg.message}</span>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-2 border-t border-white/10">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Messaggio..."
                            className="flex-1 bg-white/10 text-white placeholder-gray-400 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                            maxLength={200}
                        />
                        <button onClick={sendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors min-h-[44px]">📤</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ CARD COMPONENT ============
const Card = ({ card, onClick, isPlayable, isSelected, isHighlighted, isBack, size, animationDelay = 0, className = '' }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const defaultSize = useCardSize();
    const dimensions = size || defaultSize;
    const { playSound } = useAudio();

    if (!card && !isBack) return null;

    if (isBack) {
        return (
            <div className={`card card-back ${className}`} style={{ width: dimensions.width * 0.7, height: dimensions.height * 0.7 }} />
        );
    }

    const suit = SUIT_INFO[card.suit];
    const figureName = getFigureName(card.value);
    const imageSrc = getCardImageSrc(card);
    const showFallback = imageError || !imageLoaded;

    const handleClick = () => {
        if (isPlayable || !onClick) {
            playSound('cardShuffle');
            onClick?.();
        }
    };

    return (
        <div
            className={`card deal-animation relative
                        ${isPlayable ? 'card-playable' : ''}
                        ${isSelected ? 'card-selected' : ''}
                        ${isHighlighted ? 'card-highlight' : ''}
                        ${!isPlayable && onClick ? 'card-disabled opacity-50' : ''}
                        ${showFallback ? 'card-fallback' : ''}
                        ${className}
                    `}
            onClick={handleClick}
            style={{ width: dimensions.width, height: dimensions.height, animationDelay: `${animationDelay}ms` }}
            title={figureName ? `${card.value} - ${figureName} di ${suit.name}` : `${card.value} di ${suit.name}`}
        >
            <img
                src={imageSrc}
                alt={`${card.value} di ${suit.name}`}
                className={`card-image ${imageLoaded && !imageError ? 'block' : 'hidden'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                draggable={false}
            />

            {showFallback && (
                <>
                    <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
                        <span className="font-black" style={{ color: suit.color, fontSize: dimensions.width * 0.18 }}>{card.value}</span>
                        <span style={{ color: suit.color, fontSize: dimensions.width * 0.15 }}>{suit.symbol}</span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <span style={{ color: suit.color, fontSize: dimensions.width * 0.4, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>{suit.symbol}</span>
                            {figureName && dimensions.width > 50 && (
                                <span className="text-xs font-medium opacity-70" style={{ color: suit.color, fontSize: dimensions.width * 0.12 }}>{figureName}</span>
                            )}
                        </div>
                    </div>

                    <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180">
                        <span className="font-black" style={{ color: suit.color, fontSize: dimensions.width * 0.18 }}>{card.value}</span>
                        <span style={{ color: suit.color, fontSize: dimensions.width * 0.15 }}>{suit.symbol}</span>
                    </div>
                </>
            )}
        </div>
    );
};

// ============ LAST MOVE OVERLAY ============
const LastMoveOverlay = ({ lastAction, isVisible, onHide }) => {
    const cardSize = useCardSize();

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onHide, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onHide]);

    if (!isVisible || !lastAction || lastAction.type !== 'play') return null;

    const { player, card, captured, isScopa, isAssoPigliaTutto, assoOnEmptyTable } = lastAction;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="last-move-overlay bg-black/70 backdrop-blur-sm rounded-2xl p-4 max-w-sm mx-4">
                <div className="text-center text-white">
                    <p className="text-sm font-medium mb-2 opacity-80">{player} ha giocato:</p>
                    <div className="flex justify-center mb-3">
                        <Card card={card} size={{ width: cardSize.width * 1.3, height: cardSize.height * 1.3 }} />
                    </div>

                    {captured.length > 0 && (
                        <div className="mb-2">
                            <p className="text-xs opacity-70 mb-1">Ha preso:</p>
                            <div className="flex justify-center gap-1 flex-wrap">
                                {captured.map(c => (
                                    <Card key={c.id} card={c} size={{ width: cardSize.width * 0.8, height: cardSize.height * 0.8 }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {isScopa && (
                        <div className="mt-2 bg-yellow-500/30 rounded-lg py-1 px-3 inline-block">
                            <span className="text-yellow-300 font-bold">🧹 SCOPA!</span>
                        </div>
                    )}

                    {isAssoPigliaTutto && (
                        <div className="mt-2 bg-red-500/30 rounded-lg py-1 px-3 inline-block">
                            <span className="text-red-300 font-bold">🃏 Asso Piglia Tutto!</span>
                        </div>
                    )}

                    {assoOnEmptyTable && (
                        <div className="mt-2 bg-blue-500/30 rounded-lg py-1 px-3 inline-block">
                            <span className="text-blue-300 text-sm">Asso su tavolo vuoto</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
// ============ LOBBY COMPONENT ============
const Lobby = () => {
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { playSound } = useAudio();

    const handleCreate = () => {
        if (!playerName.trim()) { setError('Inserisci un nome'); return; }
        playSound('click');
        setIsLoading(true);
        socket.emit('createRoom', { playerName: playerName.trim() });
    };

    const handleJoin = () => {
        if (!playerName.trim()) { setError('Inserisci un nome'); return; }
        if (!roomCode.trim()) { setError('Inserisci il codice stanza'); return; }
        playSound('click');
        setIsLoading(true);
        socket.emit('joinRoom', { roomCode: roomCode.trim(), playerName: playerName.trim() });
    };

    useEffect(() => {
        socket.on('error', (data) => { setError(data.message); setIsLoading(false); });
        return () => socket.off('error');
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <SettingsButton />
            <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl shadow-lg mb-3">
                        <span className="text-3xl">🃏</span>
                    </div>
                    <h1 className="title-font text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-600">Tuzzilicchio</h1>
                    <p className="text-gray-500 text-sm mt-1">Scopa napoletana con varianti</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded-lg mb-3 flex items-center gap-2 text-sm">
                        <span>⚠️</span><span>{error}</span>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                        <input type="text" placeholder="Il tuo nome" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-base bg-gray-50 focus:bg-white min-h-[44px]" maxLength={20} />
                    </div>

                    {!isJoining ? (
                        <>
                            <button onClick={handleCreate} disabled={isLoading}
                                className="w-full btn-primary text-white font-bold py-3 px-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-50">
                                {isLoading ? '⏳ Creazione...' : '🎮 Crea Partita'}
                            </button>
                            <button onClick={() => { playSound('click'); setIsJoining(true); }}
                                className="w-full btn-secondary text-white font-bold py-3 px-4 rounded-xl text-base flex items-center justify-center gap-2">
                                🚪 Unisciti
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔑</span>
                                <input type="text" placeholder="Codice Stanza" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg tracking-[0.2em] text-center font-mono bg-gray-50 focus:bg-white min-h-[44px]" maxLength={5} />
                            </div>
                            <button onClick={handleJoin} disabled={isLoading}
                                className="w-full btn-secondary text-white font-bold py-3 px-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-50">
                                {isLoading ? '⏳ Connessione...' : '✅ Entra'}
                            </button>
                            <button onClick={() => { playSound('click'); setIsJoining(false); }} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-xl">← Indietro</button>
                        </>
                    )}
                </div>

                <div className="mt-5 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-1 text-sm">📜 Regole Speciali</h3>
                    <ul className="text-xs text-amber-700 space-y-1">
                        <li className="flex items-start gap-1"><span>🃏</span><span><b>Asso Piglia Tutto</b></span></li>
                        <li className="flex items-start gap-1"><span>🎯</span><span><b>Accoppia 11:</b> carte che sommano 11</span></li>
                        <li className="flex items-start gap-1"><span>👊</span><span><b>Tozzolo:</b> coppia/tris di 1,2,3 = +3 punti</span></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

// ============ WAITING ROOM COMPONENT ============
const WaitingRoom = ({ gameState }) => {
    const currentPlayer = gameState.players.find(p => p.socketId === socket.id);
    const [copied, setCopied] = useState(false);
    const { playSound } = useAudio();

    const handleReady = () => {
        playSound('click');
        socket.emit('playerReady');
    };

    const copyCode = () => {
        navigator.clipboard.writeText(gameState.roomId);
        playSound('click');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const playerColors = ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-orange-500 to-red-600', 'from-teal-500 to-cyan-600'];

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <SettingsButton />
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-5 w-full max-w-md">
                <div className="text-center mb-5">
                    <p className="text-gray-500 text-sm mb-1">Codice Stanza</p>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-xl cursor-pointer active:scale-95 transition-transform" onClick={copyCode}>
                        <span className="title-font text-2xl sm:text-3xl font-black tracking-[0.15em] text-gray-800">{gameState.roomId}</span>
                        <span className="text-xl">{copied ? '✅' : '📋'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{copied ? 'Copiato!' : 'Tocca per copiare'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[0, 1, 2, 3].map((idx) => {
                        const player = gameState.players[idx];
                        return (
                            <div key={idx} className={`relative p-3 rounded-xl transition-all ${player ? 'bg-white shadow-lg border-2 ' + (player.isReady ? 'border-green-400' : 'border-gray-200') : 'bg-gray-100 border-2 border-dashed border-gray-300'}`}>
                                {player ? (
                                    <>
                                        <div className={`player-avatar mx-auto mb-1 bg-gradient-to-br ${playerColors[idx]}`}>{player.name.charAt(0).toUpperCase()}</div>
                                        <p className={`text-center font-medium text-sm truncate ${player.socketId === socket.id ? 'text-green-600' : 'text-gray-800'}`}>
                                            {player.name}{player.socketId === socket.id && ' (Tu)'}
                                        </p>
                                        <div className={`text-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${player.isReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {player.isReady ? '✅ Pronto' : '⏳ Attesa'}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400 text-xl">?</span>
                                        </div>
                                        <p className="text-gray-400 text-xs">In attesa...</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button onClick={handleReady} className={`w-full font-bold py-3 px-4 rounded-xl text-base text-white ${currentPlayer?.isReady ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'btn-primary'}`}>
                    {currentPlayer?.isReady ? '❌ Non sono pronto' : '✅ Sono Pronto!'}
                </button>

                {gameState.players.length < 2 && (
                    <p className="text-center text-gray-500 mt-3 text-sm flex items-center justify-center gap-1">
                        <span className="animate-pulse">👥</span> Servono almeno 2 giocatori
                    </p>
                )}
            </div>
        </div>
    );
};

// ============ PLAYER AVATAR WITH EMOTE ============
const PlayerAvatar = ({ player, colorClass, showEmote, emoteEmoji, onEmoteComplete }) => {
    return (
        <div className="relative inline-block">
            <div className={`player-avatar mx-auto mb-1 bg-gradient-to-br ${colorClass}`}>
                {player.name.charAt(0).toUpperCase()}
                {showEmote && emoteEmoji && (
                    <FloatingEmote emoji={emoteEmoji} onComplete={onEmoteComplete} />
                )}
            </div>
            {player.isDealer && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow" title="Mazziere">M</span>
            )}
        </div>
    );
};

// ============ GAME TABLE COMPONENT ============
const GameTable = ({ gameState }) => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [showCaptureModal, setShowCaptureModal] = useState(false);
    const [captureOptions, setCaptureOptions] = useState([]);
    const [highlightedTableCards, setHighlightedTableCards] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [showLastMove, setShowLastMove] = useState(false);
    const [lastMoveData, setLastMoveData] = useState(null);
    const [playerEmotes, setPlayerEmotes] = useState({});
    const cardSize = useCardSize();
    const { playSound } = useAudio();

    const currentPlayer = gameState.players.find(p => p.socketId === socket.id);
    const isMyTurn = gameState.currentPlayerId === socket.id;
    const canKnock = currentPlayer?.canKnock;

    const addNotification = useCallback((notification) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { ...notification, id }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
    }, []);

    // Handle emote sending
    const handleSendEmote = useCallback((emoji) => {
        socket.emit('sendEmote', { emoji });
    }, []);

    // Listen for emotes from other players
    useEffect(() => {
        socket.on('playerEmote', ({ playerId, emoji }) => {
            playSound('emote');
            setPlayerEmotes(prev => ({ ...prev, [playerId]: emoji }));
            setTimeout(() => {
                setPlayerEmotes(prev => {
                    const updated = { ...prev };
                    delete updated[playerId];
                    return updated;
                });
            }, 3000);
        });

        return () => socket.off('playerEmote');
    }, [playSound]);

    // Show opponent's last move
    useEffect(() => {
        if (gameState.lastAction && gameState.lastAction.type === 'play' && gameState.lastAction.playerId !== socket.id) {
            setLastMoveData(gameState.lastAction);
            setShowLastMove(true);
            playSound('cardPlay');
        }
    }, [gameState.lastAction, playSound]);

    useEffect(() => {
        socket.on('notification', (data) => {
            addNotification(data);
            // Play sounds for special events
            if (data.type === 'scopa') playSound('scopa');
            if (data.type === 'tozzolo') playSound('tozzolo');
            if (data.type === 'assoPigliaTutto') playSound('coins');
        });
        socket.on('error', (data) => addNotification({ type: 'error', message: data.message }));
        return () => { socket.off('notification'); socket.off('error'); };
    }, [addNotification, playSound]);

    const handleCardClick = (card) => {
        if (!isMyTurn) return;

        const captures = gameState.possibleCaptures[card.id] || [];

        if (selectedCard?.id === card.id) {
            setSelectedCard(null);
            setHighlightedTableCards([]);
        } else {
            setSelectedCard(card);
            if (captures.length > 0) {
                const allCaptureCards = captures.flatMap(c => c.cards.map(cc => cc.id));
                setHighlightedTableCards([...new Set(allCaptureCards)]);
            } else {
                setHighlightedTableCards([]);
            }
        }
    };

    const handlePlayCard = () => {
        if (!selectedCard || !isMyTurn) return;

        const captures = gameState.possibleCaptures[selectedCard.id] || [];
        playSound('cardPlay');

        if (captures.length > 1) {
            setCaptureOptions(captures);
            setShowCaptureModal(true);
        } else {
            socket.emit('playCard', { cardId: selectedCard.id, captureChoice: 0 });
            setSelectedCard(null);
            setHighlightedTableCards([]);
        }
    };

    const handleCaptureChoice = (index) => {
        playSound('cardPlay');
        socket.emit('playCard', { cardId: selectedCard.id, captureChoice: index });
        setSelectedCard(null);
        setHighlightedTableCards([]);
        setShowCaptureModal(false);
        setCaptureOptions([]);
    };

    const handleTozzolo = () => {
        playSound('tozzolo');
        socket.emit('declareTozzolo');
    };

    const opponents = gameState.players.filter(p => p.socketId !== socket.id);
    const playerColors = ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-orange-500 to-red-600'];

    return (
        <div className="min-h-screen flex flex-col">
            <SettingsButton />

            {/* Notifications */}
            <div className="fixed top-16 right-2 z-50 space-y-2 max-w-[280px]">
                {notifications.map(notif => (
                    <div key={notif.id} className={`toast px-3 py-2 rounded-xl shadow-xl text-white font-medium text-sm flex items-center gap-2 ${notif.type === 'scopa' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                        notif.type === 'tozzolo' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                            notif.type === 'assoPigliaTutto' ? 'bg-gradient-to-r from-red-600 to-pink-600' :
                                notif.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-700' :
                                    'bg-gradient-to-r from-blue-600 to-indigo-600'
                        }`}>
                        <span className="text-lg">{notif.type === 'scopa' ? '🧹' : notif.type === 'tozzolo' ? '👊' : notif.type === 'assoPigliaTutto' ? '🃏' : notif.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                        <span className="flex-1">{notif.message}</span>
                    </div>
                ))}
            </div>

            {/* Last Move Overlay */}
            <LastMoveOverlay lastAction={lastMoveData} isVisible={showLastMove} onHide={() => setShowLastMove(false)} />

            {/* Game Info Bar */}
            <div className="bg-gradient-to-r from-green-900 via-green-800 to-green-900 text-white py-2 px-3 flex justify-between items-center shadow-lg flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="title-font font-bold text-base sm:text-lg flex items-center gap-1">
                        <span className="text-lg sm:text-xl">🃏</span>
                        <span className="hidden sm:inline">Tuzzilicchio</span>
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="glass px-2 py-0.5 rounded-full">R{gameState.roundNumber}</span>
                        <span className="glass px-2 py-0.5 rounded-full hidden sm:inline">📚{gameState.deckRemaining}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                    {gameState.players.map((p) => (
                        <div key={p.id} className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all text-xs ${p.socketId === gameState.currentPlayerId ? 'bg-yellow-500/30 ring-1 ring-yellow-400' : 'bg-white/10'}`}>
                            <span className="font-medium truncate max-w-[60px] sm:max-w-none">{p.name}</span>
                            <span className="score-badge">{p.totalScore}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Opponents Area - Scrollable on mobile */}
                <div className="flex justify-center gap-2 sm:gap-4 py-2 px-2 bg-gradient-to-b from-green-900/80 to-transparent overflow-x-auto flex-shrink-0">
                    {opponents.map((opponent, idx) => (
                        <div key={opponent.id} className={`text-center p-2 rounded-xl flex-shrink-0 min-w-[90px] sm:min-w-[110px] ${opponent.socketId === gameState.currentPlayerId ? 'bg-yellow-500/20 ring-1 ring-yellow-400/50' : 'bg-black/20'}`}>
                            {/* Avatar con emote fluttuante */}
                            <PlayerAvatar
                                player={opponent}
                                colorClass={playerColors[idx]}
                                showEmote={!!playerEmotes[opponent.socketId]}
                                emoteEmoji={playerEmotes[opponent.socketId]}
                                onEmoteComplete={() => { }}
                            />
                            <div className={`text-white font-medium text-xs mb-1 truncate ${opponent.socketId === gameState.currentPlayerId ? 'text-yellow-300' : ''}`}>
                                {opponent.name}{opponent.socketId === gameState.currentPlayerId && ' 🎯'}
                            </div>
                            <div className="flex justify-center gap-0.5 mb-1">
                                {Array(Math.min(opponent.handCount, 3)).fill(0).map((_, i) => (
                                    <Card key={i} isBack size={{ width: cardSize.width * 0.5, height: cardSize.height * 0.5 }} />
                                ))}
                            </div>
                            {/* Stats avversario con TOZZOLI sempre visibili */}
                            <div className="flex justify-center gap-1 text-[10px] text-white/70 flex-wrap">
                                <span className="bg-white/10 px-1 rounded">📚{opponent.captureCount}</span>
                                <span className="bg-white/10 px-1 rounded">🧹{opponent.scope}</span>
                                {/* TOZZOLI - sempre visibile perché dichiarazione pubblica */}
                                <span className={`px-1 rounded ${opponent.tozzoli > 0 ? 'bg-purple-500/40 text-purple-200 font-bold' : 'bg-white/10'}`}>👊{opponent.tozzoli}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="flex-1 table-felt mx-2 my-1 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden">
                    <div className="text-white/50 text-xs mb-2">{gameState.table.length === 0 ? '✨ Tavolo vuoto' : `${gameState.table.length} carte`}</div>
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full px-2 overflow-y-auto max-h-[150px] sm:max-h-none">
                        {gameState.table.map((card, idx) => (
                            <Card key={card.id} card={card} isHighlighted={highlightedTableCards.includes(card.id)} animationDelay={idx * 50} />
                        ))}
                    </div>

                    {gameState.isLastHand && (
                        <div className="absolute bottom-1 right-2 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">⚠️ Ultima mano</div>
                    )}
                </div>

                {/* Current Player Area */}
                <div className="bg-gradient-to-t from-green-900 via-green-900/95 to-green-900/80 p-2 sm:p-3 safe-bottom flex-shrink-0">
                    {/* Turn indicator */}
                    <div className="text-center mb-2">
                        {isMyTurn ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold px-4 py-1 rounded-full shadow-lg text-sm animate-pulse">
                                <span>🎯</span> È il tuo turno!
                            </span>
                        ) : (
                            <span className="text-white/70 text-sm flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                                Turno di: <strong className="text-yellow-300">{gameState.currentPlayerName}</strong>
                            </span>
                        )}
                    </div>

                    {/* Player hand */}
                    <div className="flex justify-center gap-1 sm:gap-2 mb-2 overflow-x-auto py-1 px-2">
                        {currentPlayer?.hand.map((card, idx) => (
                            <Card
                                key={card.id}
                                card={card}
                                onClick={() => handleCardClick(card)}
                                isPlayable={isMyTurn}
                                isSelected={selectedCard?.id === card.id}
                                animationDelay={idx * 80}
                            />
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center gap-2 flex-wrap">
                        {selectedCard && isMyTurn && (
                            <button onClick={handlePlayCard} className="btn-secondary text-white font-bold py-2 px-4 sm:px-6 rounded-xl flex items-center gap-1 text-sm">
                                <span>🃏</span> Gioca
                            </button>
                        )}

                        {canKnock && (
                            <button onClick={handleTozzolo} className="btn-special text-white font-bold py-2 px-4 sm:px-6 rounded-xl flex items-center gap-1 text-sm animate-pulse">
                                <span>👊</span> Bussa Tozzolo!
                            </button>
                        )}
                    </div>

                    {/* Player stats */}
                    <div className="flex justify-center gap-2 sm:gap-3 mt-2">
                        <div className="glass text-white/90 px-2 py-1 rounded-lg flex items-center gap-1 text-xs">
                            <span>📚</span> {currentPlayer?.captureCount}
                        </div>
                        <div className="glass text-white/90 px-2 py-1 rounded-lg flex items-center gap-1 text-xs">
                            <span>🧹</span> {currentPlayer?.scope}
                        </div>
                        <div className="glass text-white/90 px-2 py-1 rounded-lg flex items-center gap-1 text-xs">
                            <span>👊</span> {currentPlayer?.tozzoli}
                        </div>
                    </div>
                </div>
            </div>

            <Chat isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} onEmote={handleSendEmote} />

            {/* Capture Choice Modal - Con priorità visibili */}
            {showCaptureModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3">
                    <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">🎯 Scegli la presa</h3>
                        <p className="text-xs text-gray-500 mb-3">Seleziona quale combinazione vuoi prendere</p>
                        <div className="space-y-2">
                            {captureOptions
                                .sort((a, b) => (a.priority || 'Z').localeCompare(b.priority || 'Z'))
                                .map((capture, idx) => {
                                    const isAssoPigliaTutto = capture.type === 'assoPigliaTutto';
                                    const isAccoppia11 = capture.type === 'accoppia11';
                                    const isDirect = capture.type === 'direct';
                                    const isSum = capture.type === 'sum';

                                    return (
                                        <button key={idx} onClick={() => handleCaptureChoice(captureOptions.indexOf(capture))}
                                            className={`w-full p-3 border-2 rounded-xl transition-all active:scale-98 min-h-[44px] text-left
                                                        ${isAssoPigliaTutto ? 'border-red-300 hover:border-red-500 hover:bg-red-50' :
                                                    isAccoppia11 ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-50' :
                                                        'border-gray-200 hover:border-green-500 hover:bg-green-50'}
                                                    `}>
                                            <div className="flex items-start gap-2">
                                                {/* Icona tipo */}
                                                <span className="text-xl shrink-0">
                                                    {isAssoPigliaTutto ? '🃏' : isAccoppia11 ? '🎯' : isDirect ? '📌' : '➕'}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    {/* Nome tipo + priorità */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`font-bold text-sm ${isAssoPigliaTutto ? 'text-red-700' : isAccoppia11 ? 'text-purple-700' : 'text-gray-700'}`}>
                                                            {isAssoPigliaTutto ? 'Asso Piglia Tutto' :
                                                                isAccoppia11 ? 'Accoppia 11' :
                                                                    isDirect ? 'Presa Diretta' : 'Presa per Somma'}
                                                        </span>
                                                        {capture.priority && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                                                                        ${capture.priority === 'A' ? 'bg-green-100 text-green-700' :
                                                                    capture.priority === 'B' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-gray-100 text-gray-500'}
                                                                    `}>
                                                                Priorità {capture.priority}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Descrizione */}
                                                    {capture.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{capture.description}</p>
                                                    )}

                                                    {/* Warning per Asso Piglia Tutto */}
                                                    {isAssoPigliaTutto && (
                                                        <p className="text-[10px] text-red-500 mt-1">⚠️ Non fa scopa anche se svuota il tavolo</p>
                                                    )}

                                                    {/* Carte prese */}
                                                    <div className="flex gap-1 flex-wrap mt-2">
                                                        {capture.cards.map(card => (
                                                            <span key={card.id} className="px-2 py-1 rounded text-xs font-bold shadow-sm"
                                                                style={{ backgroundColor: SUIT_INFO[card.suit].color + '20', color: SUIT_INFO[card.suit].color, border: `1px solid ${SUIT_INFO[card.suit].color}40` }}>
                                                                {card.value}{SUIT_INFO[card.suit].symbol}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                        <button onClick={() => { setShowCaptureModal(false); setCaptureOptions([]); }}
                            className="mt-3 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-xl font-medium min-h-[44px]">✕ Annulla</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============ ROUND END COMPONENT ============
const RoundEnd = ({ scores, gamePhase, winner }) => {
    const { playSound } = useAudio();

    useEffect(() => {
        if (gamePhase === 'gameEnd') {
            playSound('coins');
        } else {
            playSound('scopa');
        }
    }, [gamePhase, playSound]);

    const handleNextRound = () => {
        playSound('click');
        socket.emit('nextRound');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-3">
            <SettingsButton />
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl">
                <h2 className="title-font text-2xl sm:text-3xl font-black text-center mb-4">
                    {gamePhase === 'gameEnd' ? (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">🏆 Partita Terminata!</span>
                    ) : (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">📊 Fine Round</span>
                    )}
                </h2>

                {winner && (
                    <div className="text-center mb-4 bg-gradient-to-r from-yellow-100 to-amber-100 p-4 rounded-xl border-2 border-yellow-300">
                        <span className="text-4xl mb-1 block">🎉</span>
                        <p className="text-xl font-bold text-yellow-800">{winner} ha vinto!</p>
                    </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
                    <table className="w-full text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                <th className="p-2 text-left">Giocatore</th>
                                <th className="p-2 text-center">🧹</th>
                                <th className="p-2 text-center">📚</th>
                                <th className="p-2 text-center">💰</th>
                                <th className="p-2 text-center">7♦</th>
                                <th className="p-2 text-center">🎴</th>
                                <th className="p-2 text-center">👊</th>
                                <th className="p-2 text-center bg-green-700">+</th>
                                <th className="p-2 text-center bg-green-800">Tot</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scores.map((score, idx) => (
                                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                    <td className="p-2 font-bold text-gray-800">{score.playerName}</td>
                                    <td className="p-2 text-center">{score.scope}</td>
                                    <td className="p-2 text-center">{score.cards}{score.cardsPoint ? <span className="text-green-600">+1</span> : ''}</td>
                                    <td className="p-2 text-center">{score.denari}{score.denariPoint ? <span className="text-green-600">+1</span> : ''}</td>
                                    <td className="p-2 text-center">{score.settebello ? <span className="text-green-600">✓</span> : '—'}</td>
                                    <td className="p-2 text-center">{score.primiera}{score.primieraPoint ? <span className="text-green-600">+1</span> : ''}</td>
                                    <td className="p-2 text-center text-purple-600">{score.tozzoli}×3</td>
                                    <td className="p-2 text-center font-bold text-green-600 bg-green-100">+{score.roundTotal}</td>
                                    <td className="p-2 text-center font-black text-lg text-green-700 bg-green-200">{score.totalScore + score.roundTotal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {gamePhase !== 'gameEnd' ? (
                    <button onClick={handleNextRound} className="w-full btn-primary text-white font-bold py-3 px-4 rounded-xl text-base flex items-center justify-center gap-2">
                        <span>▶️</span> Prossimo Round
                    </button>
                ) : (
                    <button onClick={() => window.location.reload()} className="w-full btn-secondary text-white font-bold py-3 px-4 rounded-xl text-base flex items-center justify-center gap-2">
                        <span>🔄</span> Nuova Partita
                    </button>
                )}
            </div>
        </div>
    );
};

// ============ MAIN APP COMPONENT ============
const App = () => {
    const [gameState, setGameState] = useState(null);
    const [inRoom, setInRoom] = useState(false);
    const [roundEndData, setRoundEndData] = useState(null);

    useEffect(() => {
        socket.on('roomCreated', (data) => { setInRoom(true); setGameState(data.gameState); });
        socket.on('roomJoined', () => { setInRoom(true); });
        socket.on('gameState', (state) => { setGameState(state); if (state.gamePhase === 'playing') setRoundEndData(null); });
        socket.on('roundEnd', (data) => { setRoundEndData(data); });
        socket.on('gameEnd', (data) => { setRoundEndData({ ...data, gamePhase: 'gameEnd', winner: data.winner, scores: data.finalScores }); });

        return () => { socket.off('roomCreated'); socket.off('roomJoined'); socket.off('gameState'); socket.off('roundEnd'); socket.off('gameEnd'); };
    }, []);

    if (!inRoom) return <Lobby />;

    if (roundEndData) return <RoundEnd scores={roundEndData.scores} gamePhase={roundEndData.gamePhase} winner={roundEndData.winner} />;

    if (!gameState) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin text-5xl mb-3">🃏</div>
                <p className="text-white text-lg">Caricamento...</p>
            </div>
        </div>
    );

    if (gameState.gamePhase === 'waiting') return <WaitingRoom gameState={gameState} />;
    if (gameState.gamePhase === 'playing') return <GameTable gameState={gameState} />;

    return <div className="min-h-screen flex items-center justify-center"><div className="text-white">Stato: {gameState.gamePhase}</div></div>;
};

// ============ RENDER WITH AUDIO PROVIDER ============
const AppWithProviders = () => (
    <AudioProvider>
        <App />
    </AudioProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(<AppWithProviders />);
