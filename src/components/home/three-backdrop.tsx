"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient Three.js scene behind the hero: a slowly rotating wireframe
 * polyhedron inside a drifting point cloud. Lazy-loads three, pauses when
 * off-screen or hidden, and renders a single static frame for reduced motion.
 */
export function ThreeBackdrop({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // WebGL unavailable — the CSS gradient behind still looks fine.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      container.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 9);

      const violet = new THREE.Color("#8b6cff");
      const cyan = new THREE.Color("#4fd6f0");

      const shape = new THREE.Group();
      const icoGeo = new THREE.IcosahedronGeometry(2.4, 1);
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(icoGeo),
        new THREE.LineBasicMaterial({ color: violet, transparent: true, opacity: 0.55 }),
      );
      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.2, 0),
        new THREE.MeshBasicMaterial({ color: cyan, wireframe: true, transparent: true, opacity: 0.8 }),
      );
      const verts = new THREE.Points(icoGeo, new THREE.PointsMaterial({ color: cyan, size: 0.08, transparent: true, opacity: 0.9 }));
      shape.add(wire, inner, verts);
      scene.add(shape);

      const count = 900;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const tmp = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const r = 5 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions.set([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi) - 4], i * 3);
        tmp.lerpColors(violet, cyan, Math.random());
        colors.set([tmp.r, tmp.g, tmp.b], i * 3);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false }),
      );
      scene.add(stars);

      const pointer = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = container;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Keep the shape to the right on wide screens, centred on mobile.
        shape.position.x = w > 900 ? 3.2 : 0;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(container);
      resize();

      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      });
      io.observe(container);

      const clock = new THREE.Clock();
      const render = () => {
        const t = clock.getElapsedTime();
        shape.rotation.x = t * 0.12 + pointer.y * 0.25;
        shape.rotation.y = t * 0.18 + pointer.x * 0.35;
        inner.rotation.y = -t * 0.5;
        stars.rotation.y = t * 0.015;
        camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
        camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };

      if (reduce) {
        render();
      } else {
        renderer.setAnimationLoop(() => {
          if (visible && !document.hidden) render();
        });
      }

      cleanup = () => {
        renderer.setAnimationLoop(null);
        window.removeEventListener("pointermove", onPointer);
        ro.disconnect();
        io.disconnect();
        scene.traverse((o) => {
          const obj = o as { geometry?: { dispose(): void }; material?: { dispose(): void } };
          obj.geometry?.dispose();
          obj.material?.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
