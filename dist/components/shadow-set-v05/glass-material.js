import * as THREE from './vendor/three.module.js';

// Clear, coloured sheet glass: Beer-Lambert absorption, rather than painting
// a pale colour over the background with alpha. Dark objects stay dark behind it;
// overlapping blue and orange sheets multiply their light transmission.
// No additive white reflection or environment-map band is used.
export function createGlassMaterial(tint,thickness=3,edge=false){
  const color=new THREE.Color(tint);
  const absorption=new THREE.Vector3(
    -Math.log(Math.max(color.r,.0001))/thickness,
    -Math.log(Math.max(color.g,.0001))/thickness,
    -Math.log(Math.max(color.b,.0001))/thickness,
  );
  return new THREE.ShaderMaterial({
    name:edge?'Tinted glass — cut edge':'Tinted glass — clear face',
    // Both real caps of the plate are rendered. Each cap contributes half of the
    // optical path, so enabling the back face does not double the face tint.
    uniforms:{absorption:{value:absorption},thickness:{value:thickness},pathMultiplier:{value:edge?.28:.45}},
    side:THREE.DoubleSide,forceSinglePass:true,
    transparent:true,depthWrite:false,blending:THREE.MultiplyBlending,premultipliedAlpha:true,toneMapped:false,
    vertexShader:`
      varying vec3 vGlassNormal;
      varying vec3 vGlassView;
      void main(){
        vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
        vGlassNormal=normalize(normalMatrix*normal);
        vGlassView=-viewPosition.xyz;
        gl_Position=projectionMatrix*viewPosition;
      }
    `,
    fragmentShader:`
      uniform vec3 absorption;
      uniform float thickness;
      uniform float pathMultiplier;
      varying vec3 vGlassNormal;
      varying vec3 vGlassView;
      void main(){
        float facing=max(abs(dot(normalize(vGlassNormal),normalize(vGlassView))),.08);
        float opticalPath=thickness*pathMultiplier/facing;
        vec3 transmittedLight=exp(-absorption*opticalPath);
        // The long path through a grazing cut edge naturally approaches black.
        float grazing=pow(1.0-facing,5.0);
        transmittedLight*=1.0-.18*grazing;
        gl_FragColor=vec4(transmittedLight,1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// A separate reflection layer preserves the transmission of the glass beneath.
// The studio reflections are clamped and tinted after shading, including grazing
// angles, so neither the light cards nor Fresnel rims can turn into white flashes.
export function createGlassReflection(tint,environment){
  const filter=new THREE.Color(tint);
  const material=new THREE.MeshStandardMaterial({
    name:'Colour-filtered studio reflections',color:0xffffff,metalness:1,roughness:.075,
    envMap:environment,envMapIntensity:1,transparent:true,opacity:.65,
    blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,toneMapped:false,
  });
  material.onBeforeCompile=shader=>{
    shader.uniforms.reflectionTint={value:filter};
    shader.fragmentShader='uniform vec3 reflectionTint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight = clamp(outgoingLight, vec3(0.0), vec3(1.0)) * reflectionTint;\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=> 'shadow-coloured-reflection-v05';
  return material;
}

export function createReflectionEnvironment(renderer){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#10151d';ctx.fillRect(0,0,1024,512);
  // Broad studio cards with soft edges and darker gaps, reflected by the real
  // surface normals. The reflection layer filters their neutral light to the glass hue.
  for(let k=0;k<8;k++){
    const x=k*128+18,width=88;
    const glow=ctx.createLinearGradient(x,0,x+width,0);
    glow.addColorStop(0,'#10151d');glow.addColorStop(.20,'#43515e');
    glow.addColorStop(.47,'#b8c1ca');glow.addColorStop(.60,'#8f9ba8');glow.addColorStop(1,'#10151d');
    ctx.fillStyle=glow;ctx.fillRect(x,42+(k%2)*36,width,386-(k%2)*45);
    ctx.fillStyle='#232f3b';ctx.fillRect(x+width+4,90,5,300);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(texture);
  texture.dispose();pmrem.dispose();return target;
}
