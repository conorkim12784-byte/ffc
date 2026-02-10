
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
  Edit3,
  Download,
  Share2,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
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
  const [showSplash, setShowSplash] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('shooting_v5_pro');
    if (saved) setNames(JSON.parse(saved));
    
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('shooting_v5_pro', JSON.stringify(names));
  }, [names]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-EG';
    recognitionRef.current.continuous = false;
    
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      if (window.navigator.vibrate) window.navigator.vibrate(40);
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
      if (window.navigator.vibrate) window.navigator.vibrate([30, 50]);
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

  // Fixed Word Export Method for PC compatibility
  const exportDoc = () => {
    if (names.length === 0) return;
    const dateStr = new Date().toLocaleDateString('ar-EG');
    
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
    <head><meta charset='utf-8'><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
    <style>
      body { font-family: 'Arial', sans-serif; padding: 1in; }
      table { border-collapse: collapse; width: 100%; border: 1pt solid black; margin-top: 20px; }
      th, td { border: 1pt solid black; padding: 8px; text-align: center; vertical-align: middle; font-size: 11pt; }
      th { background-color: #EEEEEE; font-weight: bold; }
      .title { font-size: 24pt; font-weight: bold; text-align: center; margin-bottom: 5pt; }
      .date { text-align: center; font-size: 14pt; margin-bottom: 20px; color: #555555; }
      .footer { text-align: center; margin-top: 50pt; font-size: 9pt; color: #888888; border-top: 0.5pt solid #CCCCCC; padding-top: 10pt; }
    </style></head><body>`;

    const body = `
      <div class='title'>كشف حضور مركز الرماية بالقاهرة</div>
      <div class='date'>التاريخ: ${dateStr}</div>
      <table>
        <thead>
          <tr>
            <th width='10%'>م</th>
            <th width='60%'>الاسم الكامل</th>
            <th width='30%'>وقت التسجيل</th>
          </tr>
        </thead>
        <tbody>
          ${names.map((n, i) => `<tr><td>${i + 1}</td><td>${n.name}</td><td>${n.timestamp}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class='footer'>تم إنشاء هذا الملف بواسطة نظام "تلاشاني" الذكي - 01140029315</div>
    </body></html>`;

    const blob = new Blob(['\ufeff', header + body], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `حضور_الرماية_${dateStr.replace(/\//g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFiles = (format: ExportFormat) => {
    let content = "";
    let mime = "text/plain";
    const dateStr = new Date().toLocaleDateString('ar-EG');

    if (format === ExportFormat.CSV) {
      content = "\ufeffم,الاسم,الوقت\n" + names.map((n, i) => `${i+1},${n.name},${n.timestamp}`).join('\n');
      mime = "text/csv;charset=utf-8";
    } else {
      content = "مركز الرماية بالقاهرة\n" + "=".repeat(20) + "\n" + names.map((n, i) => `${i+1}. ${n.name} [${n.timestamp}]`).join('\n');
      mime = "text/plain;charset=utf-8";
    }

    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `رماية_القاهرة_${dateStr}.${format}`;
    link.click();
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-10 animate-pulse-subtle">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 animate-pulse"></div>
          <Target className="w-24 h-24 text-red-600 relative z-10" />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter mb-2 text-white">رماية القاهرة</h1>
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.5em] opacity-80">Smart Attendance System</p>
        <div className="absolute bottom-20 flex flex-col items-center gap-2">
           <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 w-1/2 animate-[loading_2s_infinite_ease-in-out]"></div>
           </div>
           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Powered by Tlashani</span>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen max-w-md mx-auto flex flex-col overflow-hidden relative app-gradient">
      
      {/* Sleek App Bar */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between z-40 bg-black/20 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-red-500 border border-white/10">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-tight">القاهرة <span className="text-red-600">رماية</span></h1>
            <div className="flex items-center gap-1 opacity-50">
               <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
               <span className="text-[8px] font-black uppercase tracking-widest">Active System</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowSupport(true)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
          <Info className="w-5 h-5" />
        </button>
      </header>

      {/* Surface Area */}
      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-32 no-scrollbar space-y-6">
        
        {/* Status Pills */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <div className="flex-shrink-0 px-5 py-3 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Users className="w-4 h-4" /></div>
             <div>
                <span className="text-[8px] font-bold text-zinc-500 uppercase block">المتدربين</span>
                <span className="text-lg font-black">{names.length}</span>
             </div>
          </div>
          <div className="flex-shrink-0 px-5 py-3 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Clock className="w-4 h-4" /></div>
             <div>
                <span className="text-[8px] font-bold text-zinc-500 uppercase block">آخر حضور</span>
                <span className="text-lg font-black tracking-tighter">{names[0]?.timestamp || '--:--'}</span>
             </div>
          </div>
        </div>

        {/* Central Record Controller */}
        <div className="relative glass-panel rounded-[3rem] p-10 flex flex-col items-center justify-center border-dashed border-red-500/20">
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-6">
              {isListening && <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full scale-150 animate-pulse"></div>}
              <button 
                onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                className={`relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isListening ? 'bg-red-600' : 'bg-zinc-800'}`}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-zinc-300" />
                )}
              </button>
            </div>
            <h3 className="text-lg font-black">{isListening ? 'أنا أسمعك...' : 'اضغط للتحدث'}</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-widest italic opacity-60">قم بنطق الاسم بوضوح تام</p>
          </div>
          {isProcessing && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 rounded-[3rem]">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-red-600">AI Processing</span>
            </div>
          )}
        </div>

        {/* Live Transcription Banner */}
        {transcript && !isProcessing && (
          <div className="bg-red-600/5 p-4 rounded-2xl border border-red-600/10 flex items-center gap-4 animate-in slide-in-from-top-4">
             <Zap className="w-5 h-5 text-red-500 shrink-0" />
             <p className="text-xs font-bold text-zinc-300 italic leading-relaxed">"{transcript}"</p>
          </div>
        )}

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <div className="w-1 h-5 bg-red-600 rounded-full"></div>
               <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">قائمة الحضور المسجلة</h3>
            </div>
            {names.length > 0 && (
              <button onClick={() => setNames([])} className="text-[8px] bg-white/5 border border-white/5 px-3 py-1.5 rounded-full font-black text-zinc-500 uppercase">تفريغ</button>
            )}
          </div>

          <div className="space-y-3 pb-20">
            {names.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center opacity-10">
                 <Target className="w-16 h-16 mb-4" />
                 <span className="text-[9px] font-black uppercase tracking-[0.5em]">No Data Recorded</span>
              </div>
            ) : (
              names.map((item, index) => (
                <div key={item.id} className="glass-panel p-4 rounded-[1.5rem] flex items-center justify-between group active:bg-white/5">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500 shrink-0">
                      {names.length - index}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {editingId === item.id ? (
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="bg-transparent border-b border-red-600 text-base font-black w-full outline-none py-1 text-white"
                        />
                      ) : (
                        <h4 
                          onClick={() => { setEditingId(item.id); setEditValue(item.name); }}
                          className="text-base font-black text-zinc-100 truncate flex items-center gap-2"
                        >
                          {item.name}
                          <Edit3 className="w-3 h-3 text-zinc-700 shrink-0" />
                        </h4>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                         <Clock className="w-2.5 h-2.5 text-zinc-600" />
                         <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{item.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="p-3 text-zinc-700 hover:text-red-500 active:scale-90"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Mini Bottom Action Banner */}
      {names.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] flex items-center gap-2 shadow-2xl">
            <button 
              onClick={exportDoc}
              className="flex-1 bg-red-600 text-white h-12 rounded-[1.5rem] flex items-center justify-center gap-2 text-[10px] font-black uppercase shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" /> حفظ بصيغة Word
            </button>
            <div className="flex gap-1.5 pr-1 border-r border-white/5">
               <button onClick={() => exportFiles(ExportFormat.CSV)} className="w-12 h-12 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-blue-400 active:bg-white/10"><Table className="w-4 h-4" /></button>
               <button onClick={() => exportFiles(ExportFormat.TXT)} className="w-12 h-12 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-emerald-400 active:bg-white/10"><Download className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Support Center (Full Modal) */}
      {showSupport && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-950 p-8 rounded-t-[3rem] border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500 pb-12">
            <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-10"></div>
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-rose-500 rounded-[2rem] flex items-center justify-center shadow-xl mb-6 rotate-6 animate-pulse-subtle">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter text-white">تلاشاني</h2>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-1">Innovative Development</span>
            </div>
            
            <div className="space-y-4 mb-8">
              <a href="tel:01140029315" className="flex items-center justify-between p-5 glass-panel rounded-3xl active:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 flex items-center justify-center text-emerald-500 rounded-2xl"><Phone className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase mb-0.5">اتصال مباشر</p>
                    <p className="font-black text-xl tracking-tight" dir="ltr">01140029315</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-700" />
              </a>
              <a href="https://t.me/Tlashani" target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 glass-panel rounded-3xl active:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 flex items-center justify-center text-blue-400 rounded-2xl"><MessageCircle className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase mb-0.5">تليجرام</p>
                    <p className="font-black text-xl tracking-tight" dir="ltr">@Tlashani</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-700" />
              </a>
            </div>

            <button onClick={() => setShowSupport(false)} className="w-full py-5 rounded-3xl glass-panel text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all">رجوع للوحة التحكم</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
