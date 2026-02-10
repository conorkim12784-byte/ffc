
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
  ChevronLeft,
  Settings,
  CheckCheck,
  MoreVertical,
  X,
  Cpu,
  Scan,
  Save
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
  const [hasEntered, setHasEntered] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | 'DOC' | null>(null);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('shooting_range_ultra_v14');
    if (saved) setNames(JSON.parse(saved));
    
    // Splash screen timer
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('shooting_range_ultra_v14', JSON.stringify(names));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [names]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-EG';
    recognitionRef.current.continuous = false;
    recognitionRef.current.onstart = () => setIsListening(true);
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
    if (extracted && extracted.length > 0) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const newEntries = extracted.map(name => ({
        id: crypto.randomUUID(),
        name: name.trim(),
        timestamp: timeStr
      }));
      setNames(prev => [...prev, ...newEntries]);
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

  const handleExportRequest = (format: ExportFormat | 'DOC') => {
    const defaultName = `كشف_رماية_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`;
    setFileName(defaultName);
    setPendingFormat(format);
    setShowExportModal(true);
  };

  const confirmExport = () => {
    if (!fileName.trim()) return;
    
    if (pendingFormat === 'DOC') {
      executeDocExport();
    } else if (pendingFormat) {
      executeFileExport(pendingFormat as ExportFormat);
    }
    
    setShowExportModal(false);
    setPendingFormat(null);
  };

  const executeDocExport = () => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: 'Arial', sans-serif; direction: rtl; padding: 40px; }
          .header { border: 2pt solid #00e676; padding: 20px; text-align: center; margin-bottom: 25px; }
          .title { font-size: 24pt; font-weight: bold; color: #00a884; }
          table { border-collapse: collapse; width: 100%; border: 1.5pt solid black; }
          th { background-color: #00e676; color: black; border: 1pt solid black; padding: 12px; font-weight: bold; }
          td { border: 1pt solid black; padding: 10px; text-align: center; }
          .footer { text-align: center; font-size: 10pt; color: #666; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">كشف حضور الرماية - القاهرة</div>
          <div style="font-size: 14pt;">نظام تلاشاني الذكي</div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="10%">م</th>
              <th width="65%">الاسم</th>
              <th width="25%">الوقت</th>
            </tr>
          </thead>
          <tbody>
            ${names.map((n, i) => `<tr><td>${i + 1}</td><td>${n.name}</td><td>${n.timestamp}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">تم الاستخراج بتاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    link.click();
  };

  const executeFileExport = (format: ExportFormat) => {
    let content = "";
    let mime = "text/plain";
    if (format === ExportFormat.CSV) {
      content = "\ufeffم,الاسم,الوقت\n" + names.map((n, i) => `${i+1},${n.name},${n.timestamp}`).join('\n');
      mime = "text/csv;charset=utf-8";
    } else {
      content = "كشف رماية القاهرة\n" + names.map((n, i) => `${i+1}. ${n.name} [${n.timestamp}]`).join('\n');
    }
    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${format}`;
    link.click();
  };

  if (!hasEntered) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0b141a]">
        <div className="absolute inset-0 chat-pattern"></div>
        <div className="relative animate-float">
          <div className="absolute inset-0 bg-[#00e676] blur-[100px] opacity-20 scale-150"></div>
          <div className="w-36 h-36 glass-card rounded-[3rem] flex items-center justify-center border-white/10 shadow-[0_0_50px_rgba(0,230,118,0.3)] relative z-10">
             <Target className="w-20 h-20 text-[#00e676]" />
             <div className="absolute inset-0 shimmer opacity-10"></div>
          </div>
        </div>
        <div className="mt-12 text-center relative z-10">
           <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">رماية القاهرة</h1>
           <p className="text-[#00e676] text-[10px] font-black uppercase tracking-[0.8em] opacity-80">PRO SYSTEM V14</p>
        </div>
        <div className="absolute bottom-20 flex flex-col items-center gap-4">
           <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#00e676] w-1/2 animate-[loading_1.5s_infinite_ease-in-out]"></div>
           </div>
           <span className="text-[10px] font-black text-[#8696a0] uppercase tracking-widest">تطوير م. تلاشاني</span>
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
    <div className="h-screen w-full flex flex-col bg-[#0b141a] relative overflow-hidden">
      <div className="absolute inset-0 chat-pattern"></div>
      
      {/* Premium Header */}
      <header className="bg-[#202c33] px-5 py-5 flex items-center justify-between shadow-2xl z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white border-2 border-white/10 shadow-2xl">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">رماية القاهرة</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] animate-pulse"></span>
               <span className="text-[10px] font-black text-[#00e676] uppercase tracking-widest">نظام نشط</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[#aebac1]">
          <button onClick={() => setShowSupport(true)} className="hover:text-white"><Settings className="w-6 h-6" /></button>
          <button className="hover:text-white"><MoreVertical className="w-6 h-6" /></button>
        </div>
      </header>

      {/* Info Strip */}
      <div className="bg-[#111b21]/95 backdrop-blur-xl px-8 py-3 flex justify-between border-b border-white/5 text-[12px] font-black text-[#8696a0] z-40">
          <div className="flex items-center gap-2.5 uppercase tracking-tighter"><Users className="w-4.5 h-4.5 text-[#00e676]" /> العدد: <span className="text-white text-sm">{names.length}</span></div>
          <div className="flex items-center gap-2.5 uppercase tracking-tighter"><Clock className="w-4.5 h-4.5 text-[#00e676]" /> {names[names.length-1]?.timestamp || '--:--'}</div>
      </div>

      {/* Main List */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-8 space-y-4 no-scrollbar pb-40 z-30"
      >
        {names.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-[#8696a0] text-center px-14">
            <Scan className="w-20 h-20 mb-6" />
            <p className="text-sm font-bold italic">نظام التسجيل جاهز. تحدث بالأسماء لبدء القيد.</p>
          </div>
        ) : (
          names.map((item, index) => (
            <div key={item.id} className="flex flex-col items-end animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="glass-card p-4 min-w-[150px] max-w-[90%] rounded-2xl rounded-tr-none shadow-xl border-white/5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    {editingId === item.id ? (
                      <input 
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="bg-transparent border-b-2 border-[#00e676] text-white w-full outline-none py-1 text-xl font-black"
                      />
                    ) : (
                      <h4 
                        onClick={() => { setEditingId(item.id); setEditValue(item.name); }}
                        className="text-xl font-bold text-white tracking-tight cursor-pointer"
                      >
                        {item.name}
                      </h4>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteItem(item.id)} className="text-red-500"><Trash2 className="w-4.5 h-4.5" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1.5 border-t border-white/5 pt-2">
                  <span className="text-[11px] font-bold text-[#8696a0]">{item.timestamp}</span>
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                </div>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex flex-col items-start animate-pulse">
             <div className="bg-[#202c33] p-4 rounded-xl rounded-tr-none text-xs font-black text-[#00e676] border border-[#00e676]/10">
                جارِ استخراج الأسماء...
             </div>
          </div>
        )}
      </main>

      {/* Floating Export Controls */}
      {names.length > 0 && (
        <div className="absolute bottom-28 left-0 right-0 px-5 z-40">
           <div className="bg-[#202c33]/95 backdrop-blur-2xl p-3 rounded-[2.5rem] flex items-center justify-between shadow-2xl border border-white/10">
              <button 
                onClick={() => handleExportRequest('DOC')}
                className="flex-1 bg-[#00a884] text-white h-14 rounded-full flex items-center justify-center gap-3 text-sm font-black active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                <FileText className="w-6 h-6" /> حفظ جدول Word
              </button>
              <div className="flex gap-2 pl-3">
                 <button onClick={() => handleExportRequest(ExportFormat.CSV)} className="w-14 h-14 bg-[#111b21] rounded-full flex items-center justify-center text-[#00e676] border border-white/5"><Table className="w-5.5 h-5.5" /></button>
                 <button onClick={() => handleExportRequest(ExportFormat.TXT)} className="w-14 h-14 bg-[#111b21] rounded-full flex items-center justify-center text-blue-400 border border-white/5"><Download className="w-5.5 h-5.5" /></button>
              </div>
           </div>
        </div>
      )}

      {/* Bottom Voice Bar */}
      <footer className="bg-[#202c33] px-5 py-5 flex items-center gap-4 border-t border-white/5 z-50">
        <div className="flex-1 bg-[#2a3942] rounded-3xl px-6 py-4 text-sm text-white/90 truncate font-bold shadow-inner">
          {isListening ? (
             <span className="text-[#00e676] font-black animate-pulse">جاري الاستماع...</span>
          ) : (
            transcript || "اضغط للتحدث"
          )}
        </div>
        <button 
          onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isListening ? 'bg-red-500 shadow-red-500/40 ring-4 ring-red-500/10' : 'bg-[#00e676] shadow-emerald-500/30 ring-4 ring-emerald-500/10'}`}
        >
          {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
        </button>
      </footer>

      {/* Export Naming Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#111b21] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-white mb-6 text-center">تسمية الملف قبل الحفظ</h3>
            <div className="space-y-4">
               <div className="bg-[#202c33] p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-[#8696a0] uppercase mb-2">اسم الملف المراد حفظه</p>
                  <input 
                    autoFocus
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="bg-transparent text-white font-bold text-lg w-full outline-none border-b border-[#00e676] py-1"
                    placeholder="أدخل اسم الملف..."
                  />
               </div>
               <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-4 bg-[#202c33] rounded-2xl text-sm font-black text-[#8696a0] active:scale-95 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={confirmExport}
                    className="flex-[2] py-4 bg-[#00e676] rounded-2xl text-sm font-black text-[#0b141a] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Save className="w-5 h-5" /> تأكيد وحفظ
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Sheet */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-end justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#111b21] rounded-t-[4rem] p-12 border-t border-[#00e676]/30 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="w-16 h-1.5 bg-[#3b4a54] rounded-full mx-auto mb-12"></div>
            <div className="flex flex-col items-center mb-14 text-center">
              <div className="w-24 h-24 bg-[#00e676] rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(0,230,118,0.4)] mb-8 rotate-12">
                <Target className="w-14 h-14 text-[#0b141a]" />
              </div>
              <h2 className="text-4xl font-black italic text-white mb-1">تلاشاني</h2>
              <span className="text-[10px] font-black text-[#00e676] uppercase tracking-[0.7em]">Advanced Military Systems</span>
            </div>
            <div className="space-y-4 mb-14">
              <a href="tel:01140029315" className="flex items-center justify-between p-6 bg-[#202c33] rounded-3xl border border-white/5 active:bg-[#2a3942] transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#00e676]/10 flex items-center justify-center text-[#00e676] rounded-2xl"><Phone className="w-7 h-7" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8696a0] uppercase mb-1">الدعم الفني</p>
                    <p className="font-black text-2xl text-white tracking-tighter" dir="ltr">01140029315</p>
                  </div>
                </div>
              </a>
              <a href="https://t.me/Tlashani" target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-[#202c33] rounded-3xl border border-white/5 active:bg-[#2a3942] transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-500/10 flex items-center justify-center text-[#0088cc] rounded-2xl"><MessageCircle className="w-7 h-7" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8696a0] uppercase mb-1">تليجرام</p>
                    <p className="font-black text-2xl text-white tracking-tighter" dir="ltr">@Tlashani</p>
                  </div>
                </div>
              </a>
            </div>
            <button 
              onClick={() => setShowSupport(false)} 
              className="w-full py-5 rounded-3xl bg-[#00e676] text-xl font-black text-[#0b141a] active:scale-95 transition-all shadow-xl"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
