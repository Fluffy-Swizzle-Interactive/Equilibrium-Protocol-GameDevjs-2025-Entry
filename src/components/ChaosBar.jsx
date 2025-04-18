import React, { useState, useEffect, useCallback } from 'react';
import { EventBus } from '../game/EventBus';
import { CHAOS, GroupId } from '../game/constants';

/**
 * ChaosBar Component
 * A bi-directional bar that visualizes the current state of the chaos meter
 * Shows the balance between AI (blue) and Coders (red) factions.
 */
const ChaosBar = () => {
    // State to track current chaos value
    const [chaosValue, setChaosValue] = useState(0);
    
    // State for visual effect on major events
    const [flashing, setFlashing] = useState(false);
    
    // State to track if we're in development mode
    const isDev = import.meta.env.DEV;
    
    // Debug state to show when events are received
    const [lastEvent, setLastEvent] = useState('None');
    
    // Generate a CSS color from a hex number
    const hexToColor = useCallback((hex) => {
        return `#${hex.toString(16).padStart(6, '0')}`;
    }, []);
    
    // Get colors from constants or use fallbacks if not defined
    const aiColor = CHAOS?.COLORS?.AI ? hexToColor(CHAOS.COLORS.AI) : '#3333ff';
    const coderColor = CHAOS?.COLORS?.CODER ? hexToColor(CHAOS.COLORS.CODER) : '#ff3333';
    
    // Calculate normalized bar widths (0-100%)
    const minValue = CHAOS?.MIN_VALUE || -100;
    const maxValue = CHAOS?.MAX_VALUE || 100;
    
    const aiWidth = Math.max(0, -chaosValue) / Math.abs(minValue) * 100; // Left side (negative chaos)
    const coderWidth = Math.max(0, chaosValue) / maxValue * 100; // Right side (positive chaos)
    
    // Handle chaos value changes
    const handleChaosChanged = useCallback((data) => {
        if (isDev) console.log('Received chaos-changed event:', data);
        
        setChaosValue(data.newValue || data.value || 0);
        setLastEvent('chaos-changed');
        
        // Check for major events that should trigger flashing
        const majorEventThreshold = CHAOS?.MAJOR_EVENT_VALUE || 85;
        if (Math.abs(data.newValue || data.value || 0) >= majorEventThreshold && 
            Math.abs(data.oldValue || 0) < majorEventThreshold) {
            // Start flashing effect for major events
            setFlashing(true);
            
            // Stop flashing after a delay
            setTimeout(() => setFlashing(false), 2000);
        }
    }, [isDev]);
    
    // Handle major chaos events
    const handleMajorChaos = useCallback((data) => {
        if (isDev) console.log('Received MAJOR_CHAOS event:', data);
        setLastEvent('MAJOR_CHAOS');
        
        // Trigger flashing effect
        setFlashing(true);
        
        // Stop flashing after a delay
        setTimeout(() => setFlashing(false), 2000);
    }, [isDev]);
    
    // Handle chaos reset events
    const handleChaosReset = useCallback(() => {
        if (isDev) console.log('Received chaos-reset event');
        setLastEvent('chaos-reset');
        
        setChaosValue(0);
        setFlashing(false);
    }, [isDev]);
    
    // Handle chaos sync events (sent periodically)
    const handleChaosSync = useCallback((data) => {
        if (isDev) console.log('Received chaos-sync event:', data);
        setLastEvent('chaos-sync');
        
        if (data && typeof data.value === 'number') {
            setChaosValue(data.value);
        }
    }, [isDev]);
    
    // Set up event listeners when component mounts
    useEffect(() => {
        // Subscribe to chaos events
        EventBus.on('chaos-changed', handleChaosChanged);
        EventBus.on('MAJOR_CHAOS', handleMajorChaos);
        EventBus.on('chaos-reset', handleChaosReset);
        EventBus.on('chaos-sync', handleChaosSync);
        
        if (isDev) console.log('ChaosBar: EventBus listeners registered');
        
        // Initialize with current chaos value if available
        if (window.game && window.game.scene.keys.WaveGame && 
            window.game.scene.keys.WaveGame.chaosManager) {
            const initialValue = window.game.scene.keys.WaveGame.chaosManager.getChaos();
            setChaosValue(initialValue);
            if (isDev) console.log('ChaosBar: Initialized with value from game:', initialValue);
        } else {
            if (isDev) console.log('ChaosBar: Could not initialize with game value, using default');
        }
        
        // Cleanup on unmount
        return () => {
            EventBus.off('chaos-changed', handleChaosChanged);
            EventBus.off('MAJOR_CHAOS', handleMajorChaos);
            EventBus.off('chaos-reset', handleChaosReset);
            EventBus.off('chaos-sync', handleChaosSync);
            if (isDev) console.log('ChaosBar: EventBus listeners removed');
        };
    }, [handleChaosChanged, handleMajorChaos, handleChaosReset, handleChaosSync, isDev]);
    
    // Style for the container
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '300px',
        height: '30px', // Increased height for better visibility
        backgroundColor: '#222',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        margin: '10px auto',
        boxShadow: flashing ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 2px 4px rgba(0, 0, 0, 0.3)',
        animation: flashing ? 'chaos-flash 0.5s alternate infinite' : 'none'
    };
    
    // Style for the AI side (left)
    const aiBarStyle = {
        height: '100%',
        width: `${aiWidth}%`,
        backgroundColor: aiColor,
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-100%)',
        transition: 'width 0.3s ease-out'
    };
    
    // Style for the Coder side (right)
    const coderBarStyle = {
        height: '100%',
        width: `${coderWidth}%`,
        backgroundColor: coderColor,
        position: 'absolute',
        left: '50%',
        transition: 'width 0.3s ease-out'
    };
    
    // Style for the center marker
    const centerMarkerStyle = {
        position: 'absolute',
        width: '2px',
        height: '100%',
        backgroundColor: '#fff',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2
    };
    
    // Style for labels
    const labelStyle = {
        fontSize: '12px', // Slightly larger font
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#fff',
        zIndex: 3,
        textShadow: '0 0 2px #000',
        userSelect: 'none',
        fontWeight: 'bold' // Make labels bold
    };
    
    // Dynamic label positions
    const aiLabelStyle = {
        ...labelStyle,
        left: '5%',
    };
    
    const coderLabelStyle = {
        ...labelStyle,
        right: '5%',
    };
    
    const chaosValueStyle = {
        ...labelStyle,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontWeight: 'bold',
        fontSize: '14px' // Larger font for the value
    };
    
    // Debug info display (only in development mode)
    const debugInfoStyle = {
        position: 'absolute',
        top: '100%',
        left: '0',
        width: '100%',
        fontSize: '10px',
        color: '#aaa',
        textAlign: 'center',
        marginTop: '2px'
    };
    
    return (
        <div className="chaos-bar-wrapper">
            <style>
                {`
                @keyframes chaos-flash {
                    from { opacity: 0.7; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
                    to { opacity: 1; filter: brightness(1.3); box-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
                }
                `}
            </style>
            
            <div style={containerStyle}>
                <div style={aiBarStyle}></div>
                <div style={coderBarStyle}></div>
                <div style={centerMarkerStyle}></div>
                <div style={aiLabelStyle}>AI</div>
                <div style={coderLabelStyle}>CODER</div>
                <div style={chaosValueStyle}>{Math.round(chaosValue)}</div>
            </div>
            
            {/* Show debug info in development mode */}
            {isDev && (
                <div style={debugInfoStyle}>
                    Last event: {lastEvent}
                </div>
            )}
        </div>
    );
};

export default ChaosBar;