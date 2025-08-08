import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";

interface Character3DProps {
  modelPath: string;
  className?: string;
}

const Character3D: React.FC<Character3DProps> = ({ modelPath, className }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    const container = mountRef.current;
    const size = Math.min(container.clientWidth, container.clientHeight);
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting - brighter setup to ensure visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-2, 1, -1);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xfe7cff, 0.2);
    directionalLight3.position.set(0, -1, 1);
    scene.add(directionalLight3);

    // Load GLTF model
    const loader = new GLTFLoader();
    let model: THREE.Object3D;
    let mixer: THREE.AnimationMixer;

    console.log("Attempting to load model from:", modelPath);

    loader.load(
      modelPath,
      (gltf: GLTF) => {
        model = gltf.scene;
        scene.add(model);

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the model
        model.position.sub(center);

        // Scale the model to fit nicely in the viewport
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim; // Smaller scale factor for better fit
        model.scale.setScalar(scale);

        // Position the model slightly lower if it's a standing character
        model.position.y = -0.2;

        // Set up animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        // Position camera closer and at a better angle
        camera.position.set(0, 0.5, 2.5);
        camera.lookAt(0, 0, 0);

        console.log("Model loaded successfully:", {
          originalSize: size,
          scaleFactor: scale,
          finalPosition: model.position,
        });

        setLoading(false);
      },
      (progress: ProgressEvent<EventTarget>) => {
        console.log(
          "Loading progress:",
          (progress.loaded / progress.total) * 100 + "%"
        );
      },
      (error: unknown) => {
        console.error("Error loading model:", error);
        setError(
          `Failed to load 3D model from ${modelPath}. Check if the file exists.`
        );
        setLoading(false);

        // Add a simple fallback cube to show something is working
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0xfe7cff });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        model = cube;
      }
    );

    // Mouse controls for rotation
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseUp);

    // Auto-rotation
    let autoRotate = true;
    const autoRotateSpeed = 0.005;

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
      }

      if (model) {
        // Smooth rotation interpolation
        rotationX += (targetRotationX - rotationX) * 0.1;
        rotationY += (targetRotationY - rotationY) * 0.1;

        if (autoRotate && !isMouseDown) {
          targetRotationY += autoRotateSpeed;
        }

        model.rotation.x = rotationX;
        model.rotation.y = rotationY;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const newSize = Math.min(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      renderer.setSize(newSize, newSize);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelPath]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: "256px" }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#fe7cff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-[#fe7cff] text-sm font-poppins">
              Loading 3D Model...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
          <div className="text-center text-red-400 font-poppins">
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-1">Check console for details</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <span className="text-xs text-[#fe7cff] font-poppins bg-black bg-opacity-70 px-2 py-1 rounded">
            Drag to rotate • Auto-rotating
          </span>
        </div>
      )}
    </div>
  );
};

export default Character3D;
