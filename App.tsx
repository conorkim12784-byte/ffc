
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Trash2, 
  Phone, 
  MessageCircle, 
  Target,
  FileText,
  Table,
  Info,
  Clock,
  Users,
  X,
  Edit3,
  Check,
  Download,
  Share2,
  Trash,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { Trainee, ExportFormat } from './types';
import { extractNamesFromTranscript } from './services/geminiService';

const App: React.FC = () => {
  const [names, setNames] = useState<Trainee[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cairo_shooting_v4');
    if (saved) setNames(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('cairo_shooting_v4', JSON.stringify(names));
  }, [names]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-EG';
    recognitionRef.current.continuous = false;
    
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      if (window.navigator.vibrate) window.navigator.vibrate(30);
    };

    recognitionRef.current.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      processTranscript(text);
    };

    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  };

  const processTranscript = async (text: string) => {
    setIsProcessing(true);
    const extracted = await extractNamesFromTranscript(text);
    if (extracted.length > 0) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const newEntries = extracted.map(name => ({
        id: crypto.randomUUID(),
        name: name.trim(),
        timestamp: timeStr
      }));
      setNames(prev => [...newEntries, ...prev]);
      if (window.navigator.vibrate) window.navigator.vibrate([50, 30]);
    }
    setIsProcessing(false);
  };

  const deleteItem = (id: string) => {
    setNames(prev => prev.filter(n => n.id !== id));
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      setNames(prev => prev.map(n => n.id === editingId ? { ...n, name: editValue.trim() } : n));
      setEditingId(null);
    }
  };

  const exportDoc = () => {
    if (names.length === 0) return;
    const dateStr = new Date().toLocaleDateString('ar-EG');
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head><meta charset='utf-8'><title>رماية القاهرة</title>
      <style>
        body { font-family: 'Arial', sans-serif; }
        table { border-collapse: collapse; width: 100%; border: 1px solid #000; direction: rtl; }
        th, td { border: 1px solid #000; padding: 10px; text-align: center; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .h { text-align: center; font-size: 18pt; margin-bottom: 20px; }
      </style></head><body>
        <div class='h'>مركز تدريب الرماية - القاهرة</div>
        <div style='text-align:center;'>كشف حضور المتدربين بتاريخ: ${dateStr}</div>
        <br>
        <table><thead><tr><th>م</th><th>الاسم الكامل</th><th>الوقت</th></tr></thead>
        <tbody>${names.map((n, i) => `<tr><td>${i+1}</td><td>${n.name}</td><td>${n.timestamp}</td></tr>`).join('')}</tbody></table>
        <br><p style='text-align:center; font-size:9pt;'>برمجة: تلاشاني | 01140029315</p>
      </body></html>`;
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `حضور_رماية_${dateStr.replace(/\//g, '-')}.doc`;
    link.click();
  };

  const exportFiles = (format: ExportFormat) => {
    let content = "";
    let mime = "text/plain";
    const dateStr = new Date().toLocaleDateString('ar-EG');

    if (format === ExportFormat.CSV) {
      // \ufeff is the BOM for Excel to recognize Arabic characters correctly
      content = "\ufeffم,الاسم,الوقت\n" + names.map((n, i) => `${i+1},${n.name},${n.timestamp}`).join('\n');
      mime = "text/csv;charset=utf-8";
    } else {
      content = "مركز الرماية بالقاهرة\n" + "=".repeat(20) + "\n" + names.map((n, i) => `${i+1}. ${n.name} [${n.timestamp}]`).join('\n');
      mime = "text/plain;charset=utf-8";
    }

    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `رماية_${format}.${format}`;
    link.click();
  };

  return (
    <div className="h-screen w-screen max-w-md mx-auto flex flex-col overflow-hidden relative">
      
      {/* Dynamic App Bar */}
      <header className="px-5 pt-8 pb-3 flex items-center justify-between z-40 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none">رماية القاهرة</h1>
            <span className="text-[8px] text-red-500 font-bold tracking-widest uppercase">Smart Core V4</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSupport(true)} className="p-2 text-slate-400"><Info className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Main Surface */}
      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-32 no-scrollbar space-y-4">
        
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="compact-card p-3 rounded-2xl flex items-center justify-between">
            <Users className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <span className="text-[8px] font-bold text-slate-500 uppercase block leading-none">المسجلين</span>
              <span className="text-xl font-black">{names.length}</span>
            </div>
          </div>
          <div className="compact-card p-3 rounded-2xl flex items-center justify-between">
            <Clock className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[8px] font-bold text-slate-500 uppercase block leading-none">آخر دخول</span>
              <span className="text-xl font-black tracking-tighter">{names[0]?.timestamp || '--:--'}</span>
            </div>
          </div>
        </div>

        {/* Focused Mic Control */}
        <div className="relative compact-card rounded-3xl p-6 flex flex-col items-center justify-center overflow-hidden transition-all">
          <div className="relative z-10 flex flex-col items-center">
            <button 
              onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${isListening ? 'bg-red-600' : 'bg-zinc-800'}`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Mic className="w-8 h-8 text-slate-300" />
              )}
              {isListening && <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping"></div>}
            </button>
            <h3 className="text-sm font-black mt-3">{isListening ? 'تحدث الآن' : 'اضغط للتسجيل'}</h3>
          </div>
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Transcription Preview (Slim) */}
        {transcript && !isProcessing && (
          <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[11px] text-slate-400 italic">"{transcript}"</p>
          </div>
        )}

        {/* Compact Actionable List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">سجل المتدربين اليوم</span>
            {names.length > 0 && (
              <button onClick={() => setNames([])} className="text-[9px] text-red-500 font-bold uppercase">تصفير</button>
            )}
          </div>

          <div className="space-y-2">
            {names.length === 0 ? (
              <div className="py-12 flex flex-col items-center opacity-10">
                <Target className="w-12 h-12" />
                <span className="text-[8px] font-bold mt-2 tracking-widest">لا مدخلات</span>
              </div>
            ) : (
              names.map((item, index) => (
                <div key={item.id} className="compact-card p-3 rounded-xl flex items-center justify-between active:bg-white/5">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <span className="text-[10px] font-black text-slate-600 w-4 text-center">{names.length - index}</span>
                    <div className="flex-1 overflow-hidden">
                      {editingId === item.id ? (
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="bg-transparent border-b border-red-500 text-sm font-bold w-full outline-none py-0.5 text-white"
                        />
                      ) : (
                        <div onClick={() => { setEditingId(item.id); setEditValue(item.name); }} className="flex items-center gap-1.5 truncate">
                          <span className="text-sm font-bold truncate">{item.name}</span>
                          <Edit3 className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                        </div>
                      )}
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter block">{item.timestamp}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-700 active:text-red-500"><Trash className="w-4 h-4" /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Docked Compact Action Bar */}
      {names.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="bg-zinc-900 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xl">
            <button 
              onClick={exportDoc}
              className="flex-1 bg-red-600 text-white h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" /> Word
            </button>
            <button 
              onClick={() => exportFiles(ExportFormat.CSV)}
              className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 active:bg-zinc-700"
            >
              <Table className="w-4 h-4" />
            </button>
            <button 
              onClick={() => exportFiles(ExportFormat.TXT)}
              className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 active:bg-zinc-700"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Support Sheet */}
      {showSupport && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md sheet p-8 rounded-t-[2.5rem] animate-in slide-in-from-bottom duration-300 pb-12">
            <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-8"></div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl mb-4"><Target className="w-10 h-10" /></div>
              <h2 className="text-2xl font-black italic">تلاشاني</h2>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Premium Software Studio</span>
            </div>
            <div className="space-y-3">
              <a href="tel:01140029315" className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl active:bg-zinc-800 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center text-emerald-500 rounded-xl"><Phone className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase mb-0.5">اتصل بنا</p>
                    <p className="font-black text-lg" dir="ltr">01140029315</p>
                  </div>
                </div>
              </a>
              <a href="https://t.me/Tlashani" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl active:bg-zinc-800 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center text-blue-400 rounded-xl"><MessageCircle className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase mb-0.5">تليجرام</p>
                    <p className="font-black text-lg" dir="ltr">@Tlashani</p>
                  </div>
                </div>
              </a>
            </div>
            <button onClick={() => setShowSupport(false)} className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
