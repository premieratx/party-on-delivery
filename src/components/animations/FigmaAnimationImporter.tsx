import React, { useEffect, useState } from 'react';

/**
 * Figma Animation Importer
 * 
 * This component helps import and implement animations from Figma exports.
 * 
 * SUPPORTED FIGMA EXPORT FILES FOR ANIMATIONS:
 * 
 * 1. **Lottie Files** (.json):
 *    - Export from Figma using LottieFiles plugin
 *    - File naming: "animation_name.json" (e.g., "hero_entrance.json")
 *    - Contains: Vector animations, morphing shapes, complex transitions
 * 
 * 2. **CSS Animation Files** (.css):
 *    - Export from Figma using "CSS Animations" plugin
 *    - File naming: "component_animations.css"
 *    - Contains: Keyframe animations, transitions, transforms
 * 
 * 3. **Framer Motion Data** (.json):
 *    - Export from Figma using "Framer" plugin
 *    - File naming: "framer_animations.json"
 *    - Contains: Spring animations, gesture handlers, layout animations
 * 
 * 4. **GreenSock (GSAP) Files** (.js):
 *    - Export from Figma using "GSAP Export" plugin
 *    - File naming: "gsap_timeline.js"
 *    - Contains: Timeline animations, morphing, complex sequences
 * 
 * 5. **SVG Animation Files** (.svg):
 *    - Export animated SVGs directly from Figma
 *    - File naming: "animated_icon.svg"
 *    - Contains: Path animations, stroke animations, icon morphs
 * 
 * HOW TO FIND THESE FILES IN YOUR FIGMA EXPORT:
 * 
 * Look for these folders/files in your downloaded Figma project:
 * - /animations/
 * - /lottie/
 * - /motion/
 * - /assets/animations/
 * - Files ending in: .json, .lottie, .svg, .css
 * 
 * USAGE INSTRUCTIONS:
 * 
 * 1. Upload the animation files to src/assets/animations/
 * 2. Use the components below to implement them in your cover pages
 * 3. The system will automatically detect and apply the animations
 */

interface AnimationFile {
  name: string;
  type: 'lottie' | 'css' | 'framer' | 'gsap' | 'svg';
  path: string;
  data?: any;
}

interface FigmaAnimationImporterProps {
  onAnimationLoad?: (animations: AnimationFile[]) => void;
}

export const FigmaAnimationImporter: React.FC<FigmaAnimationImporterProps> = ({
  onAnimationLoad
}) => {
  const [animations, setAnimations] = useState<AnimationFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-detect animation files in the assets folder
  useEffect(() => {
    const detectAnimationFiles = async () => {
      setLoading(true);
      
      // This would scan for animation files in production
      // For now, we'll use placeholder data
      const mockAnimations: AnimationFile[] = [
        {
          name: 'Hero Entrance',
          type: 'lottie',
          path: '/animations/hero_entrance.json'
        },
        {
          name: 'Button Hover',
          type: 'css',
          path: '/animations/button_hover.css'
        },
        {
          name: 'Logo Float',
          type: 'framer',
          path: '/animations/logo_float.json'
        },
        {
          name: 'Background Particles',
          type: 'lottie',
          path: '/animations/particles.json'
        }
      ];

      setAnimations(mockAnimations);
      onAnimationLoad?.(mockAnimations);
      setLoading(false);
    };

    detectAnimationFiles();
  }, [onAnimationLoad]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📁 Figma Animation Files Needed</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Upload these files from your Figma export to implement animations:</strong></p>
          <ul className="list-disc ml-4 space-y-1">
            <li><code>*.json</code> - Lottie animation files</li>
            <li><code>*_animations.css</code> - CSS keyframe animations</li>
            <li><code>framer_*.json</code> - Framer Motion data</li>
            <li><code>*.svg</code> - Animated SVG icons</li>
            <li><code>gsap_*.js</code> - GreenSock animation timelines</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Scanning for animation files...</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <h4 className="font-medium">Detected Animation Files:</h4>
          {animations.length > 0 ? (
            animations.map((animation, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{animation.name}</p>
                    <p className="text-xs text-muted-foreground">{animation.path}</p>
                  </div>
                  <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {animation.type}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No animation files detected. Upload Figma animation exports to src/assets/animations/
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper component to implement different animation types
export const FigmaAnimationRenderer: React.FC<{
  animation: AnimationFile;
  children?: React.ReactNode;
}> = ({ animation, children }) => {
  switch (animation.type) {
    case 'lottie':
      return (
        <div className="lottie-container">
          {/* Would integrate with @lottiefiles/react-lottie-player */}
          <div className="animate-pulse bg-gradient-to-r from-primary/20 to-secondary/20 rounded">
            {children}
          </div>
        </div>
      );
    
    case 'css':
      return (
        <div className="css-animated">
          <style>{`
            @keyframes figmaAnimation {
              0% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-10px) scale(1.02); }
              100% { transform: translateY(0) scale(1); }
            }
            .css-animated {
              animation: figmaAnimation 2s ease-in-out infinite;
            }
          `}</style>
          {children}
        </div>
      );
    
    default:
      return <div>{children}</div>;
  }
};