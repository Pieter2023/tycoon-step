import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CareerPath } from '../../types';
import { CAREER_PATHS } from '../../constants';
import CameraCapture from './CameraCapture';
import { generateAvatarOptions, generateFinalAvatar } from '../../services/avatarGeneration';
import { AvatarBuilderStep, GeneratedCharacter, STYLE_OPTIONS, StyleOption, UserSelections } from './types';

export type CustomAvatarResult = {
  avatarImage: string;
  name: string;
  careerPath: CareerPath;
};

type CustomAvatarBuilderProps = {
  onCancel: () => void;
  onComplete: (result: CustomAvatarResult) => void;
  initialName?: string;
  initialCareerPath?: CareerPath;
};

const CustomAvatarBuilder: React.FC<CustomAvatarBuilderProps> = ({
  onCancel,
  onComplete,
  initialName,
  initialCareerPath
}) => {
  const [step, setStep] = useState<AvatarBuilderStep>('capture');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [avatarOptions, setAvatarOptions] = useState<GeneratedCharacter[]>([]);
  const [selectedBase, setSelectedBase] = useState<GeneratedCharacter | null>(null);
  const [selections, setSelections] = useState<UserSelections>({});
  const [finalAvatar, setFinalAvatar] = useState<string | null>(null);
  const [name, setName] = useState(initialName || '');
  const [careerPath, setCareerPath] = useState<CareerPath>(initialCareerPath || 'TECH');

  const downscaleBaseImage = (dataUrl: string, maxSize = 512): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const targetWidth = Math.round(img.width * scale);
        const targetHeight = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSelfieCaptured = async (base64: string) => {
    setLoading(true);
    setError(null);
    setLoadingMessage('Generating avatar options...');
    try {
      const results = await generateAvatarOptions(base64);
      if (results.length === 0) throw new Error('No avatars generated');
      setAvatarOptions(results.map((b64, idx) => ({
        id: `${idx}`,
        url: `data:image/png;base64,${b64}`,
        base64: b64
      })));
      setStep('select');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const needsDevServer = msg.includes('Not Found') || msg.includes('Failed to fetch');
      const isTimeout = msg.includes('Inactivity Timeout') || msg.toLowerCase().includes('timed out');
      setError(needsDevServer
        ? 'Avatar API not reachable. Start Netlify Dev (npx netlify dev) and try again.'
        : isTimeout
          ? 'Avatar generation timed out. Please try again.'
        : msg
          ? `Unable to generate avatar options: ${msg}`
          : 'Unable to generate avatar options. Confirm your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBaseSelected = (char: GeneratedCharacter) => {
    setSelectedBase(char);
    setStep('style');
  };

  const toggleSelection = (opt: StyleOption) => {
    setSelections(prev => ({
      ...prev,
      [opt.category]: prev[opt.category]?.id === opt.id ? undefined : opt
    }));
  };

  const finalizeAvatar = async () => {
    if (!selectedBase) return;
    setLoading(true);
    setError(null);
    setLoadingMessage('Rendering final avatar...');
    try {
      const scaledDataUrl = await downscaleBaseImage(selectedBase.url, 512);
      const scaledBase64 = scaledDataUrl.split(',')[1] || selectedBase.base64;
      const result = await generateFinalAvatar(scaledBase64, {
        shirt: selections.shirt?.description,
        accessory: selections.accessory?.description,
        hair: selections.hair?.description
      });
      if (!result) throw new Error('Generation failed');
      setFinalAvatar(`data:image/png;base64,${result}`);
      setStep('final');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const needsDevServer = msg.includes('Not Found') || msg.includes('Failed to fetch');
      const isTimeout = msg.includes('Inactivity Timeout') || msg.toLowerCase().includes('timed out');
      setError(needsDevServer
        ? 'Avatar API not reachable. Start Netlify Dev (npx netlify dev) and try again.'
        : isTimeout
          ? 'Avatar render timed out. Please try again.'
        : msg
          ? `Failed to render your avatar: ${msg}`
          : 'Failed to render your avatar. Try a different option or retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const trimmedName = name.trim();
    if (!finalAvatar) {
      setError('Generate a final avatar before continuing.');
      return;
    }
    if (!trimmedName) {
      setError('Enter a name to continue.');
      return;
    }
    onComplete({ avatarImage: finalAvatar, name: trimmedName, careerPath });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Custom Character</h1>
            <p className="text-slate-400 text-sm">Capture, customize, and bring your avatar into Tycoon.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Back to Characters
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-900/20 p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <p className="text-slate-300 text-sm">{loadingMessage}</p>
          </div>
        ) : (
          <>
            {step === 'capture' && (
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Capture Your Photo</h2>
                  <p className="text-slate-400 text-sm">Use a clear selfie for the best 3D result.</p>
                </div>
                <CameraCapture onCapture={handleSelfieCaptured} onBack={onCancel} />
              </div>
            )}

            {step === 'select' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">Choose a Base Avatar</h2>
                  <p className="text-slate-400 text-sm">Pick the base render to style.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {avatarOptions.map(char => (
                    <motion.button
                      key={char.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBaseSelected(char)}
                      className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-slate-900 border border-slate-700 hover:border-emerald-500 transition-all shadow-2xl"
                    >
                      <img src={char.url} alt="Avatar option" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-semibold">
                        Select this base
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setStep('capture')}
                    className="text-slate-400 text-sm font-semibold hover:text-white transition-colors"
                  >
                    Retake photo
                  </button>
                </div>
              </div>
            )}

            {step === 'style' && selectedBase && (
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
                  <img src={selectedBase.url} alt="Selected base" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Style Lab</h2>
                    <p className="text-slate-400 text-sm">Choose an outfit, accessory, and hair style.</p>
                  </div>

                  {(['shirt', 'accessory', 'hair'] as const).map(category => (
                    <div key={category} className="space-y-3">
                      <p className="text-slate-300 text-sm font-semibold capitalize">{category}</p>
                      <div className="flex flex-wrap gap-2">
                        {STYLE_OPTIONS.filter(opt => opt.category === category).map(opt => {
                          const selected = selections[category]?.id === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleSelection(opt)}
                              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                                selected
                                  ? 'bg-emerald-500 text-white shadow-lg'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {opt.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep('select')}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={finalizeAvatar}
                      className="px-5 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold"
                    >
                      Render Final Avatar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'final' && finalAvatar && (
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
                  <img src={finalAvatar} alt="Final avatar" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Finish Your Profile</h2>
                    <p className="text-slate-400 text-sm">Name your character and pick a career path.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Character Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter a name"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-300">Career Path</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.keys(CAREER_PATHS) as CareerPath[]).map(path => {
                        const career = CAREER_PATHS[path];
                        const selected = careerPath === path;
                        return (
                          <button
                            key={path}
                            type="button"
                            onClick={() => setCareerPath(path)}
                            className={`rounded-xl border px-3 py-3 text-left transition-all ${
                              selected
                                ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <p className="text-sm font-semibold">{career.name}</p>
                            <p className="text-xs text-slate-400">AI-Proof {career.futureProofScore}%</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('style')}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Back to Style Lab
                    </button>
                    <button
                      type="button"
                      onClick={handleComplete}
                      className="px-5 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold"
                    >
                      Start Game
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomAvatarBuilder;
