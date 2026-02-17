/**
 * Zen Garden Product Showcase
 * 
 * Features:
 * - Dynamic product loading
 * - Organic, floating layout
 * - Gentle "water" physics animations
 * - Pagination for multiple products
 */

// ========================================
// STATE & CONFIG
// ========================================
const CONFIG = {
  itemsPerPage: 3,        // Products per view
  pageDuration: 5000,     // Time per page (ms)
  transitionDuration: 1.5,// Transition speed (s)
  idleAmplitude: 15,      // Floating height (px)
  canvasWidth: 1920,
  canvasHeight: 1080
};

let state = {
  products: [],
  pages: [],
  currentPageIndex: 0,
  isTransitioning: false
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌱 Initializing Zen Garden Template...');
  
  await loadProducts();
  setupScene();
  
  if (state.products.length > 0) {
    createPages();
    renderPaginationIndicators();
    startShowcase();
  } else {
    console.warn('⚠️ No products found in products.json');
    // Optional: Render sample/fallback if empty
  }
});

async function loadProducts() {
  try {
    const response = await fetch('products.json?v=' + Date.now());
    const data = await response.json();
    state.products = data || [];
    console.log(`📦 Loaded ${state.products.length} products`);
  } catch (error) {
    console.error('❌ Failed to load products:', error);
    state.products = []; 
  }
}

function setupScene() {
  // 1. Background slow drift
  gsap.to('#background', {
    scale: 1.15,
    x: -30,
    y: -20,
    duration: 20,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  // 2. Light rays gentle pulse
  gsap.to('#light-rays', {
    opacity: 0.8,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  // 3. Spawn floating leaves
  spawnLeaves(8);
  
  // 4. Start random ripples
  startRippleEffect();
}

// ========================================
// LAYOUT & RENDERING
// ========================================
function createPages() {
  const { products } = state;
  const { itemsPerPage } = CONFIG;
  state.pages = [];
  
  // Split products into chunks/pages
  for (let i = 0; i < products.length; i += itemsPerPage) {
    state.pages.push(products.slice(i, i + itemsPerPage));
  }
}

function renderPaginationIndicators() {
  const container = document.getElementById('pagination-indicators');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Only show if more than 1 page
  if (state.pages.length > 1) {
    state.pages.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = `page-dot ${index === 0 ? 'active' : ''}`;
      dot.id = `dot-${index}`;
      container.appendChild(dot);
    });
  }
}

// Returns organic coordinates based on item count
function getPositions(count) {
  const w = CONFIG.canvasWidth;
  const h = CONFIG.canvasHeight;
  
  const layouts = {
    1: [
      { x: w * 0.5, y: h * 0.5 }
    ],
    2: [
      { x: w * 0.35, y: h * 0.5 },
      { x: w * 0.65, y: h * 0.5 }
    ],
    3: [
      { x: w * 0.20, y: h * 0.55 }, // Left (Widened from 0.25 to 0.20)
      { x: w * 0.5,  y: h * 0.45 }, // Center-High
      { x: w * 0.80, y: h * 0.55 }  // Right (Widened from 0.75 to 0.80)
    ],
    4: [
      { x: w * 0.20, y: h * 0.45 },
      { x: w * 0.40, y: h * 0.60 },
      { x: w * 0.60, y: h * 0.35 },
      { x: w * 0.80, y: h * 0.50 }
    ]
  };
  
  // Fallback
  if (!layouts[count]) {
    return Array(count).fill(0).map((_, i) => ({
      x: w * (0.2 + (i * 0.6 / (count - 1))),
      y: h * 0.5 + (i % 2 === 0 ? -40 : 40)
    }));
  }
  
  return layouts[count];
}

function createProductElement(product) {
  const el = document.createElement('div');
  el.className = `product ${product.layout_type || ''}`;
  
  // Handle badges/meta
  const badgeHtml = product.badge 
    ? `<div class="product-badge">${product.badge}</div>` 
    : '';

  // Handle images
  let imgHtml = '';
  if (Array.isArray(product.images) && product.images.length > 0) {
      imgHtml = `<img src="${product.images[0]}" class="product-image" alt="${product.name}">`;
  } else if (typeof product.images === 'string') {
      imgHtml = `<img src="${product.images}" class="product-image" alt="${product.name}">`;
  }
  
  el.innerHTML = `
    ${badgeHtml}
    <div class="product-image-container">
      ${imgHtml}
    </div>
    <div class="product-details">
      <div class="product-offer">${product.offer_qty || ''}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-price">${product.price}</div>
    </div>
  `;
  
  return el;
}

// ========================================
// ANIMATION SEQUENCER
// ========================================
function startShowcase() {
  animatePage(0);
}

function animatePage(pageIndex) {
  state.isTransitioning = true;
  state.currentPageIndex = pageIndex;
  
  // Update indicators
  document.querySelectorAll('.page-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === pageIndex);
  });
  
  const pageProducts = state.pages[pageIndex];
  const container = document.getElementById('products-container');
  const positions = getPositions(pageProducts.length);
  
  container.innerHTML = ''; 
  
  // Create elements
  const elements = [];
  pageProducts.forEach((product, i) => {
    const el = createProductElement(product);
    const pos = positions[i];
    
    // Set initial position centered
    gsap.set(el, {
      left: pos.x,
      top: pos.y,
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      y: 100, // Start below
      scale: 0.9,
      position: 'absolute'
    });
    
    container.appendChild(el);
    elements.push(el);
  });
  
  // --- ENTRANCE ANIMATION ---
  const tl = gsap.timeline({
    onComplete: () => {
      startIdleAnimation(elements);
      
      // Schedule Exit if multiple pages, else loop idle
      if (state.pages.length > 1) {
        gsap.delayedCall(CONFIG.pageDuration / 1000, () => {
          animateExit(elements);
        });
      } else {
        // If single page, no exit, just keep idle
        console.log('Single page detected - keeping idle loop');
      }
    }
  });
  
  // Staggered float up
  tl.to(elements, {
    duration: 1.5,
    y: 0,
    opacity: 1,
    scale: 1,
    stagger: 0.2,
    ease: 'power3.out'
  });
}

function startIdleAnimation(elements) {
  elements.forEach((el, i) => {
    // Randomize idle
    const delay = i * 0.2;
    const dur = 3 + Math.random();
    
    // Float Y
    gsap.to(el, {
      y: `-=${CONFIG.idleAmplitude}`,
      duration: dur,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: delay
    });
    
    // Subtle rotation
    gsap.to(el, {
      rotation: Math.random() * 2 - 1, 
      duration: dur * 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: delay
    });
  });
}

function animateExit(elements) {
  const tl = gsap.timeline({
    onComplete: () => {
      const nextIndex = (state.currentPageIndex + 1) % state.pages.length;
      animatePage(nextIndex);
    }
  });
  
  // Float UP and fade out
  tl.to(elements, {
    duration: 1.0,
    y: -80,
    opacity: 0,
    scale: 0.95,
    stagger: 0.1,
    ease: 'power2.in'
  });
}

// ========================================
// VISUAL EFFECTS
// ========================================

function spawnLeaves(count) {
  const container = document.getElementById('foreground-layer');
  if (!container) return;

  // Define Gradient once
  const svgDefs = `
    <svg width="0" height="0" style="position:absolute">
      <defs>
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8A9A5B"/>
          <stop offset="100%" stop-color="#556b4c"/>
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="0" dy="5" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
    </svg>
  `;
  
  // Check if defs already exist
  if (!document.getElementById('leaf-defs')) {
      const defsContainer = document.createElement('div');
      defsContainer.id = 'leaf-defs';
      defsContainer.innerHTML = svgDefs;
      document.body.appendChild(defsContainer);
  }

  const leafPath = "M 100,180 Q 80,100 20,50 Q 80,60 100,20 Q 120,60 180,50 Q 120,100 100,180 Z";

  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'leaf';
    
    // Using inline SVG to reference gradient
    div.innerHTML = `
      <svg width="100" height="100" viewBox="0 0 200 200" style="overflow:visible">
        <path d="${leafPath}" fill="url(#leafGradient)" filter="url(#dropShadow)" opacity="0.9" />
        <path d="M 100,20 L 100,180" stroke="#3a4d32" stroke-width="2" opacity="0.4" />
      </svg>
    `;
    
    container.appendChild(div);
    
    // Logic: Spawning from left or right side off-screen
    const startLeft = Math.random() > 0.5;
    const startX = startLeft ? -150 : CONFIG.canvasWidth + 150;
    const endX = startLeft ? CONFIG.canvasWidth + 150 : -150;
    const yPos = Math.random() * CONFIG.canvasHeight;
    const travelDuration = 25 + Math.random() * 15; // Slow drift

    gsap.set(div, {
      x: startX,
      y: yPos,
      rotation: Math.random() * 360,
      scale: 0.4 + Math.random() * 0.4,
      position: 'absolute'
    });
    
    // Main Travel Animation
    gsap.to(div, {
      x: endX,
      duration: travelDuration,
      ease: 'none',
      repeat: -1,
      delay: Math.random() * -20 // Start mid-path
    });
    
    // Secondary Sway
    gsap.to(div, {
      y: `+=${50 + Math.random() * 50}`,
      rotation: `+=${90 + Math.random() * 90}`,
      duration: 4 + Math.random() * 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
}

function startRippleEffect() {
  const container = document.getElementById('ripples-container');
  if (!container) return;
  
  setInterval(() => {
    if (container.children.length > 6) return;
    
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    
    // Random position
    const x = Math.random() * CONFIG.canvasWidth;
    const y = Math.random() * CONFIG.canvasHeight;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    container.appendChild(ripple);
    
    const tl = gsap.timeline({
      onComplete: () => ripple.remove()
    });
    
    tl.to(ripple, {
      scale: 4,
      opacity: 0.15,
      duration: 3,
      ease: 'power1.out'
    })
    .to(ripple, {
      opacity: 0,
      duration: 1.5,
      ease: 'power1.out'
    }, "-=1.5");
    
  }, 2500); 
}
