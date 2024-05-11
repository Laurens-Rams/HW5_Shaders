import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  Color,
  Clock,
  MathUtils
} from 'three';
import Stats from 'stats.js';
import Tiles from './Sliders';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

    this._camera = new PerspectiveCamera(50, aspect, 100, 4000);
    this._camera.position.z = 1000;
    this._resize();

    // Scene
    this._scene = new Scene();
    this._scene.background = new Color(0x16201f);

    // Tiles
    this._initScene();

    // Stats
    this._stats = new Stats();
    document.body.appendChild(this._stats.dom);

    // Clock for delta
    this._clock = new Clock();

    // Animation
    this._animate();

    this._initEvents();

    // const controls = new OrbitControls(this._camera, this._gl.domElement);
  }

  _initScene() {
    const tiles = new Tiles(this._camera);
    this._tiles = tiles;
    this._scene.add(tiles);
  }

  onDrag(state) {
    this._tiles.onDrag(state);
  }

  _initEvents() {
    window.addEventListener('resize', this._resize.bind(this));
  }

  _resize() {
    this._gl.setSize(window.innerWidth, window.innerHeight);
      // // CHANGE FOV
    let fov = Math.atan(window.innerHeight / 2 / this._camera.position.z) * 2;
    fov = MathUtils.radToDeg(fov);
    this._camera.fov = fov;
    console.log(fov)

    const aspect = window.innerWidth / window.innerHeight;
    this._camera.aspect = aspect;
    this._camera.updateProjectionMatrix();
  }

  _animate() {
    this._stats.begin();

    const delta = this._clock.getDelta();
    this._tiles.update(delta);

    this._gl.render(this._scene, this._camera);
    this._stats.end();
    window.requestAnimationFrame(this._animate.bind(this));
  }
}
