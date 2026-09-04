import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PluginListenerHandle } from '@capacitor/core';
import { CATEGORIES } from '../types';
import type { Category, AnalysisResult } from '../types';
import { submitComplaint, incrementSupport } from '../services/complaintService';
import { loadComplaints } from '../services/storageService';
import { analyzeComplaint } from '../services/analysisService';
import { PriorityBadge, CategoryBadge } from '../components/common/Badges';
import { useAuth } from '../contexts/AuthContext';

type Step = 'form' | 'analysis' | 'duplicate';

const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'ur-PK', label: 'Urdu (اردو)' },
  { code: 'sd-PK', label: 'Sindhi (سنڌي)' },
];

// Detect the Capacitor native runtime (bridge is injected into the WebView).
// The Web Speech API is not usable inside the Android WebView, so on native
// platforms voice input runs through the native speech recognition plugin.
const isNativePlatform = (): boolean => {
  try {
    const cap = (window as any).Capacitor;
    return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform();
  } catch {
    return false;
  }
};

const joinTranscripts = (base: string, addition: string): string => {
  const b = (base || '').trim();
  const a = (addition || '').trim();
  if (!a) return b;
  if (!b) return a;
  return `${b} ${a}`;
};

export default function ReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('form');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);

  // Voice
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [isRecording, setIsRecording] = useState(false);
  const [isNative] = useState(isNativePlatform);
  const [voiceSupported, setVoiceSupported] = useState(
    () => isNativePlatform() || 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // Native (Capacitor) speech recognition refs. Android partial results are
  // cumulative within one listening session, so the live session text is
  // REPLACED on every event (never appended) — this is what prevents word
  // duplication. Text is only appended once per session, when it is folded
  // into the committed transcript.
  const nativeListenersRef = useRef<PluginListenerHandle[] | null>(null);
  const nativeBaseRef = useRef('');
  const nativeSessionTextRef = useRef('');
  const nativeFoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On native, verify speech recognition availability on the device
  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;
    (async () => {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        const { available } = await SpeechRecognition.available();
        if (!cancelled) setVoiceSupported(available);
      } catch {
        if (!cancelled) setVoiceSupported(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  // Clean up native listeners and timers when leaving the page
  useEffect(() => {
    return () => {
      if (nativeFoldTimerRef.current) clearTimeout(nativeFoldTimerRef.current);
      const handles = nativeListenersRef.current;
      if (handles) {
        import('@capacitor-community/speech-recognition')
          .then(({ SpeechRecognition }) => {
            handles.forEach((h) => h.remove());
            void SpeechRecognition.removeAllListeners();
          })
          .catch(() => {});
        nativeListenersRef.current = null;
      }
    };
  }, []);

  // Analysis
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const isValid = title.trim().length > 0 && description.trim().length > 0 && location.trim().length > 0;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageData(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageData(null);
    setImagePreview(null);
  };

  // Native path: fold the finished session's text into the committed transcript.
  // Runs slightly after 'stopped' so the final onResults event (which arrives
  // last, also through the partialResults channel) is included.
  const foldNativeSession = useCallback(() => {
    nativeFoldTimerRef.current = null;
    nativeBaseRef.current = joinTranscripts(nativeBaseRef.current, nativeSessionTextRef.current);
    nativeSessionTextRef.current = '';
    setIsRecording(false);
    setInterimText('');
    setVoiceTranscript(nativeBaseRef.current);
  }, []);

  const scheduleNativeFold = useCallback(
    (delayMs: number) => {
      if (nativeFoldTimerRef.current) clearTimeout(nativeFoldTimerRef.current);
      nativeFoldTimerRef.current = setTimeout(foldNativeSession, delayMs);
    },
    [foldNativeSession]
  );

  // Watchdog: some recognizer errors (e.g. speech timeout) end the session
  // without a 'stopped' event, which would leave the UI stuck on "Listening".
  // While recording, poll the plugin's listening state and recover if it died.
  useEffect(() => {
    if (!isNative || !isRecording) return;
    const iv = setInterval(async () => {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        const { listening } = await SpeechRecognition.isListening();
        if (!listening && !nativeFoldTimerRef.current) {
          scheduleNativeFold(300);
        }
      } catch {
        // ignore polling failures
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [isNative, isRecording, scheduleNativeFold]);

  const startNativeVoice = useCallback(async () => {
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');

      // Microphone permission (RECORD_AUDIO)
      const perm = await SpeechRecognition.checkPermissions();
      if (perm.speechRecognition !== 'granted') {
        const req = await SpeechRecognition.requestPermissions();
        if (req.speechRecognition !== 'granted') {
          alert('Microphone permission is required for voice input.');
          return;
        }
      }

      // Register the result listeners once
      if (!nativeListenersRef.current) {
        const handles: PluginListenerHandle[] = [];
        handles.push(
          await SpeechRecognition.addListener('partialResults', (data) => {
            const text = (data.matches?.[0] || '').trim();
            if (!text) return;
            // Cumulative session text: replace, never append (no duplicates).
            // Live text is shown in the interim preview only; the editable
            // transcript keeps the previously committed text until the fold.
            nativeSessionTextRef.current = text;
            setInterimText(text);
            setVoiceTranscript(nativeBaseRef.current || null);
            // A late/final result arrived while waiting to fold — extend the grace
            if (nativeFoldTimerRef.current) scheduleNativeFold(600);
          })
        );
        handles.push(
          await SpeechRecognition.addListener('listeningState', (data) => {
            if (data.status === 'stopped') {
              // Final onResults can land right after 'stopped' — wait briefly
              scheduleNativeFold(600);
            }
          })
        );
        nativeListenersRef.current = handles;
      }

      // If the previous session's fold is still pending, commit its text now
      // so it is not lost when a new session starts.
      if (nativeFoldTimerRef.current && nativeSessionTextRef.current) {
        clearTimeout(nativeFoldTimerRef.current);
        foldNativeSession();
      }

      // Keep previously committed text; start a fresh session on top of it
      nativeBaseRef.current = voiceTranscript || '';
      nativeSessionTextRef.current = '';
      setInterimText('');

      await SpeechRecognition.start({
        language: voiceLanguage,
        partialResults: true,
        popup: false,
        maxResults: 1,
      });
      setIsRecording(true);
    } catch (e) {
      console.error('Native voice input failed to start:', e);
      setIsRecording(false);
      setInterimText('');
    }
  }, [voiceTranscript, voiceLanguage, scheduleNativeFold, foldNativeSession]);

  const stopNativeVoice = useCallback(async () => {
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
      await SpeechRecognition.stop();
    } catch {
      //Recognizer may already be stopped — ignore
    }
    // 'stopped' may not fire after an explicit stop, so schedule the fold here
    scheduleNativeFold(600);
  }, [scheduleNativeFold]);

  const startVoice = useCallback(() => {
    if (isNative) {
      void startNativeVoice();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceLanguage;

    // Start fresh: only append to existing transcript
    finalTranscriptRef.current = voiceTranscript || '';
    setInterimText('');

    recognition.onresult = (event: any) => {
      let interim = '';
      let newFinal = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Only append final results — prevents word duplication
          const finalText = result[0].transcript.trim();
          if (finalText) {
            newFinal += (newFinal ? ' ' : '') + finalText;
          }
        } else {
          // Show interim as preview (not committed)
          interim += result[0].transcript;
        }
      }

      finalTranscriptRef.current = newFinal;
      setVoiceTranscript(newFinal);
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
      // Commit only the final transcript
      setVoiceTranscript(finalTranscriptRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isNative, voiceTranscript, voiceLanguage, startNativeVoice]);

  const stopVoice = () => {
    if (isNative) {
      void stopNativeVoice();
      return;
    }
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText('');
    setVoiceTranscript(finalTranscriptRef.current);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    setIsAnalyzing(true);
    setStep('analysis');

    // Run analysis asynchronously
    setTimeout(async () => {
      const existing = await loadComplaints();
      const result = analyzeComplaint(
        title,
        description,
        location,
        (category as Category) || null,
        existing
      );
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleConfirmSubmission = () => {
    if (!analysis) return;

    if (analysis.duplicate.status === 'Likely duplicate' || analysis.duplicate.status === 'Possible duplicate') {
      setStep('duplicate');
      return;
    }

    finalizeSubmission();
  };

  const handleSupportExisting = async () => {
    if (analysis?.duplicate.matchId) {
      await incrementSupport(analysis.duplicate.matchId);
      navigate(`/confirmation/${analysis.duplicate.matchId}`);
    }
  };

  const finalizeSubmission = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const complaint = await submitComplaint({
        userId: user.id,
        title,
        description,
        location,
        selectedCategory: (category as Category) || null,
        imageData,
        voiceTranscript,
      });
      navigate(`/confirmation/${complaint.id}`);
    } catch (e) {
      console.error('Failed to submit complaint:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Step: Form */}
      {step === 'form' && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Report a Civic Issue</h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Describe the problem you've observed. The more detail you provide, the better we can categorize and prioritize it.</p>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="label-text">Issue Title <span className="text-red-500">*</span></label>
              <input
                id="title"
                type="text"
                className="input-field"
                placeholder="e.g., Large pothole on Main Street"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label-text">Description <span className="text-red-500">*</span></label>
              <textarea
                id="description"
                className="input-field min-h-[120px] resize-y"
                placeholder="Describe the issue in detail. What is the impact? How long has it been there?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
              <div className="text-xs text-gray-400 mt-1">{description.length}/2000</div>
            </div>

            {/* Voice Input */}
            <div>
              <label className="label-text">Voice Input <span className="text-gray-400 font-normal">(optional)</span></label>
              {voiceSupported ? (
                <div>
                  {/* Language Selector */}
                  <div className="mb-2">
                    <label htmlFor="voiceLang" className="text-xs text-gray-500 mb-1 block">Voice Language:</label>
                    <select
                      id="voiceLang"
                      className="input-field text-sm py-1.5 w-auto"
                      value={voiceLanguage}
                      onChange={(e) => setVoiceLanguage(e.target.value)}
                      disabled={isRecording}
                    >
                      {VOICE_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <button
                      type="button"
                      onClick={isRecording ? stopVoice : startVoice}
                      className={`btn-secondary text-sm px-4 py-2 ${isRecording ? '!bg-red-50 !border-red-400 !text-red-700' : ''}`}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Voice Input'}
                    </button>
                    {isRecording && (
                      <span className="flex items-center gap-1 text-sm text-red-600">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Listening ({VOICE_LANGUAGES.find(l => l.code === voiceLanguage)?.label})...
                      </span>
                    )}
                  </div>

                  {/* Interim preview */}
                  {interimText && (
                    <div className="mb-2 text-sm text-gray-400 italic bg-gray-50 p-2 rounded-lg">
                      {interimText}
                    </div>
                  )}

                  {voiceTranscript && (
                    <div>
                      <label htmlFor="voiceTranscript" className="text-xs text-gray-500 mb-1 block">Voice transcript (editable):</label>
                      <textarea
                        id="voiceTranscript"
                        className="input-field text-sm min-h-[60px]"
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setVoiceTranscript(null)}
                        className="text-xs text-red-500 hover:underline mt-1"
                      >
                        Clear transcript
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  {isNative
                    ? 'Voice input is not available on this device (no speech recognition service found). Please type your complaint instead.'
                    : 'Voice input is not supported in your browser. Please type your complaint instead, or try Chrome or Edge for voice support.'}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="label-text">Category <span className="text-gray-400 font-normal">(optional — system can suggest)</span></label>
              <select
                id="category"
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                <option value="">Let the system suggest</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="label-text">Location <span className="text-red-500">*</span></label>
              <input
                id="location"
                type="text"
                className="input-field"
                placeholder="e.g., Main Street near City Hospital"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="label-text">Photo <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-32 rounded-lg border border-gray-200 object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className="btn-primary w-full text-lg py-3"
              >
                Analyze & Submit Report
              </button>
              {!isValid && (
                <p className="text-sm text-gray-500 mt-2 text-center">Please fill in the title, description, and location.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step: Analysis */}
      {step === 'analysis' && (
        <div className="text-center">
          {isAnalyzing ? (
            <div className="py-20">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Report...</h2>
              <p className="text-gray-600">Categorizing, calculating priority, and checking for duplicates.</p>
              <p className="text-xs text-gray-400 mt-2">Local heuristic analysis — no external AI or API is used.</p>
            </div>
          ) : analysis ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
              <div className="card text-left space-y-4 mb-6">
                <div>
                  <span className="text-sm font-medium text-gray-500">Suggested Category</span>
                  <div className="mt-1 flex items-center gap-2">
                    <CategoryBadge category={analysis.category} />
                    <span className="text-xs text-gray-400">{analysis.categoryConfidence}</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Priority</span>
                  <div className="mt-1 flex items-center gap-3">
                    <PriorityBadge priority={analysis.priority} />
                    <span className="text-sm font-semibold text-gray-700">Score: {analysis.priorityScore}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg">{analysis.priorityExplanation}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Duplicate Check</span>
                  <p className={`text-sm mt-1 ${analysis.duplicate.status === 'No likely duplicate' ? 'text-green-700' : 'text-amber-700'}`}>
                    {analysis.duplicate.status}
                    {analysis.duplicate.matchTitle && (
                      <span className="text-gray-600"> — matches "{analysis.duplicate.matchTitle}"</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleConfirmSubmission} disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit Report'}
                </button>
                <button onClick={() => setStep('form')} disabled={isSubmitting} className="btn-secondary">
                  Back to Edit
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Step: Duplicate */}
      {step === 'duplicate' && analysis && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Possible Duplicate Found</h2>
          <div className="card mb-6">
            <p className="text-gray-700 mb-3">
              A similar complaint already exists: <strong>{analysis.duplicate.matchTitle}</strong> (ID: {analysis.duplicate.matchId}).
            </p>
            <p className="text-sm text-gray-600 mb-4">
              You can support the existing report to increase its visibility, or submit your own separate report.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleSupportExisting} className="btn-primary">
                Support Existing Report
              </button>
              <button onClick={finalizeSubmission} disabled={isSubmitting} className="btn-secondary">
                {isSubmitting ? 'Submitting...' : 'Submit Separate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
