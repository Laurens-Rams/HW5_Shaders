import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  Color,
  Clock,
  MathUtils,
  IcosahedronGeometry,
  Mesh,
  VideoTexture,
  ShaderMaterial
} from 'three';
import Stats from 'stats.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';

export default class App {
  constructor() {
    this._init();
  }

  _init() {
    // Render
    this._gl = new WebGLRenderer({
      canvas: document.querySelector('#canvas_main'),
    });

    this._gl.setSize(window.innerWidth, window.innerHeight);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;

    this._camera = new PerspectiveCamera(50, aspect, 0.1, 4000);
    this._camera.position.z = 1000;
    this._resize();

    // GUI
    this._gui = new dat.GUI();
    this._settings = {
      mainDisplacement: 290.0,
      noiseDisplacement: 3.0
    };

    // track if GUI is interacted with
    this._userChangedMainDisplacement = false;

    const mainDisplacementController = this._gui.add(this._settings, 'mainDisplacement', 30.0, 1000.0).name('Main Displacement Intensity');
    mainDisplacementController.onChange(() => {
      this._userChangedMainDisplacement = true;
    });

    const noiseDisplacementController = this._gui.add(this._settings, 'noiseDisplacement', 0.0, 290.0).name('Noise Displacement Intensity');
    noiseDisplacementController.onChange(() => {
      this._userChangedMainDisplacement = true;
    });

    // Scene
    this._scene = new Scene();
    this._scene.background = new Color(0x16201f);

    // Stats
    this._stats = new Stats();
    document.body.appendChild(this._stats.dom);

    // Clock for delta
    this._clock = new Clock();

    // Add controls
    const controls = new OrbitControls(this._camera, this._gl.domElement);

    // Scene
    this._initScene();

    // Animation
    this._animate();

    this._initEvents();
  }

  _initScene() {
    // Add sphere with webcam texture
    this._addSphereWithWebcamTexture();
  }

  async _addSphereWithWebcamTexture() {
    const video = document.createElement('video');
    video.id = 'video';
    video.style.display = 'none';
    video.autoplay = true;
    video.playsInline = true;
    document.body.appendChild(video);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const constraints = { video: { width: 1920, height: 1080, facingMode: 'user' } };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve();
          };
        });
      } catch (error) {
        console.error('Unable to access the camera/webcam.', error);
        return;
      }
    } else {
      console.error('MediaDevices interface not available.');
      return;
    }

    const texture = new VideoTexture(video);
    const geometry = new IcosahedronGeometry(130, 200);

    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0.0 },
        uMainDisplacement: { value: 0.0 }, // Start from 0
        uNoiseDisplacement: { value: this._settings.noiseDisplacement }
      }
    });

    const mesh = new Mesh(geometry, material);
    mesh.rotateY(Math.PI / 2);
    this._scene.add(mesh);

    this._mesh = mesh;
  }

  onDrag(state) {
    if (this._tiles) {
      this._tiles.onDrag(state);
    }
  }

  _initEvents() {
    window.addEventListener('resize', this._resize.bind(this));
  }

  _resize() {
    this._gl.setSize(window.innerWidth, window.innerHeight);

    // CHANGE FOV
    let fov = Math.atan(window.innerHeight / 2 / this._camera.position.z) * 2;
    fov = MathUtils.radToDeg(fov);
    this._camera.fov = fov;

    const aspect = window.innerWidth / window.innerHeight;
    this._camera.aspect = aspect;
    this._camera.updateProjectionMatrix();
  }

  _animate() {
    this._stats.begin();

    const delta = this._clock.getDelta();

    if (this._mesh) {
      if (this._mesh.material.uniforms.uTime) {
        this._mesh.material.uniforms.uTime.value += delta;
      }

      if (!this._userChangedMainDisplacement) {
        const targetMainDisplacement = this._settings.mainDisplacement;
        const increment = 30.0 * delta;

        if (this._mesh.material.uniforms.uMainDisplacement.value < targetMainDisplacement) {
          this._mesh.material.uniforms.uMainDisplacement.value = Math.min(this._mesh.material.uniforms.uMainDisplacement.value + increment, targetMainDisplacement);
        } else {
          this._mesh.material.uniforms.uMainDisplacement.value = targetMainDisplacement;
        }
      } else {
        this._mesh.material.uniforms.uMainDisplacement.value = this._settings.mainDisplacement;
      }

      if (this._mesh.material.uniforms.uNoiseDisplacement) {
        this._mesh.material.uniforms.uNoiseDisplacement.value = this._settings.noiseDisplacement;
      }

      this._mesh.rotation.y += delta * 0.1; 
    }

    this._gl.render(this._scene, this._camera);
    this._stats.end();
    window.requestAnimationFrame(this._animate.bind(this));
  }
}