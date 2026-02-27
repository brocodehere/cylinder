import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { StyleSheetManager } from 'styled-components';
import LazyImage from './LazyImage';
import GasEffects from './GasEffects';
import axios from 'axios';
import './JarEffects.css';
import { useTheme } from './contexts/ThemeContext';

// Custom shouldForwardProp to filter out Framer Motion and custom props
const shouldForwardProp = (prop) => {
  return !['whileInView', 'whileHover', 'isMain', 'titleCount', '$isLoaded'].includes(prop);
};

// Performance optimization: Detect mobile and reduced motion
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  width: 100%;
`;

const LoadingText = styled(motion.p)`
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 500;
  margin-top: 20px;
  text-align: center;
`;

const LoadingJar = styled(motion.div)`
  width: 80px;
  height: 120px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.2) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 40px 40px 20px 20px;
  margin: 0 15px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.3) 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 15px 15px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    animation: bubble 2s ease-in-out infinite;
  }
  
  @keyframes bubble {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
    50% { transform: translate(-50%, -60%) scale(1.2); opacity: 1; }
  }
`;

const LoadingJarsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
`;

const HeroContainer = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 2rem;
  padding-top: -20px; /* Minimal top margin */
  z-index: 1;
  
  @media (max-width: 768px) {
    padding: 1rem; /* Reduced padding for mobile */
    padding-top: 2px; /* Almost no top margin on mobile */
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem; /* Even smaller padding for small mobile */
    padding-top: 0px; /* No top margin on small mobile */
  }
  
  @media (max-width: 1024px) {
    padding: 1.5rem; /* Slightly reduced padding for tablets */
    padding-top: 3px; /* Minimal top margin on tablets */
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 3rem;
  z-index: 10;
  
  @media (max-width: 768px) {
    margin-bottom: 2rem; /* Reduced margin for mobile */
  }
  
  @media (max-width: 480px) {
    margin-bottom: 1.5rem; /* Further reduced margin for small mobile */
  }
  
  @media (max-width: 1024px) {
    margin-bottom: 2.5rem; /* Slightly reduced margin for tablets */
  }
`;

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  background: var(--title-gradient, linear-gradient(135deg, #ffffff 0%, #e6f3ff 50%, #cce7ff 100%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  text-shadow: 0 0 40px rgba(102, 126, 234, 0.5);
`;

const ColumnsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1rem;
  max-width: 100%;
  width: 100%;
  min-height: 400px;
  position: relative;
  flex-wrap: wrap; /* Allow wrapping if needed */
  padding: 0 1rem; /* Add horizontal padding */
  
  @media (max-width: 768px) {
    justify-content: center; /* Center the limited jars */
    padding: 0 1rem 2rem 1rem; /* Conservative padding */
    gap: 1.25rem; /* Slightly larger gap for better spacing */
    margin: 0; /* Remove negative margin */
    overflow-x: visible; /* No horizontal scrolling needed */
    
    /* Remove scrollbar styles since no scrolling */
  }
  
  @media (max-width: 480px) {
    justify-content: center; /* Center the limited jars */
    padding: 0 0.75rem 2rem 0.75rem; /* Slightly smaller padding for very small screens */
    gap: 1rem; /* Good gap for very small screens */
    margin: 0; /* Remove negative margin */
    overflow-x: visible; /* No horizontal scrolling needed */
    
    /* Remove CSS hiding - let JavaScript handle jar limiting */
  }
  
  @media (max-width: 1024px) {
    gap: 0.875rem;
    padding: 0 0.5rem; /* Small padding for tablets */
  }
`;

const PolymerColumn = styled(motion.div)`
  width: 100px;
  height: 320px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 50%, 
    rgba(255, 255, 255, 0.1) 100%
  );
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px 50px 70px 70px / 18px 18px 55px 55px;
  position: relative;
  cursor: pointer;
  /* Performance: Only use backdrop-filter on one hero element */
  backdrop-filter: ${props => props.$isPrimary ? 'blur(10px)' : 'none'};
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 0 20px rgba(255, 255, 255, 0.1),
    0 0 25px rgba(102, 126, 234, 0.3);
  text-shadow: 
    0 0 40px rgba(102, 126, 234, 0.3),
    0 0 12px rgba(102, 126, 234, 0.6);
  transition: all 0.3s ease;
  flex-shrink: 0; /* Prevent shrinking */
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 
      0 12px 40px rgba(31, 38, 135, 0.47),
      inset 0 0 25px rgba(102, 126, 234, 0.4),
      0 0 40px rgba(102, 126, 234, 0.6);
  }
  
  &:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  ${props => props.$highlighted && `
    border-color: rgba(102, 126, 234, 0.8);
    box-shadow: 
      0 12px 40px rgba(31, 38, 135, 0.5),
      inset 0 0 30px rgba(102, 126, 234, 0.3),
      0 0 60px rgba(102, 126, 234, 0.6);
  `}
  
  @media (max-width: 1200px) {
    width: 90px;
    height: 300px;
  }
  
  @media (max-width: 1024px) {
    width: 85px;
    height: 280px;
  }
  
  @media (max-width: 768px) {
    width: 80px; /* Back to original size */
    height: 250px; /* Back to original size */
    flex-shrink: 0;
    margin: 0; /* Remove individual margins since container handles spacing */
    /* Remove scroll snap since no scrolling */
    /* Disable animations on mobile */
    animation: none !important;
  }
  
  @media (max-width: 480px) {
    width: 70px; /* Back to original size */
    height: 220px; /* Back to original size */
    margin: 0; /* Remove individual margins since container handles spacing */
    /* Remove scroll snap since no scrolling */
  }
  
  @media (max-width: 1024px) {
    margin: 0.125rem; /* Keep small margins for tablets */
  }
`;

const ColumnContent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
`;

const API_BASE_URL = 'https://polymersolutions.onrender.com';

function HeroSection() {
  return (
    <StyleSheetManager shouldForwardProp={prop => prop !== 'isLoaded'}>
      <HeroSectionContent />
    </StyleSheetManager>
  );
}

function HeroSectionContent() {
  const { theme } = useTheme();
  // State for dynamic jar data
  const [jars, setJars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Hover state for jar interaction
  const [hoveredJarId, setHoveredJarId] = useState(null);

  // Navigation state for horizontal scrolling (no longer needed)
  // const [visibleStartIndex, setVisibleStartIndex] = useState(0);

  // Performance: Initialize jar refs for floating animation
  const jarRefs = useRef([]);
  
  // Floating animation variants with independent timing
  const getFloatingVariants = (index) => ({
    desktop: {
      y: [0, -8, 0, 6, -4, 2, -10, 4],
      x: [0, 2, -1, 3, -2, 1, -3],
      transition: {
        duration: 12 + (index * 2), // Different duration for each jar
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.5 // Different start delay for each jar
      }
    },
    tablet: {
      y: [0, -3, 0, 2, -1, 1, -2],
      x: [0, 1, -0.5, 1.5, -1, 0.5, -1.5],
      transition: {
        duration: 12 + (index * 2),
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.5
      }
    },
    mobile: {
      y: [0, -2, 0, 1, -0.5, 0.5, -1], // Subtle floating for mobile
      x: [0, 0.5, -0.25, 0.75, -0.5, 0.25, -0.75], // Subtle horizontal movement
      transition: {
        duration: 12 + (index * 2),
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.5
      }
    },
    reduced: {
      y: 0,
      x: 0
    },
    hover: {
      y: -2,
      scale: 1.03,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  });
  
  // Get main title from titles array
  const getMainTitle = (titles) => {
    if (!titles || titles.length === 0) return 'Untitled';
    const mainTitle = titles.find(t => t.title_type === 'main');
    return mainTitle ? mainTitle.title : titles[0].title;
  };

  // Get subtitle for display
  const getSubtitle = (titles) => {
    if (!titles || titles.length === 0) return null;
    const subtitle = titles.find(t => t.title_type === 'subtitle');
    return subtitle ? subtitle.title : null;
  };

  // Render multiple titles for a jar
  const renderTitles = (titles) => {
    if (!titles || titles.length === 0) return null;
    
    const sortedTitles = titles.sort((a, b) => a.display_order - b.display_order);
    
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: sortedTitles.length === 1 ? 'center' : 'space-between',
        pointerEvents: 'none',
        zIndex: 2
      }}>
        {sortedTitles.map((title, index) => {
          let position = {};
          
          if (sortedTitles.length === 1) {
            // Single title - center it (container handles centering)
            position = {};
          } else if (sortedTitles.length === 2) {
            // Two titles - first on top, second on bottom (both centered horizontally)
            position = index === 0 
              ? { marginTop: '2rem' }
              : { marginBottom: '2rem' };
          } else if (sortedTitles.length === 3) {
            // Three titles - first on top, second in middle, third on bottom (all centered horizontally)
            position = index === 0 
              ? { marginTop: '2rem' }
              : index === 1 
              ? {}
              : { marginBottom: '2rem' };
          } else {
            // More than 3 titles - distribute evenly with smaller margins
            const totalTitles = sortedTitles.length;
            if (index === 0) {
              // First title - position at top
              position = { marginTop: '1.5rem' };
            } else if (index === totalTitles - 1) {
              // Last title - position at bottom
              position = { marginBottom: '1.5rem' };
            } else {
              // Middle titles - distribute evenly
              position = {};
            }
          }
          
          return (
            <div 
              key={title.id} 
              style={{
                fontWeight: title.title_type === 'main' ? '800' : '600',
                fontSize: (() => {
                  const titleLength = title.title?.toString().length || 0;
                  if (titleLength > 15) {
                    return title.title_type === 'main' ? '0.5rem' : '0.4rem';
                  } else if (titleLength > 10) {
                    return title.title_type === 'main' ? '0.55rem' : '0.45rem';
                  } else {
                    return title.title_type === 'main' ? '0.7rem' : '0.6rem';
                  }
                })(),
                color: (() => {
                  switch(title.title_type) {
                    case 'main': return '#ffffff';
                    case 'subtitle': return '#f0f0f0';
                    case 'description': return '#e0e0e0';
                    default: return '#ffffff';
                  }
                })(),
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5), 0 0 12px rgba(102, 126, 234, 0.3)',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '6px',
                padding: '1px 4px',
                margin: '1px',
                lineHeight: 1.1,
                letterSpacing: '0.2px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '85%',
                boxSizing: 'border-box',
                ...position
              }}
            >
              {title.title}
            </div>
          );
        })}
      </div>
    );
  };
  useEffect(() => {
    const fetchJars = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/v1/jars/active`);
        const fetchedJars = response.data.data;
        setJars(fetchedJars);
        setError(null);
      } catch (err) {
        console.error('Error fetching jars:', err);
        setError('Failed to load jars. Please try again later.');
        // Fallback to empty array to prevent crashes
        setJars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJars();
  }, []);

  // Remove jar effects initialization - using Framer Motion instead
  useEffect(() => {
    // No jar effects needed - using Framer Motion floating animation
  }, []);

  // Auto-pagination effect (no longer needed - all jars displayed)
  // useEffect(() => {
  //   // Only auto-paginate if there are more than 6 jars
  //   if (jars.length <= 6) return;
  //
  //   const interval = setInterval(() => {
  //     setVisibleStartIndex(prev => {
  //       const newIndex = prev + 6;
  //       // If we reach the end, go back to start
  //       if (newIndex >= jars.length) {
  //         return 0;
  //       }
  //       return newIndex;
  //     });
  //   }, 7000); // Change page every 7 seconds
  //
  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, [jars.length]);

  // Handle jar hover - only set hover state
  const handleJarHover = useCallback((jar) => {
    setHoveredJarId(jar.id);
  }, []);

  // Handle jar leave - clear hover state
  const handleJarLeave = useCallback(() => {
    setHoveredJarId(null);
  }, []);

  // Handle jar tap for mobile
  const handleJarTap = useCallback((jar) => {
    if (isMobile()) {
      setHoveredJarId(prev => prev === jar.id ? null : jar.id);
    }
  }, []);

  // Handle keyboard focus
  const handleJarFocus = useCallback((jar) => {
    setHoveredJarId(jar.id);
  }, []);

  // Handle keyboard blur
  const handleJarBlur = useCallback(() => {
    setHoveredJarId(null);
  }, []);

  // Navigation functions (no longer needed - all jars displayed)
  // const handleLeftArrow = useCallback(() => {
  //   setVisibleStartIndex(prev => {
  //     const newIndex = prev - 6;
  //     return newIndex < 0 ? 0 : newIndex;
  //   });
  // }, []);
  //
  // const handleRightArrow = useCallback(() => {
  //   setVisibleStartIndex(prev => {
  //     const newIndex = prev + 6;
  //     return newIndex >= jars.length ? jars.length - 6 : newIndex;
  //   });
  // }, [jars.length]);

  // State for responsive jar display
  const [visibleJars, setVisibleJars] = useState([]);
  
  // Update visible jars based on screen size
  useEffect(() => {
    const updateVisibleJars = () => {
      if (typeof window !== 'undefined') {
        // TEMPORARILY DISABLE JAR LIMITING TO DEBUG
        setVisibleJars(jars);
        
        // if (screenWidth <= 480) {
        //   // Show only 3 jars at a time on very small mobile
        //   console.log('Showing 3 jars for very small mobile'); // Debug log
        //   setVisibleJars(jars.slice(0, 3));
        // } else if (screenWidth <= 768) {
        //   // Show only 4 jars at a time on mobile
        //   console.log('Showing 4 jars for mobile'); // Debug log
        //   setVisibleJars(jars.slice(0, 4));
        // } else {
        //   // Show all jars on desktop
        //   console.log('Showing all jars for desktop, count:', jars.length); // Debug log
        //   setVisibleJars(jars);
        // }
      } else {
        // Fallback for SSR or window not available
        setVisibleJars(jars);
      }
    };
    
    updateVisibleJars();
    
    // Add resize listener
    const handleResize = () => {
      updateVisibleJars();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [jars]);

  // Display limited jars for mobile, all jars for desktop
  const getAllJars = () => {
    return visibleJars.length > 0 ? visibleJars : jars;
  };

  return (
    <HeroContainer>
      <Header>
        <Title
          theme={theme}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Chem-PetChem Education Portal
        </Title>
        {/* <Subtitle
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          Explore the molecular world through interactive learning and cutting-edge research
        </Subtitle> */}
      </Header>

      {/* Loading State */}
      {loading && (
        <LoadingContainer>
          <LoadingJarsContainer>
            <LoadingJar
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <LoadingJar
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <LoadingJar
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </LoadingJarsContainer>
          <LoadingText
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Loading amazing content...
          </LoadingText>
        </LoadingContainer>
      )}

      {/* Error State */}
      {error && (
        <LoadingContainer>
          <LoadingText
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: '#ff6b6b' }}
          >
            Unable to load content. Please refresh the page.
          </LoadingText>
        </LoadingContainer>
      )}

      {/* Jars Content - Only show when not loading and no error */}
      {!loading && !error && (
      <ColumnsContainer>
        {/* All Jars - Display all available jars */}
        {getAllJars().map((jar, index) => {
          const actualIndex = index;
          const isHovered = hoveredJarId === jar.id;
          const mainTitle = getMainTitle(jar.titles);
          const subtitle = getSubtitle(jar.titles);
          
          return (
            <PolymerColumn
              key={jar.id}
              $isPrimary={actualIndex === 0}
              $highlighted={isHovered}
              data-polymer-column="true"
              ref={el => {
                if (el) {
                  jarRefs.current[actualIndex] = el;
                }
              }}
              variants={getFloatingVariants(actualIndex)}
              animate={
                prefersReducedMotion() ? 'reduced' :
                (typeof window !== 'undefined' && window.innerWidth <= 768) ? 'mobile' :
                (typeof window !== 'undefined' && window.innerWidth <= 1024) ? 'tablet' :
                'desktop'
              }
              initial="reduced" // Start with no animation, then animate to appropriate variant
              whileHover="hover"
              onMouseEnter={() => {
                handleJarHover(jar);
              }}
              onMouseLeave={() => {
                handleJarLeave(jar);
              }}
              onTouchEnd={() => {
                handleJarTap(jar);
              }}
              onFocus={() => {
                handleJarFocus(jar);
              }}
              onBlur={() => {
                handleJarBlur(jar);
              }}
              tabIndex={0}
              role="button"
              aria-label={`Jar: ${mainTitle}. ${subtitle ? `Subtitle: ${subtitle}.` : ''} ${isHovered ? 'Expanded' : 'Tap to expand'}`}
              aria-expanded={isHovered}
            >
              <LazyImage 
                src={jar.image_url}
                alt={mainTitle}
                $isLoaded={() => {}} // Use transient prop
              />
              <ColumnContent>
                {renderTitles(jar.titles)}
              </ColumnContent>
              
              {/* Gas-like subheading effects */}
              <GasEffects
                jarId={jar.id}
                subheadings={jar.subheadings || []}
                isActive={true} // Always active for continuous animation
                isMobile={isMobile()}
                prefersReducedMotion={prefersReducedMotion()}
              />
            </PolymerColumn>
          );
        })}
        
        {/* No navigation arrows needed - all jars displayed */}
      </ColumnsContainer>
      )}
    </HeroContainer>
  );
}

export default HeroSection;
