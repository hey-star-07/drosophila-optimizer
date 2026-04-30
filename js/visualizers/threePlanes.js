import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ThreePlanesVisualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentContainer = null;
        this.planes = [];
    }
    
    actualizarPlanos(container, A, b) {
        if (!container || A.length !== 3) return;
        
        // Limpiar contenedor
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Configurar escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f4f8);
        this.scene.fog = new THREE.FogExp2(0xf0f4f8, 0.02);
        
        // Configurar cámara
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(3, 2.5, 4);
        this.camera.lookAt(0, 0, 0);
        
        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
        
        // Controles de órbita (como Geogebra)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 1.5;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.target.set(0, 0, 0);
        
        this.currentContainer = container;
        
        // Agregar elementos
        this.agregarEjes();
        this.agregarPlanos(A, b);
        this.agregarGrilla();
        this.agregarIluminacion();
        
        // Manejar redimensionamiento
        const handleResize = () => {
            if (this.currentContainer === container && container.isConnected) {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                this.camera.aspect = newWidth / newHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(newWidth, newHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        
        this.animar();
    }
    
    agregarEjes() {
        // Ejes con colores más vivos
        const axesHelper = new THREE.AxesHelper(2.5);
        this.scene.add(axesHelper);
        
        // Flechas para los ejes
        const arrowColor = 0x2d3e50;
        const arrowLength = 0.2;
        const arrowRadius = 0.03;
        
        const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(2.3, 0, 0), arrowLength, arrowColor, 0.3, 0.1);
        const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 2.3, 0), arrowLength, arrowColor, 0.3, 0.1);
        const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 2.3), arrowLength, arrowColor, 0.3, 0.1);
        
        this.scene.add(arrowX);
        this.scene.add(arrowY);
        this.scene.add(arrowZ);
        
        // Origen
        const originGeometry = new THREE.SphereGeometry(0.08);
        const originMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3e50, emissive: 0x111111 });
        const origin = new THREE.Mesh(originGeometry, originMaterial);
        this.scene.add(origin);
    }
    
    agregarPlanos(A, b) {
        // Eliminar planos anteriores
        this.planes.forEach(plane => {
            this.scene.remove(plane);
        });
        this.planes = [];
        
        const colors = [0xe8a87c, 0x7abfd9, 0x7ad97a];
        const opacities = [0.55, 0.55, 0.55];
        const edgeColors = [0xc17a50, 0x4a8faf, 0x4aaf4a];
        
        for (let i = 0; i < 3; i++) {
            const a = A[i][0];
            const bb = A[i][1];
            const c = A[i][2];
            const d = b[i];
            
            const norm = Math.sqrt(a * a + bb * bb + c * c);
            const an = a / norm;
            const bn = bb / norm;
            const cn = c / norm;
            const dn = d / norm;
            
            // Crear plano más grande
            const size = 2.8;
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshPhongMaterial({
                color: colors[i],
                side: THREE.DoubleSide,
                transparent: true,
                opacity: opacities[i],
                emissive: 0x000000,
                specular: 0x444444,
                shininess: 40
            });
            const plane = new THREE.Mesh(geometry, material);
            
            const normal = new THREE.Vector3(an, bn, cn).normalize();
            const constant = dn;
            
            plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
            
            const center = normal.clone().multiplyScalar(constant);
            plane.position.copy(center);
            
            this.scene.add(plane);
            this.planes.push(plane);
            
            // Agregar borde al plano
            const edgesGeo = new THREE.EdgesGeometry(geometry);
            const edgesMat = new THREE.LineBasicMaterial({ color: edgeColors[i], linewidth: 2 });
            const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
            plane.add(wireframe);
        }
        
        // Punto de intersección (solución)
        const sol = this.resolverSistema3x3(A, b);
        if (sol) {
            const pointGeometry = new THREE.SphereGeometry(0.1);
            const pointMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x442200, metalness: 0.3, roughness: 0.2 });
            const point = new THREE.Mesh(pointGeometry, pointMaterial);
            point.position.set(sol[0], sol[1], sol[2]);
            this.scene.add(point);
            
            // Agregar líneas desde el punto a los ejes
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff8844 });
            
            const lineToX = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sol[0], sol[1], sol[2]), new THREE.Vector3(sol[0], 0, 0)]),
                lineMaterial
            );
            const lineToY = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sol[0], sol[1], sol[2]), new THREE.Vector3(0, sol[1], 0)]),
                lineMaterial
            );
            const lineToZ = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sol[0], sol[1], sol[2]), new THREE.Vector3(0, 0, sol[2])]),
                lineMaterial
            );
            
            this.scene.add(lineToX);
            this.scene.add(lineToY);
            this.scene.add(lineToZ);
        }
    }
    
    agregarGrilla() {
        const gridHelper = new THREE.GridHelper(6, 25, 0x888888, 0xcccccc);
        gridHelper.position.y = -0.01;
        this.scene.add(gridHelper);
        
        // Plano de suelo semitransparente
        const groundPlaneGeo = new THREE.PlaneGeometry(5.5, 5.5);
        const groundPlaneMat = new THREE.MeshPhongMaterial({ color: 0xe8f4f0, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
        const groundPlane = new THREE.Mesh(groundPlaneGeo, groundPlaneMat);
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = -0.02;
        this.scene.add(groundPlane);
    }
    
    agregarIluminacion() {
        const ambientLight = new THREE.AmbientLight(0x606080, 0.6);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(2, 3, 2);
        mainLight.castShadow = true;
        mainLight.receiveShadow = false;
        this.scene.add(mainLight);
        
        const fillLight = new THREE.DirectionalLight(0xccaa88, 0.5);
        fillLight.position.set(-1, 1, -1);
        this.scene.add(fillLight);
        
        const backLight = new THREE.PointLight(0x88aaff, 0.3);
        backLight.position.set(-1, 1, -2);
        this.scene.add(backLight);
        
        const rimLight = new THREE.PointLight(0xffaa88, 0.4);
        rimLight.position.set(1, 1.5, -1.5);
        this.scene.add(rimLight);
    }
    
    resolverSistema3x3(A, b) {
        const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
                   A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
                   A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
        
        if (Math.abs(det) < 1e-8) return null;
        
        const x = (b[0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
                   A[0][1] * (b[1] * A[2][2] - A[1][2] * b[2]) +
                   A[0][2] * (b[1] * A[2][1] - A[1][1] * b[2])) / det;
        
        const y = (A[0][0] * (b[1] * A[2][2] - A[1][2] * b[2]) -
                   b[0] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
                   A[0][2] * (A[1][0] * b[2] - b[1] * A[2][0])) / det;
        
        const z = (A[0][0] * (A[1][1] * b[2] - b[1] * A[2][1]) -
                   A[0][1] * (A[1][0] * b[2] - b[1] * A[2][0]) +
                   b[0] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])) / det;
        
        return [x, y, z];
    }
    
    animar() {
        const animate = () => {
            if (this.renderer && this.scene && this.currentContainer && this.currentContainer.isConnected) {
                if (this.controls) this.controls.update();
                this.renderer.render(this.scene, this.camera);
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
}