import Phaser from 'phaser';

/**
 * OutlinePipeline - WebGL pipeline for rendering sprites with colored outlines
 * Used for faction identification on sprites
 */
export class OutlinePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
    /**
     * Create a new OutlinePipeline instance
     * @param {Phaser.Game} game - The game instance
     */
    constructor(game) {
        const fragmentShader = `
        precision mediump float;
        
        uniform sampler2D uMainSampler;
        uniform vec2 uTextureSize;
        uniform float uThickness;
        uniform vec3 uOutlineColor;
        
        varying vec2 outTexCoord;
        
        void main(void) {
            vec4 texel = texture2D(uMainSampler, outTexCoord);
            vec4 color = texel;
            
            if (texel.a <= 0.01) {
                // Get surrounding pixels
                float pixelX = 1.0 / uTextureSize.x;
                float pixelY = 1.0 / uTextureSize.y;
                bool hasNeighbor = false;
                
                // Check in a square around the current pixel for non-transparent neighbors
                for (float dx = -uThickness; dx <= uThickness; dx += 1.0) {
                    for (float dy = -uThickness; dy <= uThickness; dy += 1.0) {
                        // Skip the center pixel (that's us)
                        if (dx == 0.0 && dy == 0.0) continue;
                        
                        vec2 neighborCoord = outTexCoord + vec2(dx * pixelX, dy * pixelY);
                        vec4 neighbor = texture2D(uMainSampler, neighborCoord);
                        
                        if (neighbor.a > 0.01) {
                            hasNeighbor = true;
                            break;
                        }
                    }
                    if (hasNeighbor) break;
                }
                
                // If we have a non-transparent neighbor, draw the outline
                if (hasNeighbor) {
                    color = vec4(uOutlineColor, 1.0);
                }
            }
            
            gl_FragColor = color;
        }
        `;

        super({
            game,
            fragShader: fragmentShader,
            name: 'OutlinePipeline',
            uniforms: [
                'uMainSampler',
                'uTextureSize',
                'uThickness',
                'uOutlineColor'
            ]
        });

        // Default uniform values
        this.set2f('uTextureSize', 512, 512);
        this.set1f('uThickness', 2.0);
        this.set3f('uOutlineColor', 1.0, 1.0, 1.0);
    }
}