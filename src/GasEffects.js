import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

const RotatingContainer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: center;
  pointer-events: none;
`;

const GasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
`;

const ArrowSign = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: bold;
  pointer-events: none;
  
  &::after {
    content: '→';
    transform: rotate(0deg);
  }
`;

const MessageBubble = styled(motion.div)`
  position: absolute;
  width: 180px;
  height: 90px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(255, 255, 255, 0.85) 50%, 
    rgba(255, 255, 255, 0.95) 100%
  );
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 70px 70px 35px 35px / 70px;
  color: #333;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: normal;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    0 4px 15px rgba(255, 255, 255, 0.3) inset,
    0 -2px 8px rgba(0, 0, 0, 0.1) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  overflow: hidden;
  
  /* Realistic cloud puffs */
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: radial-gradient(circle, 
      rgba(255, 255, 255, 0.9) 0%, 
      rgba(255, 255, 255, 0.7) 70%, 
      rgba(255, 255, 255, 0.9) 100%
    );
    border-radius: 50%;
    filter: blur(2px);
  }
  
  &::before {
    width: 25px;
    height: 25px;
    top: -8px;
    left: 12px;
    box-shadow: 
      0 3px 8px rgba(0, 0, 0, 0.15),
      0 2px 4px rgba(255, 255, 255, 0.2) inset;
  }
  
  &::after {
    width: 22px;
    height: 22px;
    top: -6px;
    right: 18px;
    box-shadow: 
      0 3px 6px rgba(0, 0, 0, 0.15),
      0 2px 3px rgba(255, 255, 255, 0.2) inset;
  }
  
  &:hover {
    transform: scale(1.08) translateY(-2px);
    background: linear-gradient(180deg, 
      rgba(255, 255, 255, 1) 0%, 
      rgba(255, 255, 255, 0.9) 50%, 
      rgba(255, 255, 255, 1) 100%
    );
    box-shadow: 
      0 12px 30px rgba(0, 0, 0, 0.25),
      0 6px 20px rgba(255, 255, 255, 0.4) inset,
      0 -2px 10px rgba(0, 0, 0, 0.1) inset,
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  
  &:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  /* Mobile styles removed - component doesn't render on mobile */
  
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: opacity 0.3s ease;
    transform: none !important;
  }
`;

const MessageCloud = styled(motion.div)`
  position: absolute;
  width: 180px;
  height: 90px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(102, 126, 234, 0.4);
  border-radius: 15px 15px 15px 15px;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: normal;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  box-shadow: 
    0 8px 25px rgba(102, 126, 234, 0.3),
    0 4px 15px rgba(255, 255, 255, 0.3) inset,
    0 -2px 8px rgba(0, 0, 0, 0.1) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  overflow: hidden;
  
  /* Message bubble tail */
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 12px solid #667eea;
  }
  
  &:hover {
    transform: scale(1.08) translateY(-2px);
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    box-shadow: 
      0 12px 30px rgba(102, 126, 234, 0.4),
      0 6px 20px rgba(255, 255, 255, 0.4) inset,
      0 -2px 10px rgba(0, 0, 0, 0.1) inset,
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  
  &:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  /* Mobile styles removed - component doesn't render on mobile */
  
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: opacity 0.3s ease;
    transform: none !important;
  }
`;

const ArrowSymbol = styled.div`
  position: absolute;
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  
  /* Mobile styles removed - component doesn't render on mobile */
`;

const GasEffects = ({ jarId, subheadings, isActive, isMobile, prefersReducedMotion }) => {
  const [particles, setParticles] = useState([]);
  const containerRef = useRef(null);
  
  // Generate positions for parallel horizontal lines with arrows
  const generateCircularPositions = (count, containerRect) => {
    const positions = [];
    const containerWidth = containerRect.width || 800; // Approximate container width
    const containerHeight = containerRect.height || 400; // Approximate container height
    
    // Jar position
    const jarX = 0; // Jar position (no mobile margin needed)
    const jarY = 110; // Perfectly straight with jar
    
    // Parallel line configuration
    const lineHeight = 2; // Number of horizontal lines
    const itemsPerLine = Math.ceil(count / lineHeight); // Items per line
    const horizontalSpacing = 140; // Spacing between items
    const verticalSpacing = 470; // Spacing between lines
    const startOffsetX = 100; // Start offset from left
    
    // Calculate positions for parallel horizontal lines with arrows
    let totalItems = 0;
    for (let line = 0; line < lineHeight; line++) {
      const itemsInThisLine = Math.min(count - (line * itemsPerLine), itemsPerLine);
      
      for (let i = 0; i < itemsInThisLine; i++) {
        const globalIndex = totalItems;
        let actualIndex;
        
        // Calculate actual index based on line
        if (line === 0) {
          // First line: swap first two items (0,1 -> 1,0), keep rest
          if (i === 0) actualIndex = 1;
          else if (i === 1) actualIndex = 0;
          else actualIndex = i;
        } else {
          // Second line: reverse order (4,5,6,7 -> 7,6,5,4)
          actualIndex = count - 1 - i;
        }
        
        // Add subheading
        const x = jarX + (i * horizontalSpacing * 2); // Double spacing to make room for arrows
        const y = jarY + (line * verticalSpacing) - (verticalSpacing / 2); // Center lines around jar
        
        positions.push({
          x,
          y,
          delay: globalIndex * 0.1,
          duration: 1.2, // Fixed duration since reduced motion is handled by early return
          scale: 1.0,
          type: 'subheading',
          text: null, // Will be filled later
          actualIndex: actualIndex // Store the actual index for mapping
        });
        
        // Add arrow before 7th item (first item of second line) rotated -90 degrees
        if (line === 1 && i === 0) {
          const firstArrowX = jarX - horizontalSpacing / 100; // Position closer to first subheading (reduced right margin)
          const firstArrowY = y + 25; // Add 20px top margin
          
          positions.push({
            x: firstArrowX,
            y: firstArrowY,
            delay: (globalIndex + 0.3) * 0.1,
            duration: 1.2, // Fixed duration since reduced motion is handled by early return
            scale: 1.0,
            type: 'arrow',
            text: '→', // Right arrow that will be rotated
            rotation: -90 // Rotate -90 degrees to point up (same as 270 degrees)
          });
        }
        
        // Add arrow between subheadings (except after the last one in each line)
        if (i < itemsInThisLine - 1 && !(line === 1 && i === 0)) {
          const arrowX = x + (horizontalSpacing / 2) - 10; // Position arrow closer to left item - 20px margin
          let arrowText = '→'; // Default right arrow
          
          // Different arrows for different lines and positions
          if (line === 0) {
            // First line - use right arrows
            arrowText = '→';
          } else {
            // Second line - use left arrows
            arrowText = '←';
          }
          
          positions.push({
            x: arrowX,
            y,
            delay: (globalIndex + 0.5) * 0.1,
            duration: 1.2, // Fixed duration since reduced motion is handled by early return
            scale: 1.0,
            type: 'arrow',
            text: arrowText
          });
        }
        
        // Add arrow after last item of second line (item 4)
        if (line === 1 && i === itemsInThisLine - 1) {
          const lastArrowX = x + horizontalSpacing - 80; // Position after last subheading with 20px right margin
          const lastArrowY = y; // Same Y position as the line
          
          positions.push({
            x: lastArrowX,
            y: lastArrowY,
            delay: (globalIndex + 1) * 0.1,
            duration: 1.2, // Fixed duration since reduced motion is handled by early return
            scale: 1.0,
            type: 'arrow',
            text: '←' // Left arrow for item 4
          });
        }
        
        // Add special arrows at the end of each line
        if (i === itemsInThisLine - 1) {
          let specialArrowX, specialArrowY, specialArrowText, rotation = 0;
          
          if (line === 0) {
            // First line - down arrow positioned at the end, rotated 90 degrees
            specialArrowX = x + horizontalSpacing; // Position after last subheading
            specialArrowY = y + 30; // Move down by 30px
            specialArrowText = '→'; // Use right arrow but rotate it
            rotation = 90; // Rotate 90 degrees clockwise to point down
            
            positions.push({
              x: specialArrowX,
              y: specialArrowY,
              delay: (globalIndex + 1) * 0.1,
              duration: 1.2, // Fixed duration since reduced motion is handled by early return
              scale: 1.0,
              type: 'special-arrow',
              text: specialArrowText,
              rotation: rotation
            });
          } else {
            // Second line - no regular arrow after last item, will be handled by regular arrow logic
          }
        }
        
        totalItems++;
      }
    }
    
    return positions;
  };
  
  useEffect(() => {
    const subheadingsArray = Array.isArray(subheadings) ? subheadings : Object.values(subheadings || {});
    
    if (!subheadingsArray || subheadingsArray.length === 0) {
      setParticles([]);
      return;
    }

    // Get actual container dimensions
    const containerRect = containerRef.current ? containerRef.current.getBoundingClientRect() : { width: 800, height: 400 };
    const positions = generateCircularPositions(subheadingsArray.length, containerRect);
    
    // Fill subheading texts into positions using actualIndex
    const newParticles = positions.map((position, index) => {
      if (position.type === 'subheading') {
        const subheading = subheadingsArray[position.actualIndex];
        return {
          ...position,
          id: `${jarId}-${subheading.id}`,
          text: subheading.subtitle_text,
          opacity: 0,
          scale: 0.4
        };
      } else {
        // Arrow or special arrow
        return {
          ...position,
          id: `${jarId}-${position.type}-${index}`,
          opacity: 0,
          scale: 0.4
        };
      }
    });

    setParticles(newParticles);
  }, [jarId, JSON.stringify(subheadings)]); // Removed mobile dependencies since effects are disabled on mobile

  // Framer Motion variants for gas-like emergence and movement
  const bubbleVariants = {
    hidden: {
      opacity: 0,
      scale: 0.4,
      x: 0,
      y: 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        delay: 0.15,
        ease: [0.25, 0.46, 0.45, 0.94] // Custom ease for organic motion
      }
    },
    exit: {
      opacity: 0,
      scale: 0.4,
      x: 0,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (particles.length === 0) {
    return null;
  }

  return (
    <GasContainer ref={containerRef}>
      <AnimatePresence>
        {isActive && particles.map((particle, index) => (
          <motion.div
            key={particle.id}
            variants={bubbleVariants}
            initial="hidden"
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              transition: {
                opacity: { duration: 1.2, delay: 0.15 },
                scale: { duration: 1.2, delay: 0.15 }
              }
            }}
            exit="hidden"
            style={{
              position: 'absolute',
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              transform: `translate(-50%, -50%) ${particle.rotation ? `rotate(${particle.rotation}deg)` : ''}`,
            }}
            onClick={() => {}}
            tabIndex={-1} // No tabbing needed since effects are disabled on mobile/reduced motion
            role={particle.type === 'arrow' || particle.type === 'special-arrow' ? 'presentation' : 'button'}
            aria-label={particle.type === 'arrow' || particle.type === 'special-arrow' ? undefined : `Subheading: ${particle.text}`}
          >
            {particle.type === 'arrow' || particle.type === 'special-arrow' ? (
              <ArrowSymbol style={{ transform: particle.rotation ? `rotate(${particle.rotation}deg)` : 'none' }}>
                {particle.text}
              </ArrowSymbol>
            ) : index === 0 ? (
              <MessageCloud>
                {particle.text}
              </MessageCloud>
            ) : (
              <MessageBubble>
                {particle.text}
              </MessageBubble>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </GasContainer>
  );
};

export default GasEffects;
