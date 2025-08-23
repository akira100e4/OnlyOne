// src/pages/NotFoundPage/components/Particles.jsx - THREE.JS VERSION
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Particles.css';

const Particles = ({ 
  color = '#D9A5A5', // OnlyOne antique pink
  particleCount = 8000, 
  particleSize = 25,
  animate = true,
  className = '' 
}) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let camera;
    let scene;
    let renderer;
    let material;
    let particles;
    let animationFrameId;
    let mouseX = 0;
    let mouseY = 0;

    const init = () => {
      // Camera setup
      camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        2,
        2000
      );
      camera.position.z = 1000;

      // Scene setup
      scene = new THREE.Scene();
      // Fog color matching light-cream background
      scene.fog = new THREE.FogExp2(0xFAF7F3, 0.0008);

      // Geometry - create particles in 3D space
      const geometry = new THREE.BufferGeometry();
      const vertices = [];

      for (let i = 0; i < particleCount; i++) {
        vertices.push(
          2000 * Math.random() - 1000, // x
          2000 * Math.random() - 1000, // y
          2000 * Math.random() - 1000  // z
        );
      }

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
      );

      // Create golden disc texture programmatically
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      // Draw golden disc with gradient
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(217, 165, 165, 1)');
      gradient.addColorStop(0.3, 'rgba(217, 165, 165, 0.8)');
      gradient.addColorStop(0.7, 'rgba(217, 165, 165, 0.3)');
      gradient.addColorStop(1, 'rgba(217, 165, 165, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);

      // Material setup
      material = new THREE.PointsMaterial({
        size: particleSize,
        sizeAttenuation: true,
        map: texture,
        alphaTest: 0.5,
        transparent: true,
        blending: THREE.AdditiveBlending, // Golden glow effect
        depthWrite: false
      });

      // Set golden color
      material.color.setStyle(color);

      // Create particle system
      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      // Renderer setup
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0); // Transparent background
      
      container.appendChild(renderer.domElement);

      return renderer;
    };

    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handlePointerMove = (event) => {
      mouseX = event.clientX - window.innerWidth / 2;
      mouseY = event.clientY - window.innerHeight / 2;
    };

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        mouseX = event.touches[0].clientX - window.innerWidth / 2;
        mouseY = event.touches[0].clientY - window.innerHeight / 2;
      }
    };

    const animateScene = () => {
      if (!camera || !scene || !renderer || !material) return;

      // Optional color animation (disabled for OnlyOne golden theme)
      if (animate && false) { // Set to true if you want color cycling
        const time = Date.now() * 0.00005;
        const h = ((360 * (1.0 + time)) % 360) / 360;
        material.color.setHSL(h, 0.5, 0.5);
      }

      // Smooth camera movement following mouse
      camera.position.x += (mouseX - camera.position.x) * 0.03; // Slower for elegance
      camera.position.y += (-mouseY - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      // Subtle particle rotation
      if (particles && animate) {
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animateScene);
    };

    // Initialize
    try {
      const rendererInstance = init();
      
      // Event listeners
      window.addEventListener('resize', handleResize);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      
      // Start animation
      animateScene();
    } catch (error) {
      console.error('Three.js initialization failed:', error);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
      
      if (material) {
        if (material.map) material.map.dispose();
        material.dispose();
      }
      
      if (particles && particles.geometry) {
        particles.geometry.dispose();
      }
    };
  }, [color, particleCount, particleSize, animate]);

  return (
    <div
      ref={mountRef}
      className={`particles-threejs ${className}`}
    />
  );
};

export default Particles;